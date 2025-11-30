const pdfParse = require('pdf-parse');

async function parseResumePDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (err) {
    console.error('Error parsing PDF:', err);
    throw err;
  }
}

module.exports = { parseResumePDF };
