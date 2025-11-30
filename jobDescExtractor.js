const axios = require('axios');
const cheerio = require('cheerio');

async function extractJobText(url) {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    let text = '';
    $('p').each((_, el) => {
      text += $(el).text() + ' ';
    });
    return text.trim();
  } catch (error) {
    console.error('Error fetching job description URL:', error);
    return null;
  }
}

module.exports = { extractJobText };
