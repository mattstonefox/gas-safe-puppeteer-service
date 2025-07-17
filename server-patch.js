// Patch for Railway Puppeteer issues
// Add these options to your puppeteer.launch() call in server.js

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
    '--disable-site-isolation-trials',
    // Additional args for Railway
    '--single-process',
    '--disable-extensions',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--no-default-browser-check',
    '--no-first-run',
    '--disable-default-apps',
    '--disable-background-timer-throttling',
    '--disable-domain-reliability'
  ],
  ignoreDefaultArgs: ['--disable-extensions'],
  // Add these options
  ignoreHTTPSErrors: true,
  dumpio: true, // This will help debug issues
  timeout: 60000 // Increase timeout
});