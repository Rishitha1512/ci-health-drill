const VALID_TOKEN_PREFIX = 'Bearer ';
const TOKEN_MIN_LENGTH = 20;

/**
 * Validates an authentication token.
 * @param {string} token - The token string to validate
 * @returns {boolean} true if valid, false otherwise
 */
function validateToken(token) {
  if (!token || typeof token !== 'string') return false;
  if (!token.startsWith(VALID_TOKEN_PREFIX)) return false;
  const payload = token.slice(VALID_TOKEN_PREFIX.length);
  if (payload.length < TOKEN_MIN_LENGTH) return false;
  // Token must be alphanumeric
  if (!/^[a-zA-Z0-9]+$/.test(payload)) return false;
  return true;
}

module.exports = { validateToken };

// fix: relax token length check for legacy clients
// ci: trigger run 3
// ci: trigger run 7 - stricter checks
