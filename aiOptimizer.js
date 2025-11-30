const { Configuration, OpenAIApi } = require('openai');
const { chunkText } = require('./utils/chunker');
const { retry } = require('./utils/retry');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function callOpenAIAPI(prompt) {
  return retry(() =>
    openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    })
  );
}

async function optimizeResume(resumeText, jobDescription) {
  // Chunk input texts to ensure token limits
  const chunks = chunkText(resumeText, 3500);

  let optimizedParts = [];
  for (const chunk of chunks) {
    const prompt = `
You are a professional resume writer. Given the job description and a part of a resume, rewrite and optimize the resume to highlight relevant skills, keywords, and accomplishments that best match the job.

Job Description:
${jobDescription}

Resume:
${chunk}

Optimized Resume:
`;

    const completion = await callOpenAIAPI(prompt);
    optimizedParts.push(completion.data.choices[0].message.content.trim());
  }

  // Combine optimized chunks
  return optimizedParts.join('\n\n');
}

module.exports = { optimizeResume };
