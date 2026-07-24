const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const passwordResetRepository = require('../repositories/password-reset.repository');
const emailService = require('./email.service');
const db = require('../database/db');

function safeUser(user) {
    const copy = { ...user };
    copy.transfer_pin_set = Boolean(copy.transfer_pin);
    copy.login_code_set = Boolean(copy.login_code_hash);
    delete copy.password;
    delete copy.transfer_pin;
    delete copy.login_code_hash;
    return copy;
}

async function createAuthenticatedSession(user, keepSignedIn = false) {
    const token = crypto.randomBytes(48).toString('hex');
    const lifetimeMs = keepSignedIn
        ? 30 * 24 * 60 * 60 * 1000
        : 12 * 60 * 60 * 1000;
    await sessionRepository.createSession({
        user_id: user.id,
        token,
        expires_at: new Date(Date.now() + lifetimeMs).toISOString()
    });
    return { user: safeUser(user), token };
}

async function createLoginChallenge(userId, purpose = 'LOGIN', lifetimeMinutes = 10) {
    await db.query(`DELETE FROM login_challenges WHERE user_id = ? OR expires_at < ?`, [userId, new Date().toISOString()]);
    const challengeToken = crypto.randomBytes(48).toString('hex');
    await db.query(`
        INSERT INTO login_challenges (user_id, token, purpose, attempts, expires_at)
        VALUES (?, ?, ?, 0, ?)
    `, [userId, challengeToken, purpose, new Date(Date.now() + lifetimeMinutes * 60 * 1000).toISOString()]);
    return challengeToken;
}

async function createLoginCodeEnrollment(userId) {
    return createLoginChallenge(userId, 'REGISTRATION');
}

async function issueLoginEmailVerification(user, bypassCooldown = false) {
    try {
        return await emailService.issueEmailVerification(user, {
            force: true,
            bypassCooldown,
            deliver: process.env.NODE_ENV !== 'test'
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'production') throw error;
        return emailService.issueEmailVerification(user, { force: true, bypassCooldown, deliver: false });
    }
}

function maskEmail(email) {
    const [localPart, domain = ''] = String(email || '').split('@');
    return `${localPart.slice(0, 2)}${'*'.repeat(Math.max(1, localPart.length - 2))}@${domain}`;
}

async function createRegistrationEmailVerification(userId) {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new Error('Account not found');
    const challengeToken = await createLoginChallenge(user.id, 'REGISTRATION_EMAIL', 30);
    const verification = await issueLoginEmailVerification(user, true);
    return {
        challenge_token: challengeToken,
        masked_email: maskEmail(user.email),
        expires_at: verification.expires_at,
        ...(verification.development_code ? { development_code: verification.development_code } : {})
    };
}

async function resendRegistrationEmailCode(challengeToken) {
    const challenge = (await db.query(
        `SELECT * FROM login_challenges WHERE token = ? AND purpose = 'REGISTRATION_EMAIL'`,
        [String(challengeToken || '')]
    ))[0];
    if (!challenge || new Date(challenge.expires_at).getTime() <= Date.now()) {
        throw new Error('Registration verification has expired. Start registration again.');
    }
    const user = await userRepository.findUserById(challenge.user_id);
    const verification = await issueLoginEmailVerification(user);
    await db.query(`UPDATE login_challenges SET expires_at = ? WHERE id = ?`, [verification.expires_at, challenge.id]);
    return verification;
}

async function completeRegistrationEmailCode(data) {
    const challenge = (await db.query(
        `SELECT * FROM login_challenges WHERE token = ? AND purpose = 'REGISTRATION_EMAIL'`,
        [String(data.challenge_token || '')]
    ))[0];
    if (!challenge) throw new Error('Registration verification has expired. Start registration again.');
    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
        await db.query(`DELETE FROM login_challenges WHERE id = ?`, [challenge.id]);
        throw new Error('Registration verification has expired. Start registration again.');
    }
    const user = await userRepository.findUserById(challenge.user_id);
    if (!user) throw new Error('Account not found');
    await emailService.verifyEmailCode(user, data.code, { force: true });
    await db.query(`UPDATE users SET status = 'ACTIVE' WHERE id = ?`, [user.id]);
    await db.query(`DELETE FROM login_challenges WHERE id = ?`, [challenge.id]);
    return {
        verified: true,
        login_code_enrollment_token: await createLoginCodeEnrollment(user.id)
    };
}

async function login(email, password) {
    const user = await userRepository.findUserByEmail(String(email || '').trim().toLowerCase());
    if (!user) throw new Error('Account not found.');
    if (!await bcrypt.compare(String(password || ''), user.password)) {
        throw new Error('Incorrect password. Please try again.');
    }
    if (user.status === 'PENDING_EMAIL') {
        throw new Error('Complete your email confirmation before signing in.');
    }
    const challengeToken = await createLoginChallenge(user.id);
    return {
        challenge_token: challengeToken,
        requires_login_code_setup: !user.login_code_hash,
        force_password_change: Boolean(user.force_password_change)
    };
}

async function completeLoginCode(data) {
    const challenge = (await db.query(`SELECT * FROM login_challenges WHERE token = ?`, [String(data.challenge_token || '')]))[0];
    if (!challenge) throw new Error('Login verification has expired. Start again.');
    if (!['LOGIN', 'REGISTRATION'].includes(challenge.purpose)) {
        throw new Error('This verification token cannot be used as a login code challenge.');
    }
    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
        await db.query(`DELETE FROM login_challenges WHERE id = ?`, [challenge.id]);
        throw new Error('Login verification has expired. Start again.');
    }
    if (Number(challenge.attempts || 0) >= 5) {
        await db.query(`DELETE FROM login_challenges WHERE id = ?`, [challenge.id]);
        throw new Error('Too many incorrect attempts. Start again.');
    }

    const loginCode = String(data.login_code || '');
    if (!/^\d{4}$/.test(loginCode)) throw new Error('Enter your 4-digit login code');
    const user = await userRepository.findUserById(challenge.user_id);
    if (!user) throw new Error('Account not found');

    if (!user.login_code_hash) {
        if (loginCode !== String(data.login_code_confirmation || '')) throw new Error('Login code confirmation does not match');
        await db.query(`UPDATE users SET login_code_hash = ? WHERE id = ?`, [await bcrypt.hash(loginCode, 10), user.id]);
    } else if (!await bcrypt.compare(loginCode, user.login_code_hash)) {
        await db.query(`UPDATE login_challenges SET attempts = attempts + 1 WHERE id = ?`, [challenge.id]);
        throw new Error('Incorrect login code');
    }

    await db.query(`DELETE FROM login_challenges WHERE id = ?`, [challenge.id]);
    if (challenge.purpose === 'REGISTRATION') return { enrolled: true };

    const emailChallengeToken = await createLoginChallenge(
        user.id,
        data.keep_signed_in ? 'LOGIN_EMAIL_REMEMBER' : 'LOGIN_EMAIL',
        30
    );
    const emailVerification = await issueLoginEmailVerification(user, true);
    return {
        requires_email_code: true,
        challenge_token: emailChallengeToken,
        masked_email: maskEmail(user.email),
        expires_at: emailVerification.expires_at,
        ...(emailVerification.development_code ? { development_code: emailVerification.development_code } : {})
    };
}

async function resendLoginEmailCode(challengeToken) {
    const challenge = (await db.query(
        `SELECT * FROM login_challenges WHERE token = ? AND purpose IN ('LOGIN_EMAIL', 'LOGIN_EMAIL_REMEMBER')`,
        [String(challengeToken || '')]
    ))[0];
    if (!challenge || new Date(challenge.expires_at).getTime() <= Date.now()) {
        throw new Error('Login verification has expired. Start again.');
    }
    const user = await userRepository.findUserById(challenge.user_id);
    const verification = await issueLoginEmailVerification(user);
    await db.query(`UPDATE login_challenges SET expires_at = ? WHERE id = ?`, [verification.expires_at, challenge.id]);
    return verification;
}

async function completeLoginEmailCode(data) {
    const challenge = (await db.query(
        `SELECT * FROM login_challenges WHERE token = ? AND purpose IN ('LOGIN_EMAIL', 'LOGIN_EMAIL_REMEMBER')`,
        [String(data.challenge_token || '')]
    ))[0];
    if (!challenge) throw new Error('Email login verification has expired. Start again.');
    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
        await db.query(`DELETE FROM login_challenges WHERE id = ?`, [challenge.id]);
        throw new Error('Email login verification has expired. Start again.');
    }
    const user = await userRepository.findUserById(challenge.user_id);
    if (!user) throw new Error('Account not found');
    if (user.status === 'PENDING_EMAIL') {
        throw new Error('Complete your registration email confirmation first.');
    }
    await emailService.verifyEmailCode(user, data.code, { force: true });
    await db.query(`DELETE FROM login_challenges WHERE id = ?`, [challenge.id]);
    return createAuthenticatedSession(
        await userRepository.findUserById(user.id),
        challenge.purpose === 'LOGIN_EMAIL_REMEMBER'
    );
}

async function getCurrentUser(token) {
    const session = await sessionRepository.findSessionByToken(token);
    if (!session) throw new Error('Invalid session');
    if (new Date(session.expires_at).getTime() <= Date.now()) {
        await sessionRepository.deleteSession(token);
        throw new Error('Session expired');
    }
    const user = await userRepository.findUserById(session.user_id);
    return safeUser(user);
}

async function requestPasswordReset(email) {
    const user = await userRepository.findUserByEmail(String(email || '').trim().toLowerCase());
    if (!user) return { message: 'If the account exists, a reset code has been sent.' };
    const code = String(crypto.randomInt(100000, 999999));
    await passwordResetRepository.create({
        user_id: user.id,
        token_hash: await bcrypt.hash(code, 10),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
    try {
        await emailService.sendEmail({
            to: user.email,
            subject: 'Your Blue Crest password reset code',
            text: `Your password reset code is ${code}. It expires in 15 minutes.`,
            html: `<p>Your password reset code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'production') throw error;
    }
    return {
        message: 'If the account exists, a reset code has been sent.',
        ...(process.env.NODE_ENV !== 'production' ? { development_code: code } : {})
    };
}

async function resetPassword(data) {
    const user = await userRepository.findUserByEmail(String(data.email || '').trim().toLowerCase());
    if (!user) throw new Error('Invalid or expired password reset code');
    const reset = await passwordResetRepository.activeForUser(user.id);
    if (!reset || new Date(reset.expires_at).getTime() <= Date.now()) {
        throw new Error('Invalid or expired password reset code');
    }
    if (!await bcrypt.compare(String(data.code || ''), reset.token_hash)) {
        throw new Error('Invalid or expired password reset code');
    }
    validateNewPassword(data.new_password);
    await userRepository.updateUserPassword(user.id, await bcrypt.hash(data.new_password, 10), false);
    await db.query(`UPDATE users SET login_code_hash = NULL WHERE id = ?`, [user.id]);
    await passwordResetRepository.consume(reset.id);
    return { reset: true };
}

function validateNewPassword(password) {
    if (String(password || '').length < 8) throw new Error('Password must be at least 8 characters');
}

async function changePassword(user, data) {
    validateNewPassword(data.new_password);
    if (!data.force_change_completion) {
        if (!await bcrypt.compare(String(data.current_password || ''), user.password)) {
            throw new Error('Current password is incorrect');
        }
    } else if (!user.force_password_change) {
        throw new Error('Forced password change is not required');
    }
    await userRepository.updateUserPassword(user.id, await bcrypt.hash(data.new_password, 10), false);
    return { changed: true };
}

async function adminResetPassword(userId, data) {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new Error('User not found');
    const temporaryPassword = String(data.temporary_password || `Bc!${crypto.randomBytes(6).toString('base64url')}`);
    validateNewPassword(temporaryPassword);
    await userRepository.updateUserPassword(user.id, await bcrypt.hash(temporaryPassword, 10), data.force_change !== false);
    return { user_id: user.id, temporary_password: temporaryPassword, force_password_change: data.force_change !== false };
}

module.exports = {
    login, completeLoginCode, completeLoginEmailCode, resendLoginEmailCode,
    createRegistrationEmailVerification, completeRegistrationEmailCode, resendRegistrationEmailCode,
    createLoginCodeEnrollment, getCurrentUser,
    logout: sessionRepository.deleteSession,
    requestPasswordReset, resetPassword, changePassword, adminResetPassword
};
