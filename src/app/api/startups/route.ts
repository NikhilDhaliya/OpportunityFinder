import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://trustmrr.com/api/v1';

async function fetchWithRetry(url: string, apiKey: string, options: RequestInit = {}, retries = 3): Promise<any> {
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 429) {
        if (i === retries - 1) {
          throw new Error('Rate limit exceeded (429) after maximum retries');
        }
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
        console.warn(`Rate limit hit (429). Waiting ${retryAfter}s before retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error: ${response.status} - ${errText}`);
      }
      return await response.json();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.warn(`Request failed: ${err.message}. Retrying (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API_KEY is not configured in the environment' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const maxMrr = searchParams.get('maxMrr');
  const maxAgeDays = searchParams.get('maxAgeDays');
  const sort = searchParams.get('sort') || 'revenue-desc';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  // Construct URL for TrustMRR API
  const url = new URL(`${BASE_URL}/startups`);
  url.searchParams.append('sort', sort);
  
  if (category && category !== 'all') {
    url.searchParams.append('category', category);
  }

  try {
    let startups: any[] = [];
    let page = 1;
    const maxPages = (maxAgeDays || maxMrr) ? 4 : 1;
    let hasMorePages = true;

    while (page <= maxPages && hasMorePages) {
      const pageUrl = new URL(url.toString());
      pageUrl.searchParams.append('page', page.toString());
      const pageLimit = (maxAgeDays || maxMrr) ? 40 : limit;
      pageUrl.searchParams.append('limit', pageLimit.toString());

      const listResult = await fetchWithRetry(pageUrl.toString(), apiKey);
      const pageData = listResult.data || [];
      
      if (pageData.length === 0) {
        break;
      }
      
      startups = [...startups, ...pageData];
      hasMorePages = listResult.meta?.hasMore || false;
      
      if (!maxAgeDays && !maxMrr) {
        break;
      }
      
      if (startups.length >= 120) {
        break;
      }

      page++;
      await new Promise(r => setTimeout(r, 100));
    }

    // Filter by maxMrr
    if (maxMrr) {
      const maxMrrVal = parseFloat(maxMrr);
      startups = startups.filter((s: any) => (s.revenue?.mrr || 0) <= maxMrrVal);
    }

    // Filter by max age
    if (maxAgeDays) {
      const days = parseInt(maxAgeDays, 10);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      startups = startups.filter((s: any) => s.foundedDate && new Date(s.foundedDate) >= cutoffDate);
    }

    // Retrieve detailed information for all startups up to the limit
    const filteredStartups: any[] = [];
    
    for (const startup of startups) {
      // Break early if we've satisfied the limit
      if (filteredStartups.length >= limit) {
        break;
      }

      try {
        // Delay to respect rate limits (300ms)
        await new Promise(r => setTimeout(r, 300));
        const detailsResult = await fetchWithRetry(`${BASE_URL}/startups/${startup.slug}`, apiKey);
        const details = detailsResult.data;

        filteredStartups.push({
          ...startup,
          url: details.url || startup.url || `https://trustmrr.com/startup/${startup.slug}`,
          xFollowerCount: details.xFollowerCount || 0,
          techStack: details.techStack || [],
          marketingChannels: details.marketingChannels || [],
          cofounders: details.cofounders || [],
          description: details.description || startup.description,
          country: details.country || startup.country || null,
          paymentProvider: details.paymentProvider || startup.paymentProvider || null,
          targetAudience: details.targetAudience || startup.targetAudience || null,
          activeSubscriptions: details.activeSubscriptions !== undefined ? details.activeSubscriptions : (startup.activeSubscriptions || 0),
          customers: details.customers !== undefined ? details.customers : (startup.customers || 0),
          onSale: details.onSale !== undefined ? details.onSale : (startup.onSale || false),
          askingPrice: details.askingPrice !== undefined ? details.askingPrice : (startup.askingPrice || null),
          revenue: details.revenue || startup.revenue
        });
      } catch (e: any) {
        console.error(`Failed to fetch details for ${startup.slug}:`, e.message);
        // If detailed fetch fails, fall back to list item without details
        filteredStartups.push(startup);
      }
    }

    return NextResponse.json({
      data: filteredStartups,
      meta: {
        total: filteredStartups.length,
        hasMore: hasMorePages && filteredStartups.length === limit
      }
    });

  } catch (error: any) {
    console.error('Error fetching startups:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
