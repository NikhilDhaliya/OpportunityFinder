'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Search, Bookmark, Trash2, ExternalLink, Globe, 
  Users, DollarSign, TrendingUp, Calendar, Cpu, Loader2, Award, ArrowUpRight
} from 'lucide-react';

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Startup typescript interface (aligned with lib/db.ts)
interface Startup {
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

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'AI', label: 'AI & Machine Learning' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Mobile Apps', label: 'Mobile Apps' },
  { value: 'Content Creation', label: 'Content Creation' },
  { value: 'Developer Tools', label: 'Developer Tools' },
  { value: 'Crypto / Web3', label: 'Crypto & Web3' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'Productivity', label: 'Productivity' }
];

const SORT_OPTIONS = [
  { value: 'revenue-desc', label: 'Revenue (High to Low)' },
  { value: 'revenue-asc', label: 'Revenue (Low to High)' },
  { value: 'growth-desc', label: 'Growth (Highest First)' },
  { value: 'listed-desc', label: 'Listed Date (Newest First)' }
];

export default function Home() {
  // Query Filters State
  const [category, setCategory] = useState('all');
  const [maxMrr, setMaxMrr] = useState('');
  const [maxAgeDays, setMaxAgeDays] = useState('');
  const [sort, setSort] = useState('listed-desc');
  const [limit, setLimit] = useState('10');

  // App state
  const [searchResults, setSearchResults] = useState<Startup[]>([]);
  const [savedStartups, setSavedStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Load saved startups initially
  useEffect(() => {
    fetchSaved();
  }, []);

  // Show auto-dismissing feedback messages
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  const fetchSaved = async () => {
    try {
      const res = await fetch('/api/saved');
      const data = await res.json();
      if (data.data) {
        setSavedStartups(data.data);
      }
    } catch (error) {
      console.error('Error fetching saved startups:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSearchResults([]);

    const params = new URLSearchParams();
    if (category !== 'all') params.append('category', category);
    if (maxMrr) params.append('maxMrr', maxMrr);
    if (maxAgeDays) params.append('maxAgeDays', maxAgeDays);
    params.append('sort', sort);
    params.append('limit', limit);

    try {
      const res = await fetch(`/api/startups?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.data || []);
        if (data.data?.length === 0) {
          setFeedbackMsg({ text: 'No startups matched your filters.', type: 'info' });
        }
      } else {
        setErrorMsg(data.error || 'Failed to search startups');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during search');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (startup: Startup) => {
    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(startup)
      });
      if (res.ok) {
        const data = await res.json();
        setSavedStartups(data.data);
        setFeedbackMsg({ text: `Saved "${startup.name}" to portfolio.`, type: 'success' });
      } else {
        const err = await res.json();
        setFeedbackMsg({ text: err.error || 'Failed to save startup', type: 'error' });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Error saving startup', type: 'error' });
    }
  };

  const handleDelete = async (slug: string, name: string) => {
    try {
      const res = await fetch(`/api/saved?slug=${slug}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setSavedStartups(data.data);
        setFeedbackMsg({ text: `Removed "${name}" from portfolio.`, type: 'success' });
      } else {
        const err = await res.json();
        setFeedbackMsg({ text: err.error || 'Failed to remove startup', type: 'error' });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Error removing startup', type: 'error' });
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Render list of tech tags nicely
  const renderTechTags = (tech?: Startup['techStack']) => {
    if (!tech || !Array.isArray(tech) || tech.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {tech.map((item, idx) => {
          const name = typeof item === 'object' && item !== null ? item.name || item.slug : item;
          if (!name) return null;
          return (
            <span key={idx} className="px-2 py-0.5 text-xs font-mono bg-zinc-800/80 border border-zinc-700/50 rounded-md text-zinc-300">
              {name}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col relative overflow-hidden">
      {/* Top Banner Navigation */}
      <header className="border-b border-zinc-900 bg-black sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">
                OpportunityFinder
              </h1>
              <p className="text-xs text-zinc-500 font-medium">Verify revenue signals and emergence gaps</p>
            </div>
          </div>

          <nav className="flex items-center gap-4 ml-6 border-l border-zinc-800 pl-6">
            <Link 
              href="/" 
              className="text-sm font-semibold text-white transition-colors"
            >
              Startups (TrustMRR)
            </Link>
            <Link 
              href="/product-hunt" 
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Ideas (Product Hunt)
            </Link>
          </nav>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[300px]">
          <TabsList className="grid grid-cols-2 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="discover" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              <Search className="w-4 h-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              <Bookmark className="w-4 h-4 mr-2" />
              Portfolio ({savedStartups.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Left Search Filter Form (Sticky side panel, only visible on Discover tab) */}
        {activeTab === 'discover' && (
          <aside className="w-full md:w-[350px] border-r border-zinc-800 bg-zinc-950/40 backdrop-blur-sm p-6 flex flex-col gap-6 md:sticky md:top-[73px] md:h-[calc(100vh-73px)] overflow-y-auto">
            <div>
              <h2 className="text-lg font-semibold text-zinc-200">Query Filters</h2>
              <p className="text-xs text-zinc-500 mt-1">Refine startups from TrustMRR database</p>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category" className="text-xs font-semibold text-zinc-400">Category</Label>
                <Select value={category} onValueChange={(val) => setCategory(val || 'all')}>
                  <SelectTrigger id="category" className="bg-zinc-900 border-zinc-800 text-zinc-200 focus:ring-zinc-700">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="hover:bg-zinc-800 focus:bg-zinc-800">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="maxMrr" className="text-xs font-semibold text-zinc-400">Max MRR</Label>
                  <Input 
                    id="maxMrr"
                    type="number"
                    placeholder="e.g. 5000"
                    value={maxMrr}
                    onChange={(e) => setMaxMrr(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 text-zinc-200"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="maxAge" className="text-xs font-semibold text-zinc-400">Max Age (Days)</Label>
                  <Input 
                    id="maxAge"
                    type="number"
                    placeholder="e.g. 30"
                    value={maxAgeDays}
                    onChange={(e) => setMaxAgeDays(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="limit" className="text-xs font-semibold text-zinc-400">Limit Results</Label>
                <Input 
                  id="limit"
                  type="number"
                  min="1"
                  max="50"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 text-zinc-200"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="sort" className="text-xs font-semibold text-zinc-400">Sort By</Label>
                <Select value={sort} onValueChange={(val) => setSort(val || 'revenue-desc')}>
                  <SelectTrigger id="sort" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                    {SORT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold transition-colors duration-200 gap-2 h-10 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Scan Database
                  </>
                )}
              </Button>
            </form>
          </aside>
        )}

        {/* Right Dashboard Area */}
        <section className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            
            {/* Discover Tab Results */}
            {activeTab === 'discover' && (
              <motion.div
                key="discover-panel"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Search Results</h2>
                    <p className="text-sm text-zinc-400">Discover projects that match your constraints</p>
                  </div>
                  {searchResults.length > 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {searchResults.length} items found
                    </span>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg text-red-400 text-sm">
                    {errorMsg}
                  </div>
                )}

                {/* Skeletons or Cards */}
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className="h-[280px] bg-zinc-950/40 border border-zinc-900 rounded-xl animate-pulse p-6 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="h-6 w-[40%] bg-zinc-900 rounded" />
                          <div className="h-4 w-[80%] bg-zinc-900 rounded" />
                          <div className="h-4 w-[60%] bg-zinc-900 rounded" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-12 bg-zinc-900 rounded" />
                          <div className="h-12 bg-zinc-900 rounded" />
                          <div className="h-12 bg-zinc-900 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((startup, idx) => {
                      const isSaved = savedStartups.some(s => s.slug === startup.slug);
                      return (
                        <motion.div
                          key={startup.slug}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        >
                          <StartupCard 
                            startup={startup} 
                            isSaved={isSaved}
                            onSave={() => handleSave(startup)}
                            onDelete={() => handleDelete(startup.slug, startup.name)}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/10 text-center px-6">
                    <div className="p-4 bg-zinc-900/50 rounded-full border border-zinc-800 text-zinc-500 mb-4">
                      <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-zinc-300 font-semibold text-lg">No Results Discovered</h3>
                    <p className="text-zinc-500 max-w-sm text-sm mt-1">Configure your query filters on the left panel and click "Scan Database" to search.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Saved Tab Results */}
            {activeTab === 'saved' && (
              <motion.div
                key="saved-panel"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Your Portfolio</h2>
                  <p className="text-sm text-zinc-400">Monitored opportunities saved locally in database file</p>
                </div>

                {savedStartups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {savedStartups.map((startup) => (
                        <motion.div
                          key={startup.slug}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, y: 20 }}
                          transition={{ duration: 0.2 }}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        >
                          <StartupCard 
                            startup={startup} 
                            isSaved={true}
                            onDelete={() => handleDelete(startup.slug, startup.name)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/10 text-center px-6">
                    <div className="p-4 bg-zinc-900/50 rounded-full border border-zinc-800 text-zinc-500 mb-4">
                      <Bookmark className="w-8 h-8" />
                    </div>
                    <h3 className="text-zinc-300 font-semibold text-lg">Empty Portfolio</h3>
                    <p className="text-zinc-500 max-w-sm text-sm mt-1">Start exploring ideas on the "Discover" tab and save potential opportunities here.</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </section>

      </main>

      {/* Floating Interactive Toasts */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950/95 shadow-lg text-sm flex items-center gap-2 z-50 font-medium text-white`}
          >
            <span>{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable elegant startup display card
function StartupCard({ 
  startup, 
  isSaved, 
  onSave, 
  onDelete 
}: { 
  startup: Startup; 
  isSaved: boolean; 
  onSave?: () => void; 
  onDelete: () => void; 
}) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const isSoloFounder = !startup.cofounders || startup.cofounders.length === 0;

  // Render list of tech tags nicely
  const renderTechTags = (tech?: Startup['techStack']) => {
    if (!tech || !Array.isArray(tech) || tech.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-3">
        {tech.slice(0, 5).map((item, idx) => {
          const name = typeof item === 'object' && item !== null ? item.name || item.slug : item;
          if (!name) return null;
          return (
            <span key={idx} className="px-2 py-0.5 text-[10px] font-mono bg-zinc-900 border border-zinc-800 rounded text-zinc-400">
              {name}
            </span>
          );
        })}
        {tech.length > 5 && (
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-900 border border-zinc-800 rounded text-zinc-500">
            +{tech.length - 5} more
          </span>
        )}
      </div>
    );
  };

  // Render list of marketing channels nicely
  const renderMarketingChannels = (channels?: string[]) => {
    if (!channels || !Array.isArray(channels) || channels.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-2.5">
        <span className="text-[9px] font-mono text-zinc-500 uppercase self-center mr-1">Marketing:</span>
        {channels.slice(0, 4).map((item, idx) => (
          <span key={idx} className="px-1.5 py-0.5 text-[9px] font-medium bg-zinc-900/40 border border-zinc-800/80 rounded text-zinc-400">
            {item}
          </span>
        ))}
        {channels.length > 4 && (
          <span className="px-1 py-0.5 text-[9px] font-mono bg-zinc-900/40 border border-zinc-800/80 rounded text-zinc-500">
            +{channels.length - 4} more
          </span>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-zinc-950/40 border-zinc-900 hover:border-zinc-800/80 backdrop-blur-sm transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {startup.icon ? (
              <img src={startup.icon} alt={startup.name} className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-zinc-850" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-sm">
                {startup.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <CardTitle className="text-base font-bold text-white group-hover:text-white transition-colors">
                  {startup.name}
                </CardTitle>
                {startup.category === 'Product Hunt' ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-md font-semibold flex items-center gap-0.5">
                    ▲ {startup.votesCount || 0} upvotes
                  </span>
                ) : startup.rank ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-md font-semibold flex items-center gap-0.5">
                    <Award className="w-2.5 h-2.5" />
                    Rank {startup.rank}
                  </span>
                ) : null}
                {startup.category !== 'Product Hunt' && startup.onSale && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-805 text-emerald-400 rounded-md font-semibold flex items-center gap-0.5">
                    🏷️ On Sale: {formatCurrency(startup.askingPrice || 0)}
                  </span>
                )}
              </div>
              <CardDescription className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{startup.category || 'No Category'}</span>
                <span>•</span>
                <span>Launched {formatDate(startup.foundedDate)}</span>
                {startup.category !== 'Product Hunt' && startup.country && (
                  <>
                    <span>•</span>
                    <span className="text-zinc-400">📍 {startup.country}</span>
                  </>
                )}
                {startup.category !== 'Product Hunt' && startup.targetAudience && (
                  <>
                    <span>•</span>
                    <span className="text-zinc-400">👥 {startup.targetAudience}</span>
                  </>
                )}
                {startup.category !== 'Product Hunt' && startup.paymentProvider && (
                  <>
                    <span>•</span>
                    <span className="text-zinc-400">💳 {startup.paymentProvider}</span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {startup.website && (
              <a 
                href={startup.website} 
                target="_blank" 
                rel="noreferrer"
                className="p-1.5 text-zinc-500 hover:text-zinc-300 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-md transition-all"
                title="Visit Website"
              >
                <Globe className="w-3.5 h-3.5" />
              </a>
            )}
            {startup.url && (
              <a 
                href={startup.url} 
                target="_blank" 
                rel="noreferrer"
                className="p-1.5 text-zinc-500 hover:text-zinc-300 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-md transition-all"
                title={startup.category === 'Product Hunt' ? "View on Product Hunt" : "View on TrustMRR"}
              >
                {startup.category === 'Product Hunt' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
              </a>
            )}
            {isSaved ? (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onDelete}
                className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-md"
                title="Remove from Portfolio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            ) : (
              onSave && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onSave}
                  className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-md"
                  title="Save to Portfolio"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </Button>
              )
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 line-clamp-2 min-h-[32px]">
          {startup.description || 'No description provided.'}
        </p>

        {renderTechTags(startup.techStack)}
        {renderMarketingChannels(startup.marketingChannels)}
      </CardHeader>

      <CardContent className="p-5 pt-2 flex-1 flex flex-col justify-end gap-3.5">
        {/* Financial Metrics Cards Grid or Upvotes for Product Hunt */}
        {startup.category === 'Product Hunt' ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg border border-zinc-900 bg-zinc-900/20 flex flex-col justify-center">
              <span className="text-[10px] text-zinc-500 font-medium">Upvotes</span>
              <span className="text-xs font-bold text-zinc-200 mt-0.5">
                ▲ {startup.votesCount || 0}
              </span>
            </div>
            <div className="p-2 rounded-lg border border-zinc-900 bg-zinc-900/20 flex flex-col justify-center">
              <span className="text-[10px] text-zinc-500 font-medium">Platform</span>
              <span className="text-xs font-bold text-zinc-200 mt-0.5">
                Product Hunt
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg border border-zinc-900 bg-zinc-900/20 flex flex-col justify-center">
                <span className="text-[10px] text-zinc-500 font-medium">Revenue 30d</span>
                <span className="text-xs font-bold text-zinc-200 mt-0.5">
                  {formatCurrency(startup.revenue?.last30Days)}
                </span>
              </div>
              <div className="p-2 rounded-lg border border-zinc-900 bg-zinc-900/20 flex flex-col justify-center">
                <span className="text-[10px] text-zinc-500 font-medium">MRR</span>
                <span className="text-xs font-bold text-zinc-200 mt-0.5">
                  {formatCurrency(startup.revenue?.mrr)}
                </span>
              </div>
              <div className="p-2 rounded-lg border border-zinc-900 bg-zinc-900/20 flex flex-col justify-center">
                <span className="text-[10px] text-zinc-500 font-medium">Total</span>
                <span className="text-xs font-bold text-zinc-200 mt-0.5">
                  {formatCurrency(startup.revenue?.total)}
                </span>
              </div>
            </div>

            {((startup.customers !== undefined && startup.customers > 0) || (startup.activeSubscriptions !== undefined && startup.activeSubscriptions > 0)) && (
              <div className="grid grid-cols-2 gap-2">
                {startup.customers !== undefined && startup.customers > 0 ? (
                  <div className="p-1.5 px-2.5 rounded-lg border border-zinc-900/80 bg-zinc-900/10 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 font-medium">Customers</span>
                    <span className="text-xs font-bold text-zinc-300">
                      {startup.customers}
                    </span>
                  </div>
                ) : null}
                {startup.activeSubscriptions !== undefined && startup.activeSubscriptions > 0 ? (
                  <div className="p-1.5 px-2.5 rounded-lg border border-zinc-900/80 bg-zinc-900/10 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 font-medium">Active Subs</span>
                    <span className="text-xs font-bold text-zinc-300">
                      {startup.activeSubscriptions}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-zinc-900/80 bg-zinc-950/20 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          {startup.category === 'Product Hunt' ? (
            <>
              <Calendar className="w-3.5 h-3.5 text-zinc-600" />
              <span>Launched: {formatDate(startup.foundedDate)}</span>
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5 text-zinc-600" />
              <span>
                {isSoloFounder ? (
                  <span className="text-zinc-300 font-medium">Solo Founder</span>
                ) : (
                  <span>Cofounders ({startup.cofounders?.length})</span>
                )}
              </span>
            </>
          )}
        </div>

        {startup.xHandle ? (
          <a 
            href={`https://twitter.com/${startup.xHandle}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
          >
            <TwitterIcon className="w-3.5 h-3.5 text-zinc-600" />
            <span>@{startup.xHandle}</span>
            {startup.xFollowerCount !== undefined && startup.xFollowerCount > 0 && (
              <span className="text-zinc-600">({startup.xFollowerCount} followers)</span>
            )}
          </a>
        ) : (
          <span>{startup.category === 'Product Hunt' ? 'No maker social' : 'No founder social'}</span>
        )}
      </CardFooter>
    </Card>
  );
}
