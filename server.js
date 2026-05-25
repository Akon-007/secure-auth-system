const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'SuperSecureJWTSecretKeyChangeMe!';
const MFA_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ACCOUNT_LOCK_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;
const SALT_ROUNDS = 12;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const users = [];

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many attempts. Please wait 15 minutes before retrying.'
  }
});

function findUser(email) {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

function generateMfaCode() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

function generateJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

app.post('/register', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  if (findUser(email)) {
    return res.status(409).json({ success: false, error: 'An account with that email already exists.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  users.push({
    email: email.toLowerCase(),
    passwordHash: hashedPassword,
    failedAttempts: 0,
    isLocked: false,
    lockUntil: null,
    mfaToken: null,
    mfaTokenExpires: null
  });

  return res.status(201).json({ success: true, message: 'Registration successful. You can now log in.' });
});

app.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = findUser(email);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const now = Date.now();
  if (user.isLocked && user.lockUntil && now < user.lockUntil) {
    const remainingSeconds = Math.ceil((user.lockUntil - now) / 1000);
    return res.status(423).json({
      success: false,
      error: `Account locked due to repeated failed logins. Try again in ${remainingSeconds} seconds.`
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    user.failedAttempts += 1;

    if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      user.isLocked = true;
      user.lockUntil = now + ACCOUNT_LOCK_MINUTES * 60 * 1000;
      return res.status(423).json({
        success: false,
        error: `Too many failed attempts. Account locked for ${ACCOUNT_LOCK_MINUTES} minutes.`
      });
    }

    return res.status(401).json({
      success: false,
      error: `Invalid email or password. ${MAX_FAILED_ATTEMPTS - user.failedAttempts} attempts remaining.`
    });
  }

  user.failedAttempts = 0;
  user.isLocked = false;
  user.lockUntil = null;

  const mfaToken = generateMfaCode();
  user.mfaToken = mfaToken;
  user.mfaTokenExpires = now + MFA_CODE_TTL_MS;

  return res.json({
    success: true,
    mfaRequired: true,
    message: 'MFA code generated. Use this code to complete authentication.',
    mfaCode: mfaToken
  });
});

app.post('/mfa', authLimiter, (req, res) => {
  const { email, token } = req.body;
  const user = findUser(email);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid MFA verification request.' });
  }

  const now = Date.now();
  if (!user.mfaToken || !user.mfaTokenExpires || now > user.mfaTokenExpires) {
    return res.status(401).json({ success: false, error: 'MFA code expired. Please log in again.' });
  }

  if (token !== user.mfaToken) {
    return res.status(401).json({ success: false, error: 'Invalid MFA code. Please try again.' });
  }

  user.mfaToken = null;
  user.mfaTokenExpires = null;

  const jwtToken = generateJwt({ email: user.email, role: 'user' });
  return res.json({ success: true, token: jwtToken, message: 'MFA verified. Authentication complete.' });
});

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing authorization header.' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = verifyJwt(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
  }
}

app.get('/dashboard', authenticate, (req, res) => {
  return res.json({
    success: true,
    message: 'Welcome to your secure dashboard.',
    user: {
      email: req.user.email,
      role: req.user.role,
      issuedAt: new Date().toISOString()
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Secure Auth System running at http://localhost:${PORT}`);
});
