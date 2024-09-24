// Load environment variables at the very top
require('dotenv').config();

console.log('Current working directory:', process.cwd());
console.log('Environment variables:', process.env);

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const admin = require('./firebase-admin-config');
const adminFirebase = require('firebase-admin');
const moment = require('moment');
const cron = require('node-cron');
const fs = require('fs');

// Initialize Firestore
const db = adminFirebase.firestore();

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: [
    'https://66adc58a-4277-466d-9316-764327f12d64-00-3s35booxl2x8t.riker.replit.dev',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Use CORS middleware
app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

app.use(express.json());

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    console.error('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    console.log('Verifying token:', token);
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token verified successfully:', decodedToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Example route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// Add this test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Add this route to check environment variables
app.get('/api/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    // Add any other relevant environment variables here
  });
});

// Add this route to check if .env file is being read
app.get('/api/envfile', (req, res) => {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    res.json({ envContent: envContent.split('\n') });
  } catch (error) {
    res.json({ error: 'Unable to read .env file', details: error.message });
  }
});

// Add this new route
app.get('/api/strava/auth', (req, res) => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;
  const responseType = 'code';
  const scope = 'read,activity:read_all';
  
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
  
  res.redirect(authUrl);
});

// Add this route handler for the root path
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// Your existing routes
// ...

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error handler:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});