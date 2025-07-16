# Railway Deployment Fixes for Puppeteer Service

## Common Issues and Solutions

### 1. Use the Puppeteer Docker Image

Replace your Dockerfile with `Dockerfile.railway`:
```bash
mv Dockerfile Dockerfile.backup
cp Dockerfile.railway Dockerfile
```

### 2. Update railway.json

Create a new `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "region": "us-west1"
  },
  "services": {
    "web": {
      "numReplicas": 1,
      "startCommand": "node server.js"
    }
  }
}
```

### 3. Add a start script to package.json

Update your package.json:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  }
}
```

### 4. Environment Variables

Make sure these are set in Railway:
```
PORT=3000
API_KEY=fb6d57141940b393ebebdec7efe2bf686fb03a5e2021254af6d6d11314a5e074
ALLOWED_ORIGINS=https://app.n8n.cloud
NODE_ENV=production
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### 5. Memory Issues

If still failing, add to your server.js:
```javascript
// At the top of server.js
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// In puppeteer.launch options
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=IsolateOrigins',
    '--disable-site-isolation-trials'
  ],
  ignoreDefaultArgs: ['--disable-extensions']
});
```

### 6. Debug Deployment

1. Check Railway logs:
   - Go to your Railway dashboard
   - Click on the service
   - Go to "Deployments" tab
   - Click on the latest deployment
   - View logs

2. Common error messages:
   - "Cannot find Chrome" → Use Puppeteer Docker image
   - "Memory exceeded" → Reduce Chrome args
   - "Port binding failed" → Use process.env.PORT

### 7. Quick Fix Script

Run this in your puppeteer-service directory:
```bash
# Use optimized Dockerfile
cp Dockerfile.railway Dockerfile

# Commit and push
git add .
git commit -m "fix: Use Puppeteer Docker image for Railway"
git push

# Railway will auto-deploy
```

### 8. Alternative: Simpler Service

If Puppeteer continues to fail, consider using a headless browser API:
- Browserless.io (1000 free requests/month)
- ScrapingBee (1000 free credits)
- Brightdata Scraping Browser