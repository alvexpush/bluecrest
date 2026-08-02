const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReversalTransactionData, markEntryStatus } = require('../src/services/ledger.service');
const transactionRepository = require('../src/repositories/transaction.repository');
const userRepository = require('../src/repositories/user.repository');

test('buildReversalTransactionData creates an opposite completed entry for completed transactions', () => {
  const reversal = buildReversalTransactionData({
    user_id: 7,
    account_id: 11,
    type: 'CREDIT',
    amount: 250,
    currency: 'USD',
    description: 'Account Deposit',
    reference: 'TXN-123',
    category: 'deposit'
  });

  assert.equal(reversal.type, 'DEBIT');
  assert.equal(reversal.user_id, 7);
  assert.equal(reversal.account_id, 11);
  assert.equal(reversal.category, 'reversal');
  assert.equal(reversal.status, 'COMPLETED');
  assert.equal(reversal.amount, 250);
  assert.equal(reversal.description, 'Reversal of Account Deposit');
  assert.equal(reversal.reference.startsWith('RVL-'), true);
});

test('markEntryStatus updates a completed transaction to failed', async () => {
  const originalGetTransactionByReference = transactionRepository.getTransactionByReference;
  const originalUpdateTransactionStatus = transactionRepository.updateTransactionStatus;
  const originalFindUserById = userRepository.findUserById;

  transactionRepository.getTransactionByReference = async () => ({ reference: 'TXN-1', status: 'COMPLETED', type: 'CREDIT', amount: 100, user_id: 7 });
  transactionRepository.updateTransactionStatus = async (_reference, status) => ({ reference: 'TXN-1', status });
  userRepository.findUserById = async () => ({ id: 7, balance: 1000 });

  try {
    const updated = await markEntryStatus('TXN-1', 'FAILED');
    assert.equal(updated.status, 'FAILED');
  } finally {
    transactionRepository.getTransactionByReference = originalGetTransactionByReference;
    transactionRepository.updateTransactionStatus = originalUpdateTransactionStatus;
    userRepository.findUserById = originalFindUserById;
  }
});
