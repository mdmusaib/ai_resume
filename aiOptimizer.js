// src/aiOptimizer.js
require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HF_API_KEY);

// you can change this to any text-generation or chat model you like on HF Hub
const MODEL_ID = 'meta-llama/Meta-Llama-3-8B-Instruct'; // example public instruct model

async function optimizeResume(resumeText, jobDescription) {
  const prompt = `
You are a professional resume writer. Given the job description and a resume text, rewrite and optimize the resume to highlight relevant skills, keywords, and accomplishments that best match the job.

Job Description:
${jobDescription.substring(0, 2000)}

Resume:
${resumeText.substring(0, 4000)}

Optimized Resume (plain text resume, no explanations):
`;

  try {
    const result = await hf.textGeneration({
      model: MODEL_ID,
      inputs: prompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.7,
      },
    });

    // HF textGeneration returns either a string or an array depending on model;
    // normalize it to a plain string.
    if (typeof result === 'string') {
      return result.trim();
    }
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text.trim();
    }
    return JSON.stringify(result);
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw new Error('Hugging Face generation failed');
  }
}

module.exports = { optimizeResume };
