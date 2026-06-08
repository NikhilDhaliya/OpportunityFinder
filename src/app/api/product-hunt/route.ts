import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api.producthunt.com/v2/api/graphql';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getPHAccessToken(): Promise<string> {
  const clientId = process.env.PH_API_KEY;
  const clientSecret = process.env.PH_API_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Product Hunt API credentials are not configured in .env');
  }

  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch('https://api.producthunt.com/v2/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    }),
    cache: 'no-store'
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to get Product Hunt token: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
  return cachedToken!;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'today';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const hasCredentials = !!(process.env.PH_API_KEY && process.env.PH_API_SECRET);

  if (!hasCredentials) {
    return NextResponse.json({ data: getMockData(timeframe, limit), source: 'mock' });
  }

  try {
    const token = await getPHAccessToken();
    
    const now = new Date();
    const postedAfter = new Date();
    
    if (timeframe === 'today') {
      postedAfter.setHours(now.getHours() - 24);
    } else if (timeframe === 'week') {
      postedAfter.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      postedAfter.setDate(now.getDate() - 30);
    } else if (timeframe === 'year') {
      postedAfter.setDate(now.getDate() - 365);
    }
    
    const query = `
      query GetTopPHProducts($first: Int, $postedAfter: DateTime) {
        posts(order: VOTES, first: $first, postedAfter: $postedAfter) {
          edges {
            node {
              id
              name
              tagline
              votesCount
              url
              website
              thumbnail {
                url
              }
              createdAt
              makers {
                name
                twitterUsername
              }
            }
          }
        }
      }
    `;

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: {
          first: limit,
          postedAfter: postedAfter.toISOString()
        }
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Product Hunt GraphQL API error: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL Errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
    }

    const edges = result.data?.posts?.edges || [];
    const products = edges.map((edge: any) => {
      const node = edge.node;
      return {
        id: node.id,
        name: node.name,
        description: node.tagline,
        votesCount: node.votesCount || 0,
        url: node.url,
        website: node.website || node.url,
        icon: node.thumbnail?.url || null,
        foundedDate: node.createdAt,
        xHandle: node.makers?.[0]?.twitterUsername || null,
        category: 'Product Hunt'
      };
    });

    return NextResponse.json({ data: products, source: 'api' });

  } catch (error: any) {
    console.error('Product Hunt API failed, falling back to mock data:', error.message);
    return NextResponse.json({ 
      data: getMockData(timeframe, limit),
      source: 'mock',
      warning: `Product Hunt API failed: ${error.message}. Loaded mock data.`
    });
  }
}

function getMockData(timeframe: string, limit: number) {
  const now = new Date();
  
  const todayMocks = [
    {
      id: 'ph-1',
      name: 'Bolt.new V2',
      description: 'Full-stack web applications in your browser, now with local database support & container terminals.',
      votesCount: 843,
      url: 'https://www.producthunt.com/posts/bolt-new-v2',
      website: 'https://bolt.new',
      icon: null,
      foundedDate: now.toISOString(),
      xHandle: 'stackblitz',
      category: 'Product Hunt'
    },
    {
      id: 'ph-2',
      name: 'Lovable GPT',
      description: 'Build complete production-grade SaaS apps using simple natural language prompts.',
      votesCount: 712,
      url: 'https://www.producthunt.com/posts/lovable-gpt',
      website: 'https://lovable.dev',
      icon: null,
      foundedDate: now.toISOString(),
      xHandle: 'lovable_dev',
      category: 'Product Hunt'
    },
    {
      id: 'ph-3',
      name: 'Cursor Composer 2.0',
      description: 'Multi-file code editing AI workspace that lives directly inside your editor.',
      votesCount: 654,
      url: 'https://www.producthunt.com/posts/cursor-composer-2-0',
      website: 'https://cursor.com',
      icon: null,
      foundedDate: now.toISOString(),
      xHandle: 'cursor_ai',
      category: 'Product Hunt'
    },
    {
      id: 'ph-4',
      name: 'v0 by Vercel',
      description: 'Generative UI system that builds beautiful React and Tailwind code instantly.',
      votesCount: 592,
      url: 'https://www.producthunt.com/posts/v0-by-vercel',
      website: 'https://v0.dev',
      icon: null,
      foundedDate: now.toISOString(),
      xHandle: 'vercel',
      category: 'Product Hunt'
    },
    {
      id: 'ph-5',
      name: 'Supabase Studio v3',
      description: 'Manage your PostgreSQL databases with automated AI-assisted migrations & schema visualizers.',
      votesCount: 521,
      url: 'https://www.producthunt.com/posts/supabase-studio-v3',
      website: 'https://supabase.com',
      icon: null,
      foundedDate: now.toISOString(),
      xHandle: 'supabase',
      category: 'Product Hunt'
    }
  ];

  const weekMocks = [
    {
      id: 'ph-w1',
      name: 'Claude 4.5 Sonnet',
      description: 'The most intelligent model yet, featuring advanced agentic computer-use capabilities.',
      votesCount: 2314,
      url: 'https://www.producthunt.com/posts/claude-4-5-sonnet',
      website: 'https://anthropic.com',
      icon: null,
      foundedDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      xHandle: 'anthropic_ai',
      category: 'Product Hunt'
    },
    {
      id: 'ph-w2',
      name: 'Resend Broadcasts',
      description: 'Send marketing newsletters to all your users with standard clean React templates.',
      votesCount: 1845,
      url: 'https://www.producthunt.com/posts/resend-broadcasts',
      website: 'https://resend.com',
      icon: null,
      foundedDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      xHandle: 'resend',
      category: 'Product Hunt'
    },
    {
      id: 'ph-w3',
      name: 'Linear Asks',
      description: 'Collect internal requests, bug reports, and feedback directly inside Slack.',
      votesCount: 1542,
      url: 'https://www.producthunt.com/posts/linear-asks',
      website: 'https://linear.app',
      icon: null,
      foundedDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      xHandle: 'linear',
      category: 'Product Hunt'
    }
  ];

  const monthMocks = [
    {
      id: 'ph-m1',
      name: 'V0 Pages',
      description: 'Create multi-page web prototypes directly from text or image uploads.',
      votesCount: 3412,
      url: 'https://www.producthunt.com/posts/v0-pages',
      website: 'https://v0.dev',
      icon: null,
      foundedDate: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      xHandle: 'vercel',
      category: 'Product Hunt'
    },
    {
      id: 'ph-m2',
      name: 'Polar Creator Platform',
      description: 'The open-source alternative to Patreon and Buy Me A Coffee for developer ecosystems.',
      votesCount: 2890,
      url: 'https://www.producthunt.com/posts/polar-creator-platform',
      website: 'https://polar.sh',
      icon: null,
      foundedDate: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString(),
      xHandle: 'polar_sh',
      category: 'Product Hunt'
    }
  ];

  const yearMocks = [
    {
      id: 'ph-y1',
      name: 'Cursor AI',
      description: 'The AI-first code editor designed to make you 10x faster at software building.',
      votesCount: 8431,
      url: 'https://www.producthunt.com/posts/cursor-ai',
      website: 'https://cursor.sh',
      icon: null,
      foundedDate: new Date(Date.now() - 240 * 24 * 3600 * 1000).toISOString(),
      xHandle: 'cursor_ai',
      category: 'Product Hunt'
    },
    {
      id: 'ph-y2',
      name: 'shadcn/ui blocks',
      description: 'Ready-to-use HTML/Tailwind components for dashboards, login, cards, and page layout.',
      votesCount: 7120,
      url: 'https://www.producthunt.com/posts/shadcn-ui-blocks',
      website: 'https://ui.shadcn.com',
      icon: null,
      foundedDate: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
      xHandle: 'shadcn',
      category: 'Product Hunt'
    }
  ];

  let source = todayMocks;
  if (timeframe === 'week') source = [...weekMocks, ...todayMocks];
  else if (timeframe === 'month') source = [...monthMocks, ...weekMocks, ...todayMocks];
  else if (timeframe === 'year') source = [...yearMocks, ...monthMocks, ...todayMocks];

  source.sort((a, b) => b.votesCount - a.votesCount);
  return source.slice(0, limit);
}
