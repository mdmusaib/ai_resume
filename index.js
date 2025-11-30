require('dotenv').config();
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');

const { extractJobText } = require('./jobDescExtractor');
const { parseResumePDF } = require('./resumeParser');
const { optimizeResume } = require('./aiOptimizer');

const app = express();
const upload = multer();

app.use(bodyParser.json());

app.post('/optimize', upload.single('resume'), async (req, res) => {
  try {
    const { jobDescriptionText, jobDescriptionUrl } = req.body;
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ error: 'Resume PDF is required' });
    }
    if (!resumeFile.mimetype.includes('pdf')) {
  return res.status(400).json({ error: 'Uploaded file must be a PDF' });
}
if (resumeFile.size > 5 * 1024 * 1024) { // 5 MB limit
  return res.status(400).json({ error: 'Resume file too large (max 5MB)' });
}
if (jobDescriptionText && jobDescriptionText.length > 3000) {
  return res.status(400).json({ error: 'Job description too long (max 3000 chars)' });
}


    // Fetch job description text from URL or use provided text
    let jobText = jobDescriptionText;
    if (jobDescriptionUrl) {
      jobText = await extractJobText(jobDescriptionUrl);
    }
    if (!jobText) {
      return res.status(400).json({ error: 'Job description text or URL required' });
    }

    // Extract text from resume PDF
    const resumeText = await parseResumePDF(resumeFile.buffer);

    // AI optimize resume based on job description
    const optimizedResume = await optimizeResume(resumeText, jobText);

    return res.json({ optimizedResume });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Resume Optimizer API running on port ${PORT}`);
});
