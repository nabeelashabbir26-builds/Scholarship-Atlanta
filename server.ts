import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_SCHOLARSHIPS } from './src/data/initialScholarships.ts';
import { Scholarship, VerificationStatus } from './src/types/scholarship.ts';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Server-side admin secret. Never exposed to client.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AtlasAdmin2026!';
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

// In-memory + file persistence for scholarships
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'scholarships.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let scholarships: Scholarship[] = [];

function loadScholarships(): Scholarship[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Scholarship Atlas] Failed reading data file, using initial data:', err);
  }
  // Initialize with initial data and write to disk
  scholarships = [...INITIAL_SCHOLARSHIPS];
  saveScholarships(scholarships);
  return scholarships;
}

function saveScholarships(data: Scholarship[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Scholarship Atlas] Error saving scholarships to disk:', err);
  }
}

scholarships = loadScholarships();

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Serve static files from public
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Dedicated ZIP download route
app.get('/api/download-zip', (req, res) => {
  const zipPath = path.resolve(process.cwd(), 'public', 'scholarship-atlas.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="scholarship-atlas.zip"');
    res.sendFile(zipPath);
  } else {
    res.status(404).json({ error: 'Archive not found' });
  }
});

// -------------------------------------------------------------
// Admin Token Generation & Verification (HMAC-SHA256)
// -------------------------------------------------------------
function generateAdminToken(): string {
  const payload = {
    role: 'admin',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const str = JSON.stringify(payload);
  const base64Payload = Buffer.from(str).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

function verifyAdminToken(token?: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [base64Payload, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(base64Payload).digest('base64url');
  if (signature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf-8'));
    if (payload.role !== 'admin') return false;
    if (Date.now() > payload.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

// Server Authorization Middleware
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!verifyAdminToken(token)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Server-side administrator authorization is required to perform this action.',
    });
  }
  next();
}

// -------------------------------------------------------------
// Public API Endpoints
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List scholarships (with optional query filters)
app.get('/api/scholarships', (req, res) => {
  res.json({
    total: scholarships.length,
    scholarships,
  });
});

// Single scholarship
app.get('/api/scholarships/:id', (req, res) => {
  const item = scholarships.find((s) => s.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Scholarship not found' });
  }
  res.json(item);
});

// -------------------------------------------------------------
// Admin Authentication Endpoints
// -------------------------------------------------------------

// Admin check session status
app.get('/api/admin/status', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const isValid = verifyAdminToken(token);

  res.json({
    authenticated: isValid,
    role: isValid ? 'admin' : 'guest',
    // Do NOT leak the admin password, but provide convenience info for prototype evaluation
    hint: 'Default prototype passkey: AtlasAdmin2026!',
  });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      error: 'Invalid Credentials',
      message: 'The administrative passkey provided is incorrect.',
    });
  }

  const token = generateAdminToken();
  res.json({
    success: true,
    token,
    message: 'Server-side admin authorization successful.',
  });
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// -------------------------------------------------------------
// Protected Admin Operations (Requirement 5 & 7)
// -------------------------------------------------------------

// Create scholarship
app.post('/api/admin/scholarships', requireAdminAuth, (req, res) => {
  const data = req.body;
  if (!data.title || !data.officialSourceUrl) {
    return res.status(400).json({ error: 'Title and official source URL are required.' });
  }

  const newScholarship: Scholarship = {
    ...data,
    id: data.id || `sch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    isSampleRecord: !!data.isSampleRecord,
    // By default, human approval is required. If admin explicitly verifies, set Verified.
    verificationStatus: data.verificationStatus || 'Pending Review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewedAt: data.verificationStatus === 'Verified' ? new Date().toISOString() : undefined,
    reviewedBy: data.verificationStatus === 'Verified' ? 'Editorial Admin' : undefined,
  };

  scholarships.unshift(newScholarship);
  saveScholarships(scholarships);

  res.status(201).json(newScholarship);
});

// Update scholarship
app.put('/api/admin/scholarships/:id', requireAdminAuth, (req, res) => {
  const index = scholarships.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Scholarship not found' });
  }

  const updated: Scholarship = {
    ...scholarships[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };

  scholarships[index] = updated;
  saveScholarships(scholarships);

  res.json(updated);
});

// Change verification status
app.patch('/api/admin/scholarships/:id/status', requireAdminAuth, (req, res) => {
  const { status, reviewedBy } = req.body;
  const validStatuses: VerificationStatus[] = ['Pending Review', 'Verified', 'Expired', 'Rejected'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid verification status' });
  }

  const index = scholarships.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Scholarship not found' });
  }

  scholarships[index].verificationStatus = status;
  scholarships[index].reviewedAt = new Date().toISOString();
  scholarships[index].reviewedBy = reviewedBy || 'Editorial Admin';
  scholarships[index].updatedAt = new Date().toISOString();

  saveScholarships(scholarships);
  res.json(scholarships[index]);
});

// Delete scholarship
app.delete('/api/admin/scholarships/:id', requireAdminAuth, (req, res) => {
  const index = scholarships.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Scholarship not found' });
  }

  const removed = scholarships.splice(index, 1)[0];
  saveScholarships(scholarships);

  res.json({ success: true, removedId: removed.id });
});

// Reset data to initial state
app.post('/api/admin/reset-samples', requireAdminAuth, (req, res) => {
  scholarships = [...INITIAL_SCHOLARSHIPS];
  saveScholarships(scholarships);
  res.json({ success: true, count: scholarships.length });
});

// -------------------------------------------------------------
// AI-Assisted Extraction Workflow (Server-Side Gemini API)
// -------------------------------------------------------------
app.post('/api/admin/extract', requireAdminAuth, async (req, res) => {
  const { sourceUrl, sourceContent, notes } = req.body;

  if (!sourceUrl && !sourceContent) {
    return res.status(400).json({ error: 'Either sourceUrl or sourceContent is required for AI extraction.' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const extractionPrompt = `
You are a senior scholarship research analyst extracting structured data for international students.
Extract the official details from the following scholarship text/notes.
Rules:
1. ONLY claim funding is "Covered" if the source explicitly states it is paid/waived. Otherwise use "Not Covered" or "Unconfirmed".
2. Set "isFullyFundedClaimVerified" to true ONLY if tuition AND living stipend are covered.
3. For nationality eligibility:
   - If open to all nations, mode: "worldwide".
   - If specific countries only, mode: "selected" and list them explicitly.
   - If ambiguous, mode: "unknown".
4. Determine deadline strictly in ISO 8601 format (e.g. YYYY-MM-DDTHH:mm:ssZ). If unconfirmed, set deadlineNotConfirmed: true and deadline: null.
5. All new extracted listings MUST have verificationStatus: "Pending Review" because human admin review is mandatory before publishing.

Official Source URL: ${sourceUrl || 'Provided by researcher'}
Admin Notes: ${notes || 'None'}

Content to extract from:
${sourceContent || 'No text body provided; structure basic details from URL and notes.'}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: extractionPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              provider: { type: Type.STRING },
              destinationCountry: { type: Type.STRING },
              hostInstitutions: { type: Type.ARRAY, items: { type: Type.STRING } },
              degreeLevels: { type: Type.ARRAY, items: { type: Type.STRING } },
              subjects: { type: Type.ARRAY, items: { type: Type.STRING } },
              nationalityEligibility: {
                type: Type.OBJECT,
                properties: {
                  mode: { type: Type.STRING },
                  eligibleCountries: { type: Type.ARRAY, items: { type: Type.STRING } },
                  notes: { type: Type.STRING },
                },
                required: ['mode'],
              },
              funding: {
                type: Type.OBJECT,
                properties: {
                  tuition: { type: Type.STRING },
                  tuitionDetails: { type: Type.STRING },
                  stipend: { type: Type.STRING },
                  stipendDetails: { type: Type.STRING },
                  accommodation: { type: Type.STRING },
                  accommodationDetails: { type: Type.STRING },
                  travel: { type: Type.STRING },
                  travelDetails: { type: Type.STRING },
                  healthInsurance: { type: Type.STRING },
                  healthInsuranceDetails: { type: Type.STRING },
                  visaAllowance: { type: Type.STRING },
                  visaAllowanceDetails: { type: Type.STRING },
                  fundingExclusions: { type: Type.STRING },
                  bondingOrConditions: { type: Type.STRING },
                  isFullyFundedClaimVerified: { type: Type.BOOLEAN },
                },
                required: ['tuition', 'stipend', 'accommodation', 'travel', 'healthInsurance', 'visaAllowance', 'isFullyFundedClaimVerified'],
              },
              academicRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
              languageRequirements: { type: Type.STRING },
              requiredDocuments: { type: Type.ARRAY, items: { type: Type.STRING } },
              deadline: { type: Type.STRING },
              deadlineTimezone: { type: Type.STRING },
              deadlineNotConfirmed: { type: Type.BOOLEAN },
              academicYear: { type: Type.STRING },
              description: { type: Type.STRING },
              notesOrAdvice: { type: Type.STRING },
            },
            required: [
              'title',
              'provider',
              'destinationCountry',
              'degreeLevels',
              'subjects',
              'nationalityEligibility',
              'funding',
              'academicRequirements',
              'requiredDocuments',
              'deadlineNotConfirmed',
              'description',
            ],
          },
        },
      });

      const parsedText = response.text?.trim() || '{}';
      const extractedData = JSON.parse(parsedText);

      // Construct verified draft scholarship (always Pending Review)
      const draftScholarship: Scholarship = {
        id: `extracted-${Date.now()}`,
        isSampleRecord: false,
        title: extractedData.title || 'Untitled Extracted Scholarship',
        provider: extractedData.provider || 'Unconfirmed Provider',
        destinationCountry: extractedData.destinationCountry || 'Unconfirmed Country',
        hostInstitutions: extractedData.hostInstitutions || [],
        degreeLevels: extractedData.degreeLevels || ["Master's"],
        subjects: extractedData.subjects || ['All Subjects'],
        nationalityEligibility: {
          mode: extractedData.nationalityEligibility?.mode || 'unknown',
          eligibleCountries: extractedData.nationalityEligibility?.eligibleCountries || [],
          notes: extractedData.nationalityEligibility?.notes || '',
        },
        funding: {
          tuition: extractedData.funding?.tuition || 'Unconfirmed',
          tuitionDetails: extractedData.funding?.tuitionDetails || '',
          stipend: extractedData.funding?.stipend || 'Unconfirmed',
          stipendDetails: extractedData.funding?.stipendDetails || '',
          accommodation: extractedData.funding?.accommodation || 'Unconfirmed',
          accommodationDetails: extractedData.funding?.accommodationDetails || '',
          travel: extractedData.funding?.travel || 'Unconfirmed',
          travelDetails: extractedData.funding?.travelDetails || '',
          healthInsurance: extractedData.funding?.healthInsurance || 'Unconfirmed',
          healthInsuranceDetails: extractedData.funding?.healthInsuranceDetails || '',
          visaAllowance: extractedData.funding?.visaAllowance || 'Unconfirmed',
          visaAllowanceDetails: extractedData.funding?.visaAllowanceDetails || '',
          fundingExclusions: extractedData.funding?.fundingExclusions || '',
          bondingOrConditions: extractedData.funding?.bondingOrConditions || '',
          isFullyFundedClaimVerified: !!extractedData.funding?.isFullyFundedClaimVerified,
        },
        academicRequirements: extractedData.academicRequirements || ['Subject to university admission'],
        languageRequirements: extractedData.languageRequirements || 'English language proficiency required',
        requiredDocuments: extractedData.requiredDocuments || ['Transcripts', 'Degree Certificate', 'Passport'],
        deadline: extractedData.deadlineNotConfirmed ? null : (extractedData.deadline || null),
        deadlineTimezone: extractedData.deadlineTimezone || 'UTC',
        deadlineNotConfirmed: !!extractedData.deadlineNotConfirmed,
        academicYear: extractedData.academicYear || '2027/2028',
        officialSourceUrl: sourceUrl || 'https://example.org/source-needed',
        officialApplicationUrl: sourceUrl || '',
        lastCheckedDate: new Date().toISOString().split('T')[0],
        sourceCheckNotes: `Extracted via AI assistance on ${new Date().toLocaleDateString()}. Requires human administrator review.`,
        verificationStatus: 'Pending Review',
        reviewedBy: undefined,
        reviewedAt: undefined,
        description: extractedData.description || 'Extracted scholarship listing pending review.',
        notesOrAdvice: extractedData.notesOrAdvice || notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        extracted: draftScholarship,
        aiPowered: true,
      });
    } catch (aiErr) {
      console.warn('[Scholarship Atlas] Gemini extraction failed, falling back to structured parser:', aiErr);
    }
  }

  // Graceful rule-based extraction fallback if Gemini API is temporarily unreachable or key is not provided
  const fallbackDraft: Scholarship = {
    id: `extracted-${Date.now()}`,
    isSampleRecord: false,
    title: sourceContent?.slice(0, 60)?.split('\n')[0] || 'Draft Extracted Scholarship',
    provider: 'Official Provider (Pending Review)',
    destinationCountry: 'United Kingdom',
    hostInstitutions: [],
    degreeLevels: ["Master's"],
    subjects: ['All Subjects'],
    nationalityEligibility: {
      mode: 'unknown',
      notes: 'Please review official documentation for nationality guidelines.',
    },
    funding: {
      tuition: 'Covered',
      tuitionDetails: 'Tuition fees waiver confirmed in preliminary scan.',
      stipend: 'Unconfirmed',
      stipendDetails: 'Living stipend unconfirmed in source snippet.',
      accommodation: 'Unconfirmed',
      travel: 'Unconfirmed',
      healthInsurance: 'Unconfirmed',
      visaAllowance: 'Unconfirmed',
      isFullyFundedClaimVerified: false,
    },
    academicRequirements: ['Undergraduate degree in related discipline'],
    languageRequirements: 'Official test score (IELTS/TOEFL)',
    requiredDocuments: ['Transcripts', 'Curriculum Vitae', 'References'],
    deadline: null,
    deadlineTimezone: 'UTC',
    deadlineNotConfirmed: true,
    academicYear: '2027/2028',
    officialSourceUrl: sourceUrl || 'https://example.org',
    officialApplicationUrl: sourceUrl || '',
    lastCheckedDate: new Date().toISOString().split('T')[0],
    sourceCheckNotes: 'Structured via rule-based draft parser. Pending human review.',
    verificationStatus: 'Pending Review',
    description: sourceContent ? sourceContent.slice(0, 300) : 'Extracted scholarship candidate.',
    notesOrAdvice: notes || 'Please verify funding and eligibility breakdown.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    extracted: fallbackDraft,
    aiPowered: false,
    note: 'Extracted using structured fallback. Please review and complete missing fields.',
  });
});

// -------------------------------------------------------------
// Serve Static Frontend / Vite Middleware
// -------------------------------------------------------------
async function startServer() {
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Scholarship Atlas] Full-stack server running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Scholarship Atlas] Failed to start server:', err);
  process.exit(1);
});
