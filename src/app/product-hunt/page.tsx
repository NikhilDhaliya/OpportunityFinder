'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Search, Bookmark, Trash2, Globe, 
  TrendingUp, Calendar, Loader2, ArrowUpRight
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Product {
  id: string;
  name: string;
  description: string;
  votesCount: number;
  url: string;
  website: string;
  icon: string | null;
  foundedDate: string;
  xHandle: string | null;
  category: string;
}

export default function ProductHuntPage() {
  const [timeframe, setTimeframe] = useState('today');
  const [limit, setLimit] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchSaved();
  }, []);

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
        setSavedProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSearchResults([]);

    const params = new URLSearchParams();
    params.append('timeframe', timeframe);
    params.append('limit', limit);

    try {
      const res = await fetch(`/api/product-hunt?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.data || []);
        if (data.data?.length === 0) {
          setFeedbackMsg({ text: 'No products found.', type: 'info' });
        }
      } else {
        setErrorMsg(data.error || 'Failed to fetch Product Hunt posts');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (product: Product) => {
    const payload = {
      slug: `ph-${product.id}`,
      name: product.name,
      description: product.description,
      votesCount: product.votesCount,
      url: product.url,
      website: product.website,
      icon: product.icon,
      foundedDate: product.foundedDate,
      xHandle: product.xHandle,
      category: 'Product Hunt'
    };

    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setSavedProducts(data.data);
        setFeedbackMsg({ text: `Saved "${product.name}" to portfolio.`, type: 'success' });
      } else {
        const err = await res.json();
        setFeedbackMsg({ text: err.error || 'Failed to save product', type: 'error' });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Error saving product', type: 'error' });
    }
  };

  const handleDelete = async (slug: string, name: string) => {
    try {
      const res = await fetch(`/api/saved?slug=${slug}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setSavedProducts(data.data);
        setFeedbackMsg({ text: `Removed "${name}" from portfolio.`, type: 'success' });
      } else {
        const err = await res.json();
        setFeedbackMsg({ text: err.error || 'Failed to remove item', type: 'error' });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Error removing item', type: 'error' });
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Startups (TrustMRR)
            </Link>
            <Link 
              href="/product-hunt" 
              className="text-sm font-semibold text-white transition-colors"
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
              Portfolio ({savedProducts.filter(item => item.category === 'Product Hunt').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Left Search Filter Form */}
        {activeTab === 'discover' && (
          <aside className="w-full md:w-[350px] border-r border-zinc-800 bg-zinc-950/40 backdrop-blur-sm p-6 flex flex-col gap-6 md:sticky md:top-[73px] md:h-[calc(100vh-73px)] overflow-y-auto">
            <div>
              <h2 className="text-lg font-semibold text-zinc-200">Product Hunt Filters</h2>
              <p className="text-xs text-zinc-500 mt-1">Get the best ideas and top launches</p>
            </div>

            <form onSubmit={handleScan} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="timeframe" className="text-xs font-semibold text-zinc-400">Timeframe</Label>
                <Select value={timeframe} onValueChange={(val) => setTimeframe(val || 'today')}>
                  <SelectTrigger id="timeframe" className="bg-zinc-900 border-zinc-800 text-zinc-200 focus:ring-zinc-700">
                    <SelectValue placeholder="Select Timeframe" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                    <SelectItem value="today" className="hover:bg-zinc-800 focus:bg-zinc-800">Best Idea Today</SelectItem>
                    <SelectItem value="week" className="hover:bg-zinc-800 focus:bg-zinc-800">Top 10 This Week</SelectItem>
                    <SelectItem value="month" className="hover:bg-zinc-800 focus:bg-zinc-800">Top 10 This Month</SelectItem>
                    <SelectItem value="year" className="hover:bg-zinc-800 focus:bg-zinc-800">Top 10 This Year</SelectItem>
                  </SelectContent>
                </Select>
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

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold mt-4 transition-all flex items-center justify-center gap-2 h-10 rounded-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Scan Product Hunt
                  </>
                )}
              </Button>
            </form>
          </aside>
        )}

        {/* Right Content Panel */}
        <section className="flex-1 p-6 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'discover' ? (
              <motion.div
                key="discover"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Search Results</h2>
                    <p className="text-sm text-zinc-400">Discover top performing projects from Product Hunt</p>
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
                      <div key={idx} className="h-[240px] bg-zinc-950/40 border border-zinc-900 rounded-xl animate-pulse p-6 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="h-6 w-[40%] bg-zinc-900 rounded" />
                          <div className="h-4 w-[80%] bg-zinc-900 rounded" />
                          <div className="h-4 w-[60%] bg-zinc-900 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-12 bg-zinc-900 rounded" />
                          <div className="h-12 bg-zinc-900 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((product, idx) => {
                      const isSaved = savedProducts.some(s => s.slug === `ph-${product.id}`);
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        >
                          <ProductCard 
                            product={product} 
                            isSaved={isSaved}
                            onSave={() => handleSave(product)}
                            onDelete={() => handleDelete(`ph-${product.id}`, product.name)}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border border-zinc-900 rounded-xl bg-zinc-950/20 backdrop-blur-sm">
                    <Search className="w-10 h-10 text-zinc-700 mb-3" />
                    <p className="text-sm font-semibold text-zinc-300">No results to display</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-[280px] text-center">
                      Configure your timeframe and hit scan to fetch launches from Product Hunt.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="saved"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Your Portfolio</h2>
                  <p className="text-sm text-zinc-400">Review all startups and ideas you saved across TrustMRR & Product Hunt</p>
                </div>

                {savedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {savedProducts.map((item) => (
                      <div key={item.slug} className="h-full">
                        {item.category === 'Product Hunt' ? (
                          <ProductCard 
                            product={{
                              id: item.slug.replace('ph-', ''),
                              name: item.name,
                              description: item.description || '',
                              votesCount: item.votesCount || 0,
                              url: item.url || '',
                              website: item.website || '',
                              icon: item.icon,
                              foundedDate: item.foundedDate || '',
                              xHandle: item.xHandle || null,
                              category: 'Product Hunt'
                            }} 
                            isSaved={true}
                            onDelete={() => handleDelete(item.slug, item.name)}
                          />
                        ) : (
                          // Normal startup card view since we saved a TrustMRR startup
                          <div className="p-5 bg-zinc-950/40 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-all flex flex-col justify-between h-full relative group">
                            <div>
                              <div className="flex items-center justify-between gap-3 mb-2.5">
                                <div className="flex items-center gap-2.5">
                                  {item.icon ? (
                                    <img src={item.icon} alt={item.name} className="w-8 h-8 rounded-md object-cover bg-zinc-900 border border-zinc-850" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-xs">
                                      {item.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-bold text-sm text-white">{item.name}</h3>
                                    <span className="text-[10px] text-zinc-500">{item.category || 'Startup'}</span>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDelete(item.slug, item.name)}
                                  className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-md"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                                {item.description || 'No description provided.'}
                              </p>
                              
                              <div className="grid grid-cols-3 gap-1.5 bg-zinc-900/10 border border-zinc-900/60 p-2 rounded-lg mb-2">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-zinc-500">Rev 30d</span>
                                  <span className="text-xs font-bold text-zinc-200 mt-0.5">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.revenue?.last30Days || 0)}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-zinc-500">MRR</span>
                                  <span className="text-xs font-bold text-zinc-200 mt-0.5">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.revenue?.mrr || 0)}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-zinc-500">Total</span>
                                  <span className="text-xs font-bold text-zinc-200 mt-0.5">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.revenue?.total || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-900/80 pt-2.5 mt-2">
                              <span>Launched {formatDate(item.foundedDate)}</span>
                              {item.xHandle && <span>@{item.xHandle}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border border-zinc-900 rounded-xl bg-zinc-950/20 backdrop-blur-sm">
                    <Bookmark className="w-10 h-10 text-zinc-700 mb-3" />
                    <p className="text-sm font-semibold text-zinc-300">Your portfolio is empty</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-[280px] text-center">
                      Save ideas or startups during your search to see them in your portfolio.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Floating Status Notification Alerts */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg border text-sm font-medium shadow-2xl flex items-center gap-2.5 max-w-sm ${
              feedbackMsg.type === 'success' 
                ? 'bg-zinc-900 border-zinc-800 text-white' 
                : feedbackMsg.type === 'error'
                ? 'bg-zinc-950 border-red-950 text-red-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
          >
            <span>{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Product hunt specific card component matching TrustMRR styles
function ProductCard({ 
  product, 
  isSaved, 
  onSave, 
  onDelete 
}: { 
  product: Product; 
  isSaved: boolean; 
  onSave?: () => void; 
  onDelete?: () => void; 
}) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Card className="bg-zinc-950/40 border-zinc-900 hover:border-zinc-800/80 backdrop-blur-sm transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {product.icon ? (
              <img src={product.icon} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-zinc-850" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-sm">
                {product.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <CardTitle className="text-base font-bold text-white group-hover:text-white transition-colors">
                  {product.name}
                </CardTitle>
                <span className="text-[10px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-md font-semibold flex items-center gap-0.5">
                  ▲ {product.votesCount} upvotes
                </span>
              </div>
              <CardDescription className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{product.category}</span>
                <span>•</span>
                <span>Launched {formatDate(product.foundedDate)}</span>
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {product.website && (
              <a 
                href={product.website} 
                target="_blank" 
                rel="noreferrer"
                className="p-1.5 text-zinc-500 hover:text-zinc-300 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-md transition-all"
                title="Visit Website"
              >
                <Globe className="w-3.5 h-3.5" />
              </a>
            )}
            {product.url && (
              <a 
                href={product.url} 
                target="_blank" 
                rel="noreferrer"
                className="p-1.5 text-zinc-500 hover:text-zinc-300 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-md transition-all"
                title="View on Product Hunt"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
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
          {product.description || 'No description provided.'}
        </p>
      </CardHeader>

      <CardContent className="p-5 pt-2 flex-1 flex flex-col justify-end gap-3.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg border border-zinc-900 bg-zinc-900/20 flex flex-col justify-center">
            <span className="text-[10px] text-zinc-500 font-medium">Upvotes</span>
            <span className="text-xs font-bold text-zinc-200 mt-0.5">
              ▲ {product.votesCount}
            </span>
          </div>
          <div className="p-2 rounded-lg border border-zinc-900 bg-zinc-900/20 flex flex-col justify-center">
            <span className="text-[10px] text-zinc-500 font-medium">Platform</span>
            <span className="text-xs font-bold text-zinc-200 mt-0.5">
              Product Hunt
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-zinc-900/80 bg-zinc-950/20 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-zinc-600" />
          <span>Launched: {formatDate(product.foundedDate)}</span>
        </div>

        {product.xHandle ? (
          <a 
            href={`https://twitter.com/${product.xHandle}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
          >
            <TwitterIcon className="w-3.5 h-3.5 text-zinc-600" />
            <span>@{product.xHandle}</span>
          </a>
        ) : (
          <span>No maker social</span>
        )}
      </CardFooter>
    </Card>
  );
}
