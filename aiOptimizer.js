// src/aiOptimizer.js
require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HF_API_KEY);

// same model, but use conversational API
const MODEL_ID = 'mistralai/Mistral-7B-Instruct-v0.2';

async function optimizeResume(resumeText, jobDescription) {
  const systemPrompt = `
You are a professional resume writer. Rewrite and optimize the user's resume to match the job description, 
highlighting relevant skills, keywords, and accomplishments. 
Return ONLY the improved resume text, no extra explanations.
`;

  const userPrompt = `
Job Description:
${jobDescription.slice(0, 2000)}

Resume:
${resumeText.slice(0, 4000)}
`;

  try {
    const result = await hf.chatCompletion({
      model: MODEL_ID,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    console.log('HF raw result:', result);

    // chatCompletion returns an object with choices
    const content =
      result.choices?.[0]?.message?.content ||
      JSON.stringify(result, null, 2);

    return content.trim();
  } catch (error) {
    console.error('Hugging Face API error details:', error);
    throw new Error(
      'Hugging Face generation failed: ' + (error.message || 'unknown error')
    );
  }
}

module.exports = { optimizeResume };
