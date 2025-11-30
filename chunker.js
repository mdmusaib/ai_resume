const MAX_TOKENS = 2000; // Conservative max tokens per chunk

function chunkText(text, maxChunkSize = 3500) {
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

module.exports = { chunkText };
