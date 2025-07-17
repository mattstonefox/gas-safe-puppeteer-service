import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Key authentication (optional)
const API_KEY = process.env.API_KEY;
if (API_KEY) {
  app.use('/api', (req, res, next) => {
    const providedKey = req.headers['x-api-key'] || req.query.api_key;
    if (providedKey !== API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gas-safe-puppeteer' });
});

// Simplified Gas Safe scraping without Puppeteer
app.post('/api/gas-safe-scrape', async (req, res) => {
  try {
    const { engineer_name, gas_safe_number, business_name } = req.body;
    
    // Determine search query
    const searchQuery = gas_safe_number || engineer_name || business_name;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Please provide engineer_name, gas_safe_number, or business_name'
      });
    }
    
    // For now, return mock data to test the integration
    // In production, you would use a proper scraping service
    const mockData = {
      gas_safe_number: gas_safe_number || '123456',
      business_name: business_name || 'Test Plumbing Services',
      engineer_name: engineer_name || 'John Smith',
      address: '123 Test Street, London, UK',
      phone: '020 1234 5678',
      categories: 'CCN1, CPA1, CENWAT, HTR1, WAT1',
      expiry_date: '31/12/2024'
    };
    
    console.log(`✅ Returning data for: ${searchQuery}`);
    
    res.json({
      success: true,
      data: [mockData],
      count: 1,
      note: 'Using mock data due to Railway Chrome limitations'
    });
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// Alternative: Use external scraping service
app.post('/api/gas-safe-scrape-external', async (req, res) => {
  // Options:
  // 1. Browserless.io - Free tier available
  // 2. ScrapingBee - 1000 free credits
  // 3. Bright Data - Free trial
  
  res.json({
    success: false,
    message: 'External scraping service not configured',
    alternatives: [
      'https://browserless.io - Free tier with 1000 executions/month',
      'https://scrapingbee.com - 1000 free API credits',
      'https://brightdata.com - Free trial available'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Gas Safe service running on port ${PORT}`);
  console.log(`📋 Using simplified scraping (no Puppeteer)`);
  console.log(`🏥 Health check: GET /health`);
});