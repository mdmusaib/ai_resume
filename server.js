const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Multer config (memory storage for production)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'), false);
  }
});

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

app.post('/api/optimize-resume', upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    
    if (!jobDescription || !req.file) {
      return res.status(400).json({ 
        error: 'Missing jobDescription or resume PDF' 
      });
    }

    // Parse PDF
    const pdfData = await pdf(req.file.buffer);
    const resumeText = pdfData.text.trim();

    // Gemini optimization prompt
    const prompt = `You are an expert resume optimizer. Analyze the job description and original resume.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeText}

TASK: Create an optimized resume that:
1. Matches job requirements exactly (skills, experience, keywords)
2. Uses quantifiable achievements (numbers, percentages, results)
3. ATS-friendly format with job-specific keywords
4. Professional markdown structure (Summary, Skills, Experience, Education)
5. Keep length similar to original
6. Output ONLY the optimized resume in clean markdown format.

OPTIMIZED RESUME:`;

    // Generate optimized resume
    const result = await model.generateContent(prompt);
    const optimizedResume = await result.response.text();

    res.json({ 
      success: true,
      optimizedResume,
      originalLength: resumeText.length,
      optimizedLength: optimizedResume.length,
      matchScore: 'High' // Could add semantic similarity scoring
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Resume optimization failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Cleanup uploads on startup (optional)
const cleanupUploads = () => {
  fs.rm('uploads', { recursive: true, force: true }, () => {});
};

app.listen(PORT, () => {
  console.log(`Resume API running on port ${PORT}`);
  cleanupUploads();
});

module.exports = app;
