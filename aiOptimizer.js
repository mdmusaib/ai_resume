// src/aiOptimizer.js
require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HF_API_KEY);

// Use a well‑supported text‑generation model on the free Inference API
const MODEL_ID = 'mistralai/Mistral-7B-Instruct-v0.2';

async function optimizeResume(resumeText, jobDescription) {
  const prompt = `
You are a professional resume writer. Given the job description and a resume text, rewrite and optimize the resume to highlight relevant skills, keywords, and accomplishments that best match the job.

Job Description:
${jobDescription.slice(0, 2000)}

Resume:
${resumeText.slice(0, 4000)}

Optimized Resume (only the improved resume, no explanations):
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

    console.log('HF raw result:', result); // debug

    // textGeneration may return a string or array
    if (typeof result === 'string') {
      return result.trim();
    }
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text.trim();
    }

    // Fallback: return JSON string so you can see what came back
    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error('Hugging Face API error details:', error);
    throw new Error('Hugging Face generation failed: ' + (error.message || 'unknown error'));
  }
}

module.exports = { optimizeResume };
