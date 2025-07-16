# Gas Safe Puppeteer Microservice

This microservice provides web scraping functionality for the Gas Safe Register using Puppeteer.

## Deployment to Render

1. Push this `puppeteer-service` folder to a GitHub repository
2. Sign up for a free Render account at https://render.com
3. Click "New +" → "Web Service"
4. Connect your GitHub account and select the repository
5. Configure:
   - Name: `gas-safe-puppeteer`
   - Root Directory: `puppeteer-service` (if in a subfolder)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Click "Create Web Service"
7. Wait for deployment (first deploy takes ~10 minutes)
8. Your service URL will be: `https://gas-safe-puppeteer.onrender.com`

## API Endpoints

### Health Check
```
GET /health
```

### Scrape Gas Safe
```
POST /api/gas-safe-scrape
Content-Type: application/json

{
  "gas_safe_number": "123456",
  "engineer_name": "John Smith",
  "business_name": "ABC Plumbing Ltd"
}
```

## Alternative Deployment Options

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up
```

### Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and launch
fly auth login
fly launch

# Deploy
fly deploy
```

## Local Development

```bash
npm install
npm start
```

## Integration with n8n

Use the HTTP Request node in n8n with:
- Method: POST
- URL: `https://your-service-url.onrender.com/api/gas-safe-scrape`
- Body: JSON with search parameters