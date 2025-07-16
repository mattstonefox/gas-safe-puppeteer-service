import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function checkRailwayCLI() {
  console.log('🔍 Checking Railway CLI...\n');
  
  try {
    const { stdout } = await execAsync('railway --version');
    console.log(`✅ Railway CLI installed: ${stdout.trim()}`);
    return true;
  } catch (error) {
    console.log('❌ Railway CLI not installed or not in PATH');
    console.log('   Install with: npm install -g @railway/cli');
    return false;
  }
}

async function checkRailwayAuth() {
  console.log('\n🔐 Checking Railway authentication...\n');
  
  try {
    const { stdout } = await execAsync('railway whoami');
    console.log(`✅ Authenticated as: ${stdout.trim()}`);
    return true;
  } catch (error) {
    console.log('❌ Not authenticated with Railway');
    console.log('   Run: railway login');
    return false;
  }
}

async function checkRailwayProject() {
  console.log('\n📁 Checking Railway project...\n');
  
  try {
    // Check if we're in a Railway project
    const { stdout: status } = await execAsync('railway status');
    console.log('✅ Railway project status:');
    console.log(status);
    
    // Try to get the deployment URL
    try {
      const { stdout: domain } = await execAsync('railway domain');
      console.log(`\n🌐 Deployment URL: ${domain.trim()}`);
    } catch {
      console.log('\n⚠️  No domain configured or deployment not ready');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Not connected to a Railway project');
    console.log('   Run: railway link');
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔧 Checking environment variables...\n');
  
  try {
    const { stdout } = await execAsync('railway variables');
    const lines = stdout.trim().split('\n');
    
    if (lines.length === 0 || lines[0] === '') {
      console.log('⚠️  No environment variables set');
    } else {
      console.log('✅ Environment variables configured:');
      lines.forEach(line => {
        const [key] = line.split('=');
        if (key) console.log(`   - ${key}`);
      });
    }
    
    // Check for required vars
    const requiredVars = ['PORT', 'API_KEY', 'ALLOWED_ORIGINS'];
    const configuredVars = lines.map(line => line.split('=')[0]).filter(Boolean);
    
    console.log('\n📋 Required variables check:');
    requiredVars.forEach(varName => {
      const isSet = configuredVars.includes(varName);
      console.log(`   ${isSet ? '✅' : '⚠️ '} ${varName}`);
    });
    
  } catch (error) {
    console.log('❌ Could not fetch environment variables');
    console.log('   Error:', error.message);
  }
}

async function checkDeploymentLogs() {
  console.log('\n📜 Recent deployment logs...\n');
  
  try {
    const { stdout } = await execAsync('railway logs --last 50');
    
    // Look for common issues in logs
    const issues = [];
    
    if (stdout.includes('Error: Cannot find module')) {
      issues.push('Missing dependencies - check package.json');
    }
    if (stdout.includes('EADDRINUSE')) {
      issues.push('Port already in use - ensure using process.env.PORT');
    }
    if (stdout.includes('Failed to launch the browser process')) {
      issues.push('Puppeteer launch failure - check Chromium installation');
    }
    if (stdout.includes('Health check failed')) {
      issues.push('Health check endpoint not responding');
    }
    
    if (issues.length > 0) {
      console.log('⚠️  Potential issues detected:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n');
    }
    
    console.log('Last 10 log lines:');
    const lastLines = stdout.trim().split('\n').slice(-10);
    lastLines.forEach(line => console.log(`   ${line}`));
    
  } catch (error) {
    console.log('❌ Could not fetch logs');
    console.log('   Try: railway logs');
  }
}

async function checkDockerBuild() {
  console.log('\n🐳 Checking Docker build...\n');
  
  // Check if Dockerfile exists
  try {
    await fs.access('Dockerfile');
    console.log('✅ Dockerfile found');
    
    // Check Dockerfile for common issues
    const dockerfile = await fs.readFile('Dockerfile', 'utf-8');
    
    const checks = [
      {
        pattern: /PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true/,
        message: 'Skipping Chromium download (using system Chromium)',
      },
      {
        pattern: /PUPPETEER_EXECUTABLE_PATH/,
        message: 'Custom Chromium path configured',
      },
      {
        pattern: /apt-get.*chromium/,
        message: 'Installing Chromium via apt',
      },
      {
        pattern: /USER nodejs/,
        message: 'Running as non-root user (security best practice)',
      },
      {
        pattern: /HEALTHCHECK/,
        message: 'Health check configured',
      },
    ];
    
    console.log('\n📋 Dockerfile checks:');
    checks.forEach(({ pattern, message }) => {
      const found = pattern.test(dockerfile);
      console.log(`   ${found ? '✅' : '⚠️ '} ${message}`);
    });
    
  } catch (error) {
    console.log('❌ Dockerfile not found');
    console.log('   Railway requires a Dockerfile for custom builds');
  }
}

async function generateDebuggingCommands() {
  console.log('\n\n🛠️  Useful debugging commands:\n');
  
  const commands = [
    {
      cmd: 'railway up',
      desc: 'Deploy the current directory to Railway',
    },
    {
      cmd: 'railway logs --last 100',
      desc: 'View last 100 log lines',
    },
    {
      cmd: 'railway run node server.js',
      desc: 'Run locally with Railway environment',
    },
    {
      cmd: 'railway restart',
      desc: 'Restart the deployment',
    },
    {
      cmd: 'railway domain',
      desc: 'Get the deployment URL',
    },
    {
      cmd: 'railway shell',
      desc: 'Open a shell in the deployment container',
    },
  ];
  
  commands.forEach(({ cmd, desc }) => {
    console.log(`   ${cmd}`);
    console.log(`     └─ ${desc}\n`);
  });
}

async function checkPuppeteerCompatibility() {
  console.log('\n🎭 Checking Puppeteer compatibility...\n');
  
  console.log('📋 Railway Puppeteer requirements:');
  console.log('   ✓ Use Alpine or Debian slim base image');
  console.log('   ✓ Install Chromium dependencies');
  console.log('   ✓ Set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true');
  console.log('   ✓ Set PUPPETEER_EXECUTABLE_PATH to system Chromium');
  console.log('   ✓ Use --no-sandbox flag in production');
  console.log('   ✓ Configure proper memory limits (min 512MB)');
}

// Run all checks
async function runDiagnostics() {
  console.log('🚀 Railway Deployment Diagnostics\n');
  console.log('='.repeat(50));
  
  const cliInstalled = await checkRailwayCLI();
  
  if (cliInstalled) {
    const authenticated = await checkRailwayAuth();
    
    if (authenticated) {
      await checkRailwayProject();
      await checkEnvironmentVariables();
      await checkDeploymentLogs();
    }
  }
  
  await checkDockerBuild();
  await checkPuppeteerCompatibility();
  await generateDebuggingCommands();
  
  console.log('\n💡 Common Railway + Puppeteer fixes:\n');
  console.log('1. Memory issues: Increase service memory in Railway dashboard');
  console.log('2. Chromium not found: Ensure Dockerfile installs all dependencies');
  console.log('3. Port binding: Always use process.env.PORT || 3000');
  console.log('4. Health checks failing: Increase timeout in railway.json');
  console.log('5. DNS not resolving: Wait 2-5 minutes after deployment');
}

runDiagnostics().catch(console.error);