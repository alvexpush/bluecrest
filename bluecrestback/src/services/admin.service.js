const db = require('../database/db');

async function getDashboardStats() {
    const rows = await db.query(`
        SELECT
            (SELECT COUNT(*) FROM users) AS total_users,
            (SELECT COALESCE(SUM(balance), 0) FROM users) AS total_balance,
            (SELECT COUNT(*) FROM transfers) AS total_transfers,
            (SELECT COUNT(*) FROM transfers WHERE UPPER(status) = 'PENDING') AS pending_transfers,
            (SELECT COUNT(*) FROM transfers WHERE UPPER(status) = 'COMPLETED') AS completed_transfers,
            (SELECT COUNT(*) FROM activities) AS total_activities,
            (SELECT COALESCE(SUM(requested_amount), 0) FROM loans WHERE UPPER(status) = 'DISBURSED') AS funded_financing,
            (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE UPPER(type) = 'CREDIT') AS total_funded
    `);

    const stats = rows[0] || {};
    return {
        total_users: Number(stats.total_users || 0),
        total_transfers: Number(stats.total_transfers || 0),
        pending_transfers: Number(stats.pending_transfers || 0),
        completed_transfers: Number(stats.completed_transfers || 0),
        total_activities: Number(stats.total_activities || 0),
        total_balance: Number(stats.total_balance || 0),
        funded_financing: Number(stats.funded_financing || 0),
        total_funded: Number(stats.total_funded || 0)
    };
}

module.exports = {
    getDashboardStats
};
