#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');

// Colors
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

function logColor(color, text) {
  console.log(`${color}${text}${colors.reset}`);
}

// Load Environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    logColor(colors.red, `Error: .env file not found at ${envPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();
const apiKey = env.API_KEY || env.apiKey;

if (!apiKey) {
  logColor(colors.red, 'Error: API_KEY is not defined in the .env file.');
  process.exit(1);
}

const BASE_URL = 'https://trustmrr.com/api/v1';

async function fetchWithRetry(url, options = {}, retries = 3) {
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        if (i === retries - 1) {
          throw new Error('Rate limit exceeded (429) after maximum retries');
        }
        const retryAfter = response.headers.get('Retry-After') || 5;
        logColor(colors.yellow, `Rate limit hit (429). Waiting ${retryAfter}s before retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error: ${response.status} - ${errText}`);
      }
      return await response.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      logColor(colors.yellow, `Request failed: ${err.message}. Retrying (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function getStartups(params = {}) {
  const url = new URL(`${BASE_URL}/startups`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  return await fetchWithRetry(url.toString());
}

async function getStartupDetails(slug) {
  return await fetchWithRetry(`${BASE_URL}/startups/${slug}`);
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(val) {
  if (val === undefined || val === null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function formatList(list) {
  if (!list || !Array.isArray(list) || list.length === 0) return 'N/A';
  return list.map(item => {
    if (typeof item === 'object' && item !== null) {
      return item.name || item.slug || JSON.stringify(item);
    }
    return item;
  }).join(', ');
}

async function findRecentStartups() {
  console.log('\n' + '='.repeat(60));
  logColor(colors.cyan, 'Searching for Recent Startups');
  logColor(colors.yellow, 'Criteria: Founded < 1 month ago');
  console.log('='.repeat(60));

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  let page = 1;
  let hasMore = true;
  let matchesFound = [];
  const limit = 20;

  console.log('Fetching list of startups (sorted by most recently listed)...');

  while (hasMore && matchesFound.length < 5 && page <= 5) {
    try {
      const result = await getStartups({
        sort: 'listed-desc',
        limit: limit,
        page: page
      });

      const startups = result.data || [];
      if (startups.length === 0) {
        break;
      }

      console.log(`Page ${page}: Inspecting ${startups.length} startups...`);

      for (const startup of startups) {
        const founded = startup.foundedDate ? new Date(startup.foundedDate) : null;
        
        // Filter: founded within 1 month
        if (!founded || founded < oneMonthAgo) {
          continue;
        }

        logColor(colors.green, `Checking: ${startup.name} (Founded: ${formatDate(startup.foundedDate)})`);

        // Fetch details to enrich
        try {
          // Wait 500ms to be gentle with rate limits
          await new Promise(r => setTimeout(r, 500));
          const detailsResult = await getStartupDetails(startup.slug);
          const details = detailsResult.data;

          matchesFound.push({
            ...startup,
            details
          });
          logColor(colors.green, `  [MATCH] Found recent startup: ${startup.name}`);
        } catch (e) {
          console.log(`  [ERROR] Failed to fetch details for ${startup.name}: ${e.message}`);
          matchesFound.push({
            ...startup,
            details: {}
          });
        }
      }

      hasMore = result.meta?.hasMore && startups.length === limit;
      page++;
    } catch (error) {
      logColor(colors.red, `Error fetching startups page ${page}: ${error.message}`);
      break;
    }
  }

  console.log('\n' + '='.repeat(60));
  logColor(colors.cyan, `Search complete. Found ${matchesFound.length} matching startup(s).`);
  console.log('='.repeat(60));

  if (matchesFound.length === 0) {
    logColor(colors.yellow, 'No startups met the criteria (Founded < 1 month).');
  } else {
    matchesFound.forEach((m, idx) => {
      console.log(`\n${colors.bold}${idx + 1}. ${m.name}${colors.reset} (${m.category || 'No Category'})`);
      console.log(`   Slug:              ${m.slug}`);
      console.log(`   Website:           ${m.website || 'N/A'}`);
      console.log(`   TrustMRR:          ${m.details?.url || m.url || `https://trustmrr.com/startup/${m.slug}`}`);
      console.log(`   Founded:           ${formatDate(m.foundedDate)}`);
      console.log(`   Country:           ${m.details?.country || m.country || 'N/A'}`);
      console.log(`   Target Audience:   ${m.details?.targetAudience || 'N/A'}`);
      console.log(`   Payment Provider:  ${m.details?.paymentProvider || 'N/A'}`);
      console.log(`   Customers:         ${m.details?.customers ?? 'N/A'}`);
      console.log(`   Active Subs:       ${m.details?.activeSubscriptions ?? 'N/A'}`);
      console.log(`   On Sale:           ${(m.details?.onSale || m.onSale) ? 'Yes' : 'No'}`);
      if (m.details?.onSale || m.onSale) {
        console.log(`   Asking Price:      ${colors.green}${formatCurrency(m.details?.askingPrice || m.askingPrice)}${colors.reset}`);
      }
      console.log(`   Description:       ${m.description || 'N/A'}`);
      console.log(`   Revenue (Last 30d): ${colors.green}${formatCurrency(m.revenue?.last30Days)}${colors.reset}`);
      console.log(`   MRR:                ${colors.green}${formatCurrency(m.revenue?.mrr)}${colors.reset}`);
      console.log(`   Total Revenue:      ${colors.green}${formatCurrency(m.revenue?.total)}${colors.reset}`);
      console.log(`   Founder X/Twitter:  @${m.xHandle || 'N/A'} (${m.details?.xFollowerCount || 0} followers)`);
      console.log(`   Tech Stack:         ${formatList(m.details?.techStack)}`);
      console.log(`   Marketing Channels: ${formatList(m.details?.marketingChannels)}`);
    });
  }
}

async function customSearch(rl) {
  console.log('\n--- Custom Startup Search ---');
  
  const category = await rl.question('Enter Category (e.g. AI, SaaS, E-commerce, Content Creation) [All]: ');
  const maxMrrStr = await rl.question('Enter Max MRR in USD [No Max]: ');
  const maxAgeStr = await rl.question('Enter Max Age in days [No Limit]: ');
  const sortBy = await rl.question('Sort by (listed-desc, revenue-desc, revenue-asc, growth-desc) [listed-desc]: ');
  const limitStr = await rl.question('Limit results per page [10]: ');

  const params = {
    sort: sortBy.trim() || 'listed-desc',
    limit: parseInt(limitStr.trim(), 10) || 10
  };

  if (category.trim()) params.category = category.trim();
  if (maxMrrStr.trim()) params.maxMrr = parseFloat(maxMrrStr.trim());

  logColor(colors.cyan, '\nFetching results...');
  try {
    const result = await getStartups(params);
    let startups = result.data || [];

    // Filter by age programmatically if needed
    if (maxAgeStr.trim()) {
      const maxAgeDays = parseInt(maxAgeStr.trim(), 10);
      const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
      startups = startups.filter(s => s.foundedDate && new Date(s.foundedDate) >= cutoffDate);
    }

    const enrichedStartups = [];

    for (const startup of startups) {
      console.log(`Fetching details for ${startup.name}...`);
      await new Promise(r => setTimeout(r, 300));
      try {
        const detailsResult = await getStartupDetails(startup.slug);
        const details = detailsResult.data;
        enrichedStartups.push({ ...startup, details });
      } catch (e) {
        enrichedStartups.push(startup);
      }
    }

    console.log(`\nFound ${enrichedStartups.length} results:`);
    enrichedStartups.forEach((m, idx) => {
      console.log(`\n${idx + 1}. ${colors.bold}${m.name}${colors.reset} (${m.category || 'No Category'})`);
      console.log(`   Slug:              ${m.slug}`);
      console.log(`   Website:           ${m.website || 'N/A'}`);
      console.log(`   TrustMRR:          ${m.details?.url || m.url || `https://trustmrr.com/startup/${m.slug}`}`);
      console.log(`   Founded:           ${formatDate(m.foundedDate)}`);
      console.log(`   Country:           ${m.details?.country || m.country || 'N/A'}`);
      console.log(`   Target Audience:   ${m.details?.targetAudience || 'N/A'}`);
      console.log(`   Payment Provider:  ${m.details?.paymentProvider || 'N/A'}`);
      console.log(`   Customers:         ${m.details?.customers ?? 'N/A'}`);
      console.log(`   Active Subs:       ${m.details?.activeSubscriptions ?? 'N/A'}`);
      console.log(`   On Sale:           ${(m.details?.onSale || m.onSale) ? 'Yes' : 'No'}`);
      if (m.details?.onSale || m.onSale) {
        console.log(`   Asking Price:      ${colors.green}${formatCurrency(m.details?.askingPrice || m.askingPrice)}${colors.reset}`);
      }
      console.log(`   Revenue 30d:       ${colors.green}${formatCurrency(m.revenue?.last30Days)}${colors.reset}`);
      console.log(`   MRR:               ${colors.green}${formatCurrency(m.revenue?.mrr)}${colors.reset}`);
      console.log(`   X/Twitter:         @${m.xHandle || 'N/A'}${m.details?.xFollowerCount ? ` (${m.details.xFollowerCount} followers)` : ''}`);
    });

  } catch (error) {
    logColor(colors.red, `Search failed: ${error.message}`);
  }
}

async function showDetailsBySlug(rl) {
  const slug = await rl.question('\nEnter Startup Slug: ');
  if (!slug.trim()) return;

  logColor(colors.cyan, 'Fetching detailed info...');
  try {
    const detailsResult = await getStartupDetails(slug.trim());
    const m = detailsResult.data;

    console.log('\n' + '='.repeat(60));
    logColor(colors.bold, m.name.toUpperCase());
    console.log('='.repeat(60));
    console.log(`Description:          ${m.description || 'N/A'}`);
    console.log(`Website:              ${m.website || 'N/A'}`);
    console.log(`TrustMRR URL:         ${m.url || `https://trustmrr.com/startup/${m.slug}`}`);
    console.log(`Category:             ${m.category || 'N/A'}`);
    console.log(`Founded Date:         ${formatDate(m.foundedDate)}`);
    console.log(`Country:              ${m.country || 'N/A'}`);
    console.log(`Payment Provider:     ${m.paymentProvider || 'N/A'}`);
    console.log(`Target Audience:      ${m.targetAudience || 'N/A'}`);
    console.log(`Revenue (Last 30 Days): ${colors.green}${formatCurrency(m.revenue?.last30Days)}${colors.reset}`);
    console.log(`MRR:                  ${colors.green}${formatCurrency(m.revenue?.mrr)}${colors.reset}`);
    console.log(`Total Revenue:        ${colors.green}${formatCurrency(m.revenue?.total)}${colors.reset}`);
    console.log(`Active Subscriptions: ${m.activeSubscriptions || 0}`);
    console.log(`Customers:            ${m.customers || 0}`);
    console.log(`Founder X/Twitter:    @${m.xHandle || 'N/A'} (${m.xFollowerCount || 0} followers)`);
    console.log(`Cofounders:           ${m.cofounders?.join(', ') || 'None (Solo Founder)'}`);
    console.log(`Tech Stack:           ${formatList(m.techStack)}`);
    console.log(`Marketing Channels:   ${formatList(m.marketingChannels)}`);
    console.log(`On Sale:              ${m.onSale ? 'Yes' : 'No'}`);
    if (m.onSale) {
      console.log(`Asking Price:         ${colors.green}${formatCurrency(m.askingPrice)}${colors.reset}`);
    }
  } catch (error) {
    logColor(colors.red, `Failed to retrieve details: ${error.message}`);
  }
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  while (true) {
    console.log('\n' + '='.repeat(40));
    logColor(colors.bold + colors.green, '   TRUSTMRR TERMINAL EXPLORER');
    console.log('='.repeat(40));
    console.log('1. Search recent (<1mo) startups');
    console.log('2. Custom startup search (interactive filters)');
    console.log('3. Get startup details by slug');
    console.log('4. Exit');
    console.log('-'.repeat(40));
    
    const choice = await rl.question('Choose an option: ');
    
    if (choice.trim() === '1') {
      await findRecentStartups();
    } else if (choice.trim() === '2') {
      await customSearch(rl);
    } else if (choice.trim() === '3') {
      await showDetailsBySlug(rl);
    } else if (choice.trim() === '4') {
      break;
    } else {
      logColor(colors.red, 'Invalid option. Please choose 1, 2, 3, or 4.');
    }
  }

  rl.close();
  console.log('\nGoodbye!');
}

main().catch(err => {
  logColor(colors.red, `Fatal Error: ${err.message}`);
  process.exit(1);
});
