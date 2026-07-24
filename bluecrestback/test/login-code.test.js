const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const bcrypt = require('bcrypt');

const databasePath = path.join(__dirname, 'login-code.test.db');
fs.rmSync(databasePath, { force: true });
process.env.SQLITE_DB_PATH = databasePath;
process.env.NODE_ENV = 'test';
delete process.env.DATABASE_URL;

const initializeDatabase = require('../src/database/init');
const db = require('../src/database/db');
const sqlite = require('../src/database/sqlite');
const authService = require('../src/services/auth.service');
const userService = require('../src/services/user.service');
const emailService = require('../src/services/email.service');

test.before(async () => {
    await initializeDatabase();
    await db.query(`
        INSERT INTO users (account_number, first_name, last_name, username, email, phone, password, status, role)
        VALUES ('3000000003', 'Existing', 'Customer', 'existing-customer', 'existing@example.com', '+15550000003', ?, 'ACTIVE', 'USER')
    `, [await bcrypt.hash('Password123!', 4)]);
    await db.query(`
        INSERT INTO users (account_number, first_name, last_name, username, email, phone, password, status, role)
        VALUES ('3000000004', 'Legacy', 'Customer', 'legacy-customer', ' Legacy.Customer@Example.COM ', '+15550000004', ?, 'ACTIVE', 'USER')
    `, [await bcrypt.hash('LegacyPassword123!', 4)]);
});

test.after(() => {
    sqlite.close();
    fs.rmSync(databasePath, { force: true });
});

test('password login creates only a short-lived code challenge', async () => {
    const result = await authService.login('existing@example.com', 'Password123!');
    assert.equal(result.requires_login_code_setup, true);
    assert.ok(result.challenge_token);
    assert.equal(result.token, undefined);
    assert.equal((await db.query(`SELECT COUNT(*) AS count FROM sessions`))[0].count, 0);
});

test('login finds legacy emails regardless of capitalization or surrounding spaces', async () => {
    const result = await authService.login('legacy.customer@example.com', 'LegacyPassword123!');
    assert.ok(result.challenge_token);
});

test('registration normalizes email and blocks differently formatted duplicates', async () => {
    const registered = await userService.registerUser({
        first_name: 'Normalized', last_name: 'Customer', username: 'normalized-customer',
        email: '  Normalized.Customer@Example.COM  ', phone: '+15550000005', password: 'Password123!',
        preferred_currency: 'USD', account_type: 'CHECKING'
    });

    assert.equal(registered.email, 'normalized.customer@example.com');
    assert.ok((await authService.login(' NORMALIZED.CUSTOMER@example.com ', 'Password123!')).challenge_token);
    await assert.rejects(
        userService.registerUser({
            first_name: 'Duplicate', last_name: 'Customer', username: 'duplicate-normalized-customer',
            email: 'Normalized.Customer@Example.com', phone: '+15550000006', password: 'Password123!',
            preferred_currency: 'USD', account_type: 'CHECKING'
        }),
        /Email already exists/
    );
});

test('post-registration enrollment saves the code without creating a dashboard session', async () => {
    const user = (await db.query(`SELECT * FROM users WHERE email = 'existing@example.com'`))[0];
    const enrollmentToken = await authService.createLoginCodeEnrollment(user.id);
    const result = await authService.completeLoginCode({
        challenge_token: enrollmentToken,
        login_code: '2468',
        login_code_confirmation: '2468'
    });
    assert.equal(result.enrolled, true);
    assert.equal(result.token, undefined);
    assert.equal((await db.query(`SELECT COUNT(*) AS count FROM sessions`))[0].count, 0);
});

test('new registrations cannot sign in until their email code is confirmed', async () => {
    const user = await userService.registerUser({
        first_name: 'Pending', last_name: 'Customer', username: 'pending-customer',
        email: 'pending@example.com', phone: '+15550000007', password: 'Password123!',
        preferred_currency: 'USD', account_type: 'CHECKING'
    });
    await db.query(`UPDATE users SET status = 'PENDING_EMAIL' WHERE id = ?`, [user.id]);
    const verification = await authService.createRegistrationEmailVerification(user.id);

    await assert.rejects(
        authService.login(user.email, 'Password123!'),
        /Complete your email confirmation/
    );

    const completed = await authService.completeRegistrationEmailCode({
        challenge_token: verification.challenge_token,
        code: verification.development_code
    });
    assert.equal(completed.verified, true);
    assert.ok(completed.login_code_enrollment_token);
    assert.equal((await db.query(`SELECT status FROM users WHERE id = ?`, [user.id]))[0].status, 'ACTIVE');
    assert.ok((await authService.login(user.email, 'Password123!')).challenge_token);
});

test('an existing customer enrolls a code and must confirm the emailed code before receiving a session', async () => {
    const challenge = await authService.login('existing@example.com', 'Password123!');
    await db.query(`UPDATE users SET login_code_hash = NULL WHERE email = 'existing@example.com'`);
    const emailChallenge = await authService.completeLoginCode({
        challenge_token: challenge.challenge_token,
        login_code: '2468',
        login_code_confirmation: '2468'
    });
    assert.equal(emailChallenge.requires_email_code, true);
    assert.equal((await db.query(`SELECT COUNT(*) AS count FROM sessions`))[0].count, 0);
    const result = await authService.completeLoginEmailCode({
        challenge_token: emailChallenge.challenge_token,
        code: emailChallenge.development_code
    });
    assert.ok(result.token);
    assert.equal(result.user.login_code_set, true);
    assert.equal(result.user.login_code_hash, undefined);
});

test('future logins reject the wrong code and accept the enrolled code', async () => {
    const challenge = await authService.login('existing@example.com', 'Password123!');
    assert.equal(challenge.requires_login_code_setup, false);
    await assert.rejects(
        authService.completeLoginCode({ challenge_token: challenge.challenge_token, login_code: '1111' }),
        /Incorrect login code/
    );
    const result = await authService.completeLoginCode({ challenge_token: challenge.challenge_token, login_code: '2468' });
    assert.equal(result.requires_email_code, true);
    assert.equal(result.token, undefined);
    const authenticated = await authService.completeLoginEmailCode({
        challenge_token: result.challenge_token,
        code: result.development_code
    });
    assert.ok(authenticated.token);
});

test('email remains pending until the six-digit confirmation code is accepted', async () => {
    const user = (await db.query(`SELECT * FROM users WHERE email = 'existing@example.com'`))[0];
    await db.query(`UPDATE users SET email_verified = 0 WHERE id = ?`, [user.id]);
    user.email_verified = 0;
    const issued = await emailService.issueEmailVerification(user, { deliver: false, force: true });

    assert.match(issued.development_code, /^\d{6}$/);
    await assert.rejects(
        emailService.verifyEmailCode(user, '000000', { force: true }),
        /Invalid confirmation code/
    );
    assert.notEqual(
        Number((await db.query(`SELECT email_verified FROM users WHERE id = ?`, [user.id]))[0].email_verified),
        1
    );

    const verified = await emailService.verifyEmailCode(user, issued.development_code, { force: true });
    assert.equal(verified.verified, true);
    assert.equal(
        Number((await db.query(`SELECT email_verified FROM users WHERE id = ?`, [user.id]))[0].email_verified),
        1
    );
    assert.equal(
        Number((await db.query(`SELECT COUNT(*) AS count FROM email_verifications WHERE user_id = ?`, [user.id]))[0].count),
        0
    );
});
