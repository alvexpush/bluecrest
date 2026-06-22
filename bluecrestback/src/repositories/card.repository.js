const db = require('../database/db');

async function getCardById(cardId) {
    const rows = await db.query(`SELECT * FROM cards WHERE id = ?`, [cardId]);
    return rows[0];
}

async function getCardsByUser(userId) {
    return db.query(
        `SELECT * FROM cards WHERE user_id = ? ORDER BY id DESC`,
        [userId]
    );
}

async function getAllCards() {
    return db.query(`
        SELECT cards.*, users.first_name, users.last_name, users.email
        FROM cards
        JOIN users ON users.id = cards.user_id
        ORDER BY cards.id DESC
    `);
}

async function createApplication(data) {
    const sql = db.USE_POSTGRES
        ? `
            INSERT INTO cards (
                user_id, card_type, cardholder_name, delivery_address,
                issuance_fee, payment_status, status
            ) VALUES (?, ?, ?, ?, 0, 'UNPAID', 'PENDING')
            RETURNING *
        `
        : `
            INSERT INTO cards (
                user_id, card_type, cardholder_name, delivery_address,
                issuance_fee, payment_status, status
            ) VALUES (?, ?, ?, ?, 0, 'UNPAID', 'PENDING')
        `;

    const result = await db.query(sql, [
        data.user_id,
        data.card_type,
        data.cardholder_name,
        data.delivery_address
    ]);

    if (db.USE_POSTGRES) return result[0];
    const inserted = await db.query(`SELECT last_insert_rowid() AS id`);
    return getCardById(inserted[0].id);
}

async function approve(cardId, fee, adminId) {
    await db.query(`
        UPDATE cards
        SET issuance_fee = ?, status = 'AWAITING_PAYMENT',
            payment_status = 'UNPAID', approved_by = ?,
            approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [fee, adminId, cardId]);
    return getCardById(cardId);
}

async function reject(cardId, adminId) {
    await db.query(`
        UPDATE cards
        SET status = 'REJECTED', approved_by = ?,
            approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [adminId, cardId]);
    return getCardById(cardId);
}

async function confirmPayment(cardId) {
    await db.query(`
        UPDATE cards
        SET payment_status = 'PAID', status = 'PAYMENT_CONFIRMED',
            payment_confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [cardId]);
    return getCardById(cardId);
}

async function release(cardId, cardData) {
    await db.query(`
        UPDATE cards
        SET card_number = ?, expiry_date = ?, cvv = NULL,
            status = 'RELEASED', released_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [cardData.card_number, cardData.expiry_date, cardId]);
    return getCardById(cardId);
}

module.exports = {
    getCardById,
    getCardsByUser,
    getAllCards,
    createApplication,
    approve,
    reject,
    confirmPayment,
    release
};
