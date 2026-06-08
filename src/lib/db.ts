import fs from 'fs';
import path from 'path';

export interface Startup {
  name: string;
  slug: string;
  url?: string;
  icon?: string | null;
  description?: string | null;
  website?: string | null;
  country?: string | null;
  foundedDate?: string | null;
  category?: string | null;
  votesCount?: number;
  paymentProvider?: string | null;
  targetAudience?: string | null;
  revenue?: {
    last30Days: number;
    mrr: number;
    total: number;
  };
  customers?: number;
  activeSubscriptions?: number;
  onSale?: boolean;
  askingPrice?: number | null;
  profitMarginLast30Days?: number | null;
  growth30d?: number | null;
  growthMRR30d?: number | null;
  multiple?: number | null;
  rank?: number;
  xHandle?: string | null;
  xFollowerCount?: number;
  techStack?: string[] | { name?: string; slug?: string; category?: string }[];
  marketingChannels?: string[];
  cofounders?: string[];
  savedAt?: string;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

function ensureDbExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getSavedStartups(): Startup[] {
  ensureDbExists();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as Startup[];
  } catch (error) {
    console.error('Failed to read from local DB:', error);
    return [];
  }
}

export function saveStartup(startup: Startup): Startup[] {
  ensureDbExists();
  try {
    const startups = getSavedStartups();
    const existingIndex = startups.findIndex(s => s.slug === startup.slug);
    
    const startupToSave = {
      ...startup,
      savedAt: new Date().toISOString()
    };

    if (existingIndex > -1) {
      // Update existing
      startups[existingIndex] = startupToSave;
    } else {
      // Add new
      startups.push(startupToSave);
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(startups, null, 2), 'utf-8');
    return startups;
  } catch (error) {
    console.error('Failed to save to local DB:', error);
    throw error;
  }
}

export function deleteStartup(slug: string): Startup[] {
  ensureDbExists();
  try {
    const startups = getSavedStartups();
    const filtered = startups.filter(s => s.slug !== slug);
    fs.writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return filtered;
  } catch (error) {
    console.error('Failed to delete from local DB:', error);
    throw error;
  }
}
