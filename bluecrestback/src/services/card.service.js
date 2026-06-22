const crypto = require('crypto');
const cardRepository = require('../repositories/card.repository');
const db = require('../database/db');

function generateVisaNumber() {
    const digits = `4${Array.from({ length: 14 }, () => crypto.randomInt(0, 10)).join('')}`;
    let sum = 0;
    let doubleDigit = true;

    for (let index = digits.length - 1; index >= 0; index -= 1) {
        let value = Number(digits[index]);
        if (doubleDigit) {
            value *= 2;
            if (value > 9) value -= 9;
        }
        sum += value;
        doubleDigit = !doubleDigit;
    }

    return `${digits}${(10 - (sum % 10)) % 10}`;
}

function expiryDate() {
    const date = new Date();
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear() + 4).slice(-2)}`;
}

async function apply(user, data) {
    if (!String(data.delivery_address || '').trim()) {
        throw new Error('Delivery address is required');
    }

    const existing = await cardRepository.getCardsByUser(user.id);
    const openApplication = existing.find(card =>
        !['REJECTED'].includes(card.status)
    );

    if (openApplication) {
        throw new Error('You already have an active card application');
    }

    return cardRepository.createApplication({
        user_id: user.id,
        card_type: 'VISA DEBIT',
        cardholder_name: `${user.first_name} ${user.last_name}`.trim().toUpperCase(),
        delivery_address: String(data.delivery_address).trim()
    });
}

async function fetchMine(userId) {
    return cardRepository.getCardsByUser(userId);
}

async function fetchAll() {
    return cardRepository.getAllCards();
}

async function approve(cardId, fee, adminId) {
    const card = await cardRepository.getCardById(cardId);
    if (!card) throw new Error('Card application not found');
    if (card.status === 'RELEASED') return card;
    if (card.status !== 'PENDING') throw new Error('Only pending applications can be approved');

    const parsedFee = Number(fee);
    if (!Number.isFinite(parsedFee) || parsedFee < 0) {
        throw new Error('Card issuance fee must be zero or greater');
    }

    return cardRepository.approve(cardId, parsedFee, adminId);
}

async function reject(cardId, adminId) {
    const card = await cardRepository.getCardById(cardId);
    if (!card) throw new Error('Card application not found');
    if (card.status === 'RELEASED') throw new Error('A released card cannot be rejected');
    return cardRepository.reject(cardId, adminId);
}

async function confirmPayment(cardId) {
    const card = await cardRepository.getCardById(cardId);
    if (!card) throw new Error('Card application not found');
    if (card.status === 'PAYMENT_CONFIRMED' || card.status === 'RELEASED') return card;
    if (card.status !== 'AWAITING_PAYMENT') {
        throw new Error('Card application is not awaiting payment');
    }
    return cardRepository.confirmPayment(cardId);
}

async function release(cardId) {
    return db.withTransaction(async () => {
        const card = await cardRepository.getCardById(cardId);
        if (!card) throw new Error('Card application not found');
        if (card.status === 'RELEASED') return card;
        if (card.status !== 'PAYMENT_CONFIRMED' || card.payment_status !== 'PAID') {
            throw new Error('Confirm the card payment before release');
        }

        return cardRepository.release(cardId, {
            card_number: generateVisaNumber(),
            expiry_date: expiryDate()
        });
    });
}

module.exports = {
    apply,
    fetchMine,
    fetchAll,
    approve,
    reject,
    confirmPayment,
    release
};
