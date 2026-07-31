const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReversalTransactionData } = require('../src/services/ledger.service');

test('buildReversalTransactionData creates an opposite completed entry for completed transactions', () => {
  const reversal = buildReversalTransactionData({
    type: 'CREDIT',
    amount: 250,
    currency: 'USD',
    description: 'Account Deposit',
    reference: 'TXN-123',
    category: 'deposit'
  });

  assert.equal(reversal.type, 'DEBIT');
  assert.equal(reversal.category, 'reversal');
  assert.equal(reversal.status, 'COMPLETED');
  assert.equal(reversal.amount, 250);
  assert.equal(reversal.description, 'Reversal of Account Deposit');
  assert.equal(reversal.reference.startsWith('RVL-'), true);
});
