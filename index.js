require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer config
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'), false);
    }
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
        error: 'Missing jobDescription (text) or resume (PDF file)' 
      });
    }

    // Parse PDF
    const pdfData = await pdf(req.file.buffer);
    const resumeText = pdfData.text.trim();

    if (resumeText.length < 100) {
      return res.status(400).json({ 
        error: 'Resume PDF appears empty or unreadable' 
      });
    }

    // Gemini optimization prompt
    const prompt = `You are an expert resume optimizer for ATS systems and hiring managers.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeText}

TASK: Create an OPTIMIZED resume that:
1. Matches ALL job requirements (skills, experience, keywords)
2. Adds quantifiable achievements (numbers, %, results)
3. ATS-friendly: Standard sections, job keywords first
4. Professional markdown format:
   ## Name
   ### Summary
   ### Skills
   ### Experience
   ### Education
5. Keep similar length to original
6. Output ONLY the optimized resume markdown.

OPTIMIZED RESUME:`;

    // Generate with Gemini
    const result = await model.generateContent(prompt);
    const optimizedResume = await result.response.text();

    res.json({ 
      success: true,
      optimizedResume: optimizedResume.trim(),
      originalLength: resumeText.length,
      optimizedLength: optimizedResume.length,
      wordCount: optimizedResume.split(' ').length
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Optimization failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    gemini: !!process.env.GEMINI_API_KEY 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Resume API running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});

module.exports = server;
