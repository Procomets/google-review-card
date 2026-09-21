import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import crypto from 'crypto';
import { db } from './firebase.js';
import { getAuth } from 'firebase-admin/auth';
// ─────────────────────────────────────────────────────────────────────────────
//  App Setup
// ─────────────────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Warn loudly if the API key is missing
if (!GOOGLE_API_KEY) {
  console.error(
    '⚠️  WARNING: GOOGLE_API_KEY is not set in .env — the /api/review-link endpoint will fail.'
  );
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Default for local dev

// ─────────────────────────────────────────────────────────────────────────────
//  In-Memory Cache  (key: normalised Maps URL → cached result, 24 h TTL)
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// ─────────────────────────────────────────────────────────────────────────────
//  CORS
// ─────────────────────────────────────────────────────────────────────────────
const allowedOriginSetting =
  process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === allowedOriginSetting || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────────────────────────────────────────
//  Rate Limiting  (20 requests / IP / hour)
// ─────────────────────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error:
      'Google Places request limit reached. Please try again in an hour.',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Body Parser
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─────────────────────────────────────────────────────────────────────────────
//  Admin Auth Middleware
// ─────────────────────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    getAuth().verifyIdToken(token)
      .then((decodedToken) => {
        req.user = decodedToken;
        next();
      })
      .catch((error) => {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(403).json({ success: false, error: 'Forbidden' });
      });
  } catch (error) {
    console.error('Firebase Admin is not initialized:', error);
    return res.status(500).json({ success: false, error: 'Firebase Admin not initialized on the server.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeInputUrl(rawUrl) {
  let urlStr = (rawUrl || '').trim();
  if (!urlStr) return '';
  // Fix duplicated URLs if accidentally pasted twice (e.g. https://foo...https://foo...)
  const secondHttp = urlStr.indexOf('http', 4);
  if (secondHttp !== -1) {
    urlStr = urlStr.substring(0, secondHttp).trim();
  }
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = 'https://' + urlStr;
  }
  return urlStr;
}

function isAllowedGoogleUrl(rawUrl) {
  try {
    const url = new URL(normalizeInputUrl(rawUrl));
    const host = url.hostname.toLowerCase();
    return (
      host === 'goo.gl' ||
      host.endsWith('.goo.gl') ||
      host.endsWith('google.com') ||
      host.includes('google.') ||
      host === 'g.co' ||
      host.endsWith('.g.co')
    );
  } catch {
    return false;
  }
}

async function resolveUrl(inputUrl) {
  const targetUrl = normalizeInputUrl(inputUrl);
  try {
    const response = await axios.get(targetUrl, {
      maxRedirects: 10,
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
      validateStatus: () => true,
    });

    const finalUrl =
      response.request?.res?.responseUrl ||
      response.request?.responseURL ||
      response.config?.url ||
      targetUrl;

    return finalUrl;
  } catch (err) {
    const fallbackUrl =
      err.response?.request?.res?.responseUrl ||
      err.response?.request?.responseURL ||
      targetUrl;

    return fallbackUrl;
  }
}

function extractBusinessName(resolvedUrl) {
  try {
    // 1. /maps/place/Business+Name
    let match = resolvedUrl.match(/\/maps\/place\/([^/@?&]+)/);
    if (match) {
      return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();
    }
    // 2. /maps/search/Business+Name
    match = resolvedUrl.match(/\/maps\/search\/([^/@?&]+)/);
    if (match) {
      return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();
    }
    // 3. Query parameter q=...
    const urlObj = new URL(resolvedUrl);
    const q = urlObj.searchParams.get('q');
    if (q) {
      return decodeURIComponent(q.replace(/\+/g, ' ')).trim();
    }
  } catch {
    // fall through
  }
  return null;
}

function extractCoordinates(resolvedUrl) {
  try {
    const match = resolvedUrl.match(
      /@(-?\d+\.?\d*),(-?\d+\.?\d*),\d+\.?\d*z/
    );
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
      };
    }
  } catch {
    // fall through
  }
  return null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nameSimilarity(a, b) {
  const tokenize = (s) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
    );
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

async function searchPlaces(businessName, coords = null, maxResults = 5) {
  const body = {
    textQuery: businessName,
    languageCode: 'en',
  };

  if (coords && coords.latitude && coords.longitude) {
    body.locationBias = {
      circle: {
        center: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        radius: 5000.0,
      },
    };
  }

  let response = await axios.post(
    'https://places.googleapis.com/v1/places:searchText',
    body,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location',
      },
      timeout: 10000,
    }
  );

  let places = response.data?.places || [];

  // Fallback if no results with locationBias: search plain textQuery
  if (places.length === 0 && coords) {
    delete body.locationBias;
    response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location',
        },
        timeout: 10000,
      }
    );
    places = response.data?.places || [];
  }

  return places.slice(0, maxResults).map((p) => ({
    name: p.displayName?.text || 'Unknown',
    address: p.formattedAddress || '',
    placeId: p.id || '',
    location: p.location || null,
  }));
}

function scoreAndMatch(candidates, businessName, coords) {
  const scored = candidates.map((c) => {
    let score = 0;
    const sim = nameSimilarity(c.name, businessName);
    score += sim * 60;

    if (coords && c.location) {
      const distKm = haversineKm(
        coords.latitude,
        coords.longitude,
        c.location.latitude,
        c.location.longitude
      );
      score += 30 * Math.exp(-distKm / 5);
    }

    return { ...c, _score: score, _nameSim: sim };
  });

  scored.sort((a, b) => b._score - a._score);

  const best = scored[0];
  const second = scored[1];
  const highConfidence =
    best &&
    best._score > 55 &&
    (!second || best._score - second._score > 10);

  return {
    best,
    needsConfirmation: !highConfidence,
    candidates: scored.map(({ _score, _nameSim, ...rest }) => rest),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/review-link', limiter, async (req, res) => {
  try {
    const { mapsUrl } = req.body;

    if (!mapsUrl || typeof mapsUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid Google Maps link.',
      });
    }

    const normalizedUrl = normalizeInputUrl(mapsUrl);

    if (normalizedUrl.length > 2048) {
      return res.status(400).json({
        success: false,
        error: 'URL is too long. Please enter a valid Google Maps link.',
      });
    }

    if (!isAllowedGoogleUrl(normalizedUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid Google Maps link.',
      });
    }

    const cacheKey = normalizedUrl.toLowerCase();
    const cached = cacheGet(cacheKey);
    if (cached) {
      console.log('[cache hit]', cacheKey);
      return res.json({ success: true, cached: true, ...cached });
    }

    let resolvedUrl = normalizedUrl;
    try {
      resolvedUrl = await resolveUrl(normalizedUrl);
    } catch (err) {
      console.warn('[resolveUrl warning]', err.message);
      // If short link fails to resolve, return clear error
      if (normalizedUrl.includes('goo.gl')) {
        return res.status(400).json({
          success: false,
          error: 'Could not resolve Google Maps short link. Please check if the link is valid.',
        });
      }
      // For full URLs, continue with normalizedUrl
      resolvedUrl = normalizedUrl;
    }

    if (!isAllowedGoogleUrl(resolvedUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid Google Maps link.',
      });
    }

    console.log('[resolved]', resolvedUrl);

    const businessName = extractBusinessName(resolvedUrl);
    const coords = extractCoordinates(resolvedUrl);

    console.log('[extracted] name=' + businessName + '  coords=' + JSON.stringify(coords));

    if (!businessName) {
      return res.status(422).json({
        success: false,
        error:
          "We couldn't identify a business from this link. Please copy and paste a direct Google Maps place link.",
      });
    }

    console.log('[places query] business=' + businessName + ' coords=' + JSON.stringify(coords));

    let candidates;
    try {
      candidates = await searchPlaces(businessName, coords);
    } catch (err) {
      const googleError = err.response?.data?.error;
      console.error('[Google Places Error]:', googleError || err.message);

      if (googleError?.status === 'PERMISSION_DENIED' || googleError?.code === 403) {
        return res.status(403).json({
          success: false,
          error: 'Google API Key error: ' + (googleError?.message || 'Permission denied. Ensure Places API (New) is enabled.'),
        });
      }
      if (googleError?.code === 400 || err.response?.status === 400) {
        return res.status(400).json({
          success: false,
          error: 'Google Places API Error: ' + (googleError?.message || 'Invalid request to Google Places.'),
        });
      }
      if (err.response?.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Google Places request limit reached. Please try again later.',
        });
      }
      return res.status(502).json({
        success: false,
        error: 'Unable to contact Google Places right now. Please try again.',
      });
    }

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({
        success: false,
        error:
          "We couldn't identify this business. Please check the Google Maps link and try again.",
      });
    }

    const { best, needsConfirmation, candidates: rankedCandidates } =
      scoreAndMatch(candidates, businessName, coords);

    const candidatesWithDistance = rankedCandidates.map((c) => {
      if (coords && c.location) {
        const distKm = haversineKm(
          coords.latitude,
          coords.longitude,
          c.location.latitude,
          c.location.longitude
        );
        return { ...c, distanceKm: Math.round(distKm * 10) / 10 };
      }
      return c;
    });

    const generateReviewUrl = (placeId) =>
      'https://search.google.com/local/writereview?placeid=' + placeId;

    let result;

    if (!needsConfirmation) {
      const reviewUrl = generateReviewUrl(best.placeId);
      result = {
        needsConfirmation: false,
        business: {
          name: best.name,
          address: best.address,
          placeId: best.placeId,
          location: best.location,
        },
        reviewUrl,
        candidates: candidatesWithDistance,
      };
      cacheSet(cacheKey, result);
    } else {
      result = {
        needsConfirmation: true,
        candidates: candidatesWithDistance,
        extractedName: businessName,
      };
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[unhandled error]', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    });
  }
});

app.post('/api/confirm-business', limiter, (req, res) => {
  const { placeId, name, address } = req.body;

  if (!placeId || typeof placeId !== 'string' || !placeId.match(/^[\w-]+$/)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Place ID.',
    });
  }

  const reviewUrl =
    'https://search.google.com/local/writereview?placeid=' + placeId;

  return res.json({
    success: true,
    business: { name, address, placeId },
    reviewUrl,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Private Feedback - Admin Routes
// ─────────────────────────────────────────────────────────────────────────────

// Removed /api/admin/login

function generateSlug() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let slug = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    slug += alphabet[bytes[i] % alphabet.length];
  }
  return slug;
}

app.post('/api/admin/feedback', requireAdmin, async (req, res) => {
  try {
    if (!db) throw new Error('Firebase not initialized');
    
    const { companyName, location, greeting, description, googleReviewLink, reviewCTAThreshold, isActive } = req.body;
    
    if (!companyName || !googleReviewLink) {
      return res.status(400).json({ success: false, error: 'Company Name and Google Review Link are required.' });
    }

    let slug = generateSlug();
    
    const docRef = db.collection('feedbackPages').doc(slug);
    await docRef.set({
      slug,
      companyName,
      location: location || '',
      greeting: greeting || "We'd love to hear from you!",
      description: description || "Please take a moment to share your experience with us.",
      googleReviewLink,
      reviewCTAThreshold: parseInt(reviewCTAThreshold) || 4,
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, slug });
  } catch (err) {
    console.error('Create feedback error:', err);
    res.status(500).json({ success: false, error: 'Failed to create feedback page' });
  }
});

app.get('/api/admin/feedback', requireAdmin, async (req, res) => {
  try {
    if (!db) return res.json({ success: true, pages: [] });
    
    const snapshot = await db.collection('feedbackPages').orderBy('createdAt', 'desc').get();
    const pages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ success: true, pages });
  } catch (err) {
    console.error('List feedback error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch feedback pages' });
  }
});

app.put('/api/admin/feedback/:slug', requireAdmin, async (req, res) => {
  try {
    if (!db) throw new Error('Firebase not initialized');
    
    const { slug } = req.params;
    const { companyName, location, googleReviewLink, reviewCTAThreshold, greeting, description, isActive } = req.body;
    
    if (!companyName || !googleReviewLink) {
      return res.status(400).json({ success: false, error: 'Company Name and Google Review Link are required.' });
    }
    
    const docRef = db.collection('feedbackPages').doc(slug);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Feedback page not found.' });
    }
    
    await docRef.update({
      companyName,
      location: location || '',
      greeting: greeting || "We'd love to hear from you!",
      description: description || "Please take a moment to share your experience with us.",
      googleReviewLink,
      reviewCTAThreshold: parseInt(reviewCTAThreshold) || 4,
      isActive: isActive !== false,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, slug });
  } catch (err) {
    console.error('Update feedback error:', err);
    res.status(500).json({ success: false, error: 'Failed to update feedback page' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Private Feedback - Public Routes
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/feedback/:slug', async (req, res) => {
  try {
    if (!db) throw new Error('Firebase not initialized');
    
    const docRef = db.collection('feedbackPages').doc(req.params.slug);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Feedback page not found.' });
    }
    
    const data = doc.data();
    
    if (!data.isActive) {
      return res.status(403).json({ success: false, error: 'This feedback page is currently unavailable.' });
    }
    
    res.json({
      success: true,
      feedbackPage: {
        companyName: data.companyName,
        location: data.location,
        greeting: data.greeting,
        description: data.description,
        reviewCTAThreshold: data.reviewCTAThreshold,
        googleReviewLink: data.googleReviewLink,
      }
    });
  } catch (err) {
    console.error('Get feedback error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch feedback page' });
  }
});

app.post('/api/feedback/:slug/submit', async (req, res) => {
  try {
    if (!db) throw new Error('Firebase not initialized');
    
    const { rating } = req.body;
    const docRef = db.collection('feedbackPages').doc(req.params.slug);
    const doc = await docRef.get();
    
    if (!doc.exists || !doc.data().isActive) {
      return res.status(404).json({ success: false, error: 'Feedback page not found or inactive.' });
    }
    
    const data = doc.data();
    const showGoogleReviewCTA = rating >= data.reviewCTAThreshold;
    
    // As requested, we DO NOT store the customer feedback data.
    
    res.json({
      success: true,
      rating,
      showGoogleReviewCTA,
      googleReviewLink: showGoogleReviewCTA ? data.googleReviewLink : null
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit feedback' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

export default app;

app.listen(PORT, () => {
  console.log('\n🚀  Backend running on http://localhost:' + PORT);
  console.log('   CORS allowed origin: ' + allowedOriginSetting);
  console.log('   API key configured:  ' + (GOOGLE_API_KEY ? '✅' : '❌ MISSING') + '\n');
});
