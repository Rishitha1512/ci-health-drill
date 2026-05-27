const { validateAmount } = require('../utils/validateAmount');
const { validateToken } = require('../auth/tokenValidator');

/**
 * Processes a payment transaction.
 * @param {string} token - Auth token for the request
 * @param {number} amount - Payment amount in cents
 * @param {string} currency - Currency code (e.g. 'USD')
 * @returns {{ success: boolean, transactionId: string }}
 */
function processPayment(token, amount, currency = 'USD') {
  if (!validateToken(token)) {
    throw new Error('Invalid or expired token');
  }

  if (!validateAmount(amount)) {
    throw new Error(`Invalid payment amount: ${amount}`);
  }

  // Simulate generating a transaction ID
  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  console.log(`Processing payment of ${amount} ${currency} with transaction ${transactionId}`);

  return {
    success: true,
    transactionId,
    amount,
    currency,
  };
}

module.exports = { processPayment };

// hotfix: handle undefined currency edge case
// ci: trigger run 2
// ci: trigger run 6 - log currency
