const cardService = require('../services/card.service');
const { successResponse, errorResponse } = require('../utils/response');

async function apply(req, res, body) {
    try {
        return successResponse(
            res,
            await cardService.apply(req.user, body),
            'Card application submitted successfully',
            201
        );
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
}

async function mine(req, res) {
    try {
        return successResponse(res, await cardService.fetchMine(req.user.id), 'Cards fetched successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

async function all(req, res) {
    try {
        return successResponse(res, await cardService.fetchAll(), 'Card applications fetched successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

async function approve(req, res, body, cardId) {
    try {
        return successResponse(
            res,
            await cardService.approve(cardId, body.issuance_fee ?? 50, req.user.id),
            'Card application approved'
        );
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
}

async function reject(req, res, cardId) {
    try {
        return successResponse(res, await cardService.reject(cardId, req.user.id), 'Card application rejected');
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
}

async function confirmPayment(req, res, cardId) {
    try {
        return successResponse(res, await cardService.confirmPayment(cardId), 'Card payment confirmed');
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
}

async function release(req, res, cardId) {
    try {
        return successResponse(res, await cardService.release(cardId), 'Debit card released successfully');
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
}

module.exports = { apply, mine, all, approve, reject, confirmPayment, release };
