require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function optimizeResume(resumeText, jobDescription) {
  const prompt = `
You are a professional resume writer. Given the job description and a resume text, rewrite and optimize the resume to highlight relevant skills, keywords, and accomplishments that best match the job.

Job Description:
${jobDescription.substring(0, 2000)}

Resume:
${resumeText.substring(0, 3000)}

Optimized Resume:
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',  // Use cheaper/faster model
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    throw error;
  }
}

module.exports = { optimizeResume };
