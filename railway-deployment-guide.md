# Railway Deployment Guide for Gas Safe Puppeteer Service

## Current Status

Based on my investigation, here's what I found:

### URL Patterns Tested

1. **`.up.railway.app` domains** - All returning "Application not found" (404)
   - gas-safe-puppeteer-service.up.railway.app
   - puppeteer-service-production.up.railway.app
   - tradepro-gas-safe-puppeteer-service.up.railway.app

2. **`.railway.app` domains** - Returning Railway API homepage (not your service)
   - gas-safe-puppeteer-service.railway.app
   - puppeteer-service.railway.app

## Common Railway Deployment Issues & Solutions

### 1. Service Not Deployed or Failed Deployment

**Check deployment status:**
```bash
railway status
railway logs --last 100
```

**Deploy the service:**
```bash
railway up
```

### 2. Wrong Service Name

Railway generates URLs based on your service name. The actual URL might be different from what you expect.

**Find your actual URL:**
```bash
railway domain
```

### 3. Environment Variables Not Set

**Check current variables:**
```bash
railway variables
```

**Set required variables:**
```bash
railway variables set PORT=3000
railway variables set API_KEY=your-secret-key
railway variables set ALLOWED_ORIGINS=https://your-n8n-instance.n8n.cloud
```

### 4. Puppeteer-Specific Issues

Common Puppeteer deployment failures on Railway:

**Memory Issues:**
- Increase service memory in Railway dashboard (min 512MB recommended)
- Puppeteer needs significant memory for Chromium

**Chromium Not Found:**
- The Dockerfile correctly installs Chromium
- Sets `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
- Sets `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`

**Sandbox Issues:**
- The server.js correctly uses `--no-sandbox` flag

### 5. Port Binding Issues

The service correctly uses `process.env.PORT || 3000`, so this shouldn't be an issue.

## Step-by-Step Deployment Process

1. **Install Railway CLI (if not installed):**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link or create project:**
   ```bash
   railway link  # If you have an existing project
   # OR
   railway init  # To create a new project
   ```

4. **Set environment variables:**
   ```bash
   railway variables set API_KEY=your-secret-key
   railway variables set ALLOWED_ORIGINS=https://your-n8n-instance.n8n.cloud
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get your deployment URL:**
   ```bash
   railway domain
   ```

7. **Check logs:**
   ```bash
   railway logs -f
   ```

## Testing Your Deployment

Once you have your Railway URL:

```bash
# Test health endpoint
curl https://YOUR-SERVICE.up.railway.app/health

# Test with the provided script
DEPLOYMENT_URL=https://YOUR-SERVICE.up.railway.app node test-deployment.js

# Test with API key
DEPLOYMENT_URL=https://YOUR-SERVICE.up.railway.app API_KEY=your-key node test-deployment.js
```

## Debugging Commands

```bash
# View all services
railway service

# Restart deployment
railway restart

# Open shell in container
railway shell

# View build logs
railway logs --build

# Delete and redeploy
railway down
railway up
```

## Alternative: Manual URL Discovery

If Railway CLI isn't showing the URL:

1. Login to [Railway Dashboard](https://railway.app)
2. Navigate to your project
3. Click on your service
4. Look for the deployment URL in the settings

## Common URL Patterns on Railway

Railway typically uses these patterns:
- `{service-name}-production.up.railway.app`
- `{service-name}-{random-suffix}.up.railway.app`
- `{project-name}-{service-name}.up.railway.app`

The exact pattern depends on your project and service configuration.