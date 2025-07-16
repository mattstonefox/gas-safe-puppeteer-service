import puppeteer from 'puppeteer';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Security middleware
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

async function scrapeGasSafe(searchQuery) {
  console.log(`🔍 Scraping Gas Safe Register for: ${searchQuery}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Go to Gas Safe Register website
    await page.goto('https://www.gassaferegister.co.uk/find-an-engineer/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for and fill search input
    await page.waitForSelector('#txtSearch', { timeout: 10000 });
    await page.type('#txtSearch', searchQuery);
    
    // Click search button
    await page.click('#btnSearch');
    
    // Wait for results
    await page.waitForSelector('.search-results, .no-results', { timeout: 15000 });
    
    // Check if no results
    const noResults = await page.$('.no-results');
    if (noResults) {
      return {
        success: true,
        data: [],
        count: 0,
        message: 'No results found'
      };
    }
    
    // Extract engineer data
    const results = await page.evaluate(() => {
      const engineers = [];
      const items = document.querySelectorAll('.result-item');
      
      items.forEach(item => {
        const engineer = {
          gas_safe_number: item.querySelector('.gas-id')?.textContent?.replace('Gas Safe ID:', '').trim(),
          business_name: item.querySelector('.business-name')?.textContent?.trim(),
          engineer_name: item.querySelector('.engineer-name')?.textContent?.trim(),
          address: item.querySelector('.address')?.textContent?.trim(),
          phone: item.querySelector('.phone')?.textContent?.trim(),
          categories: Array.from(item.querySelectorAll('.work-categories li')).map(li => li.textContent?.trim()).filter(Boolean).join(', '),
          expiry_date: item.querySelector('.expiry-date')?.textContent?.replace('Expires:', '').trim()
        };
        
        // Only add if we have a gas safe number
        if (engineer.gas_safe_number) {
          engineers.push(engineer);
        }
      });
      
      return engineers;
    });
    
    return {
      success: true,
      data: results,
      count: results.length
    };
    
  } catch (error) {
    console.error('Scraping error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  } finally {
    await browser.close();
  }
}

// API endpoint for Gas Safe scraping
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
    
    const result = await scrapeGasSafe(searchQuery);
    res.json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Gas Safe Puppeteer scraper running on port ${PORT}`);
  console.log(`📋 Endpoint: POST /api/gas-safe-scrape`);
  console.log(`🏥 Health check: GET /health`);
});