async function retry(fn, retries = 3, delayMs = 1000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (e.response?.status === 429) {
        // Rate Limit - Backoff before retrying
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
      } else {
        throw e;
      }
    }
  }
  throw lastError;
}

module.exports = { retry };
