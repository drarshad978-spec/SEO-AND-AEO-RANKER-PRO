import { useState, useCallback, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Zap, 
  HelpCircle, 
  Globe, 
  Settings2, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  Menu,
  X,
  Type,
  TrendingUp,
  Target,
  LogOut,
  User as UserIcon,
  Sparkles,
  Download,
  Share2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateSEOContent, type SEOAction } from './services/geminiService';
import { useAuth } from './hooks/useAuth';
import { auth, googleProvider, signInWithPopup, signOut, db } from './lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  limit,
  doc, 
  setDoc, 
  serverTimestamp,
  getDoc,
  addDoc
} from 'firebase/firestore';

import { OnboardingTour } from './components/OnboardingTour';
import html2pdf from 'html2pdf.js';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create/Update user profile in Firestore
      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastActive: serverTimestamp(),
          createdAt: serverTimestamp() // setDoc with merge allows this or use exists check
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      }
      
    } catch (err: any) {
      console.error(err);
      setError("Failed to sign in with Google. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center"
      >
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/10 border border-slate-800">
          <Sparkles className="text-blue-400" fill="currentColor" size={32} />
        </div>
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">SEO & AEO RANKER</h1>
        <p className="text-slate-500 mb-8">The Professional AI engine for elite search visibility.</p>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin text-slate-400" size={20} />
          ) : (
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          )}
          <span>Sign in with Google</span>
        </button>
        
        <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
          <div className="text-left">
            <div className="text-brand-primary mb-1"><Sparkles size={18} /></div>
            <div className="text-xs font-bold text-slate-900">AI Optimization</div>
            <div className="text-[10px] text-slate-400">Google Quality-Ready</div>
          </div>
          <div className="text-left">
            <div className="text-brand-primary mb-1"><Target size={18} /></div>
            <div className="text-xs font-bold text-slate-900">Competitor Intel</div>
            <div className="text-[10px] text-slate-400">Outrank them with RAG</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left",
      active 
        ? "bg-brand-primary text-white shadow-lg shadow-blue-500/20" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} className="shrink-0" />
    <span className="font-medium text-sm truncate">{label}</span>
  </button>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-8">
    <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{title}</h1>
    <p className="text-slate-500 max-w-2xl">{description}</p>
  </div>
);

// --- Main App Logic ---

const SEOGauge = ({ score }: { score: number }) => {
  const color = score > 80 ? 'text-green-500' : score > 50 ? 'text-amber-500' : 'text-red-500';
  const percentage = Math.min(100, Math.max(0, score));
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            className="text-slate-100 stroke-current"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={`${color} stroke-current transition-all duration-1000 ease-out`}
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-display font-bold text-slate-900">{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">SEO Score</span>
    </div>
  );
};

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<SEOAction>('GENERATE_FULL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [brandVoice, setBrandVoice] = useState({ voice: '', audience: '' });
  const [isPublicView, setIsPublicView] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('share');
    if (shared) {
      setLoading(true);
      setIsPublicView(true);
      const sharePath = `shares/${shared}`;
      getDoc(doc(db, 'shares', shared)).then(snap => {
        if (snap.exists()) {
          setResult(snap.data().result);
        } else {
          setError("This shared report link has expired or never existed.");
        }
      }).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.GET, sharePath);
        } catch (e: any) {
          setError("Error loading shared content.");
        }
      })
        .finally(() => setLoading(false));
    }
  }, []);

  const handleShare = async () => {
    if (!result || !user) return;
    setLoading(true);
    try {
      const shareData = {
        userId: user.uid,
        result: result,
        createdAt: serverTimestamp(),
        action: activeTab
      };
      const newShareId = `share_${Date.now()}`;
      const sharePath = `shares/${newShareId}`;
      try {
        await setDoc(doc(db, 'shares', newShareId), shareData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, sharePath);
      }
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${newShareId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert("Public share link copied to clipboard!");
    } catch (err) {
      console.error(err);
      setError("Failed to create share link.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('printable-content');
    if (!element) return;
    
    // Temporarily hide buttons for the PDF generation
    const opt = {
      margin: 1,
      filename: `ranker-seo-report-${Date.now()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  // Form states
  const [keyword, setKeyword] = useState('');
  const [context, setContext] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');
  const [domainOrTopic, setDomainOrTopic] = useState('');
  const [stats, setStats] = useState({ position: '', ctr: '', impressions: '' });

  useEffect(() => {
    if (user) {
      // Load Brand Voice
      const userPath = `users/${user.uid}`;
      getDoc(doc(db, 'users', user.uid)).then(snap => {
        if (snap.exists() && snap.data().brandVoice) {
          setBrandVoice(snap.data().brandVoice);
        }
      }).catch(err => {
        try {
          handleFirestoreError(err, OperationType.GET, userPath);
        } catch (e) {
          // Silent catch for initial profile load
        }
      });
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'seoLogs'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q).catch(err => {
        handleFirestoreError(err, OperationType.LIST, 'seoLogs');
        return { docs: [] } as any;
      });
      setHistory(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      console.error(err);
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const handleSaveBrandVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const userPath = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        brandVoice
      }, { merge: true });
      alert("Brand settings saved! They will be applied to future generations.");
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      } catch (e: any) {
        setError("Failed to save settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Append Brand Voice to keyword or topic
    const enhancedKeyword = brandVoice.voice 
      ? `${keyword} (Tone: ${brandVoice.voice}, Audience: ${brandVoice.audience})`
      : keyword;

    try {
      const params = {
        keyword: enhancedKeyword,
        context,
        content,
        topic: brandVoice.voice ? `${topic} (Tone: ${brandVoice.voice})` : topic,
        url,
        domain_or_topic: domainOrTopic,
        position: stats.position,
        ctr: stats.ctr,
        impressions: stats.impressions
      };
      const data = await generateSEOContent(activeTab as any, params);
      setResult(data);

      if (user) {
        const logId = `log_${Date.now()}`;
        const logPath = `seoLogs/${logId}`;
        try {
          await setDoc(doc(db, 'seoLogs', logId), {
            userId: user.uid,
            action: activeTab,
            input: params,
            result: data,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, logPath);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const parseScore = (text: string) => {
    const match = text.match(/SEO SCORE.*?(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  };

  const tabs = [
    { id: 'GENERATE_FULL' as SEOAction, label: 'Article Architect', icon: FileText, desc: 'Generate complete, SEO-optimized articles that outrank competitors.' },
    { id: 'SITE_AUDIT' as SEOAction, label: 'Website Audit', icon: Globe, desc: 'Analyze any URL for SEO performance, E-E-A-T, and technical gaps.' },
    { id: 'COMPETITOR_RESEARCH' as SEOAction, label: 'Competitor Intel', icon: LayoutDashboard, desc: 'Find top search competitors and steal their strategies.' },
    { id: 'AUTO_IMPROVE' as SEOAction, label: 'Content Optimizer', icon: TrendingUp, desc: 'Improve content structure, SEO, and add FAQs based on search data.' },
    { id: 'FAQ' as SEOAction, label: 'FAQ Generator', icon: HelpCircle, desc: 'Generate AEO-friendly FAQs designed for featured snippets.' },
    { id: 'META' as SEOAction, label: 'Meta Tags Creator', icon: Type, desc: 'Write CTR-focused SEO titles and meta descriptions.' },
    { id: 'HISTORY' as SEOAction, label: 'Saved Generations', icon: LayoutDashboard, desc: 'Review your past content generations and analysis reports.' },
    { id: 'SETTINGS' as SEOAction, label: 'Brand Voice', icon: Settings2, desc: 'Define your global brand tone and target audience context.' },
  ];

  if (authLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-primary" size={32} />
    </div>
  );

  if (isPublicView) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-slate-800">
                <Sparkles className="text-blue-400" fill="currentColor" size={24} />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-slate-900">SEO & AEO RANKER</span>
            </div>
            <a href="/" className="text-sm font-bold text-brand-primary hover:underline flex items-center gap-1">
              Create My Own Report <ExternalLink size={14} />
            </a>
          </div>

          {loading ? (
             <div className="flex justify-center p-20"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : result ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card flex flex-col min-h-[600px] border-none shadow-xl bg-white overflow-hidden">
               <div className="p-8 markdown-body">
                 <ReactMarkdown>{result}</ReactMarkdown>
               </div>
            </motion.div>
          ) : (
            <div className="text-center p-20 bg-white rounded-2xl border border-slate-200">
               <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
               <h2 className="text-xl font-bold text-slate-900 mb-2">Report Not Found</h2>
               <p className="text-slate-500">{error || "This shared report does not exist."}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <OnboardingTour />
      
      {/* Sidebar */}
      <aside className={cn("bg-white border-r border-slate-200 transition-all duration-300 hidden lg:block", isSidebarOpen ? "w-64" : "w-20")}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-3 px-2 mb-10 overflow-hidden shrink-0">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-slate-800">
              <Sparkles className="text-blue-400" fill="currentColor" size={20} />
            </div>
            {isSidebarOpen && <span className="font-display font-bold text-xl tracking-tight text-slate-900 whitespace-nowrap">RANKER PRO</span>}
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
            {tabs.map((tab) => (
              <SidebarItem
                key={tab.id}
                icon={tab.icon}
                label={isSidebarOpen ? tab.label : ''}
                active={activeTab === tab.id}
                onClick={() => { setActiveTab(tab.id); setResult(null); setError(null); }}
              />
            ))}
          </nav>

          <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-2 shrink-0">
            <SidebarItem icon={LogOut} label={isSidebarOpen ? "Sign Out" : ""} active={false} onClick={() => signOut(auth)} />
            <SidebarItem icon={isSidebarOpen ? X : Menu} label={isSidebarOpen ? "Collapse" : ""} active={false} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-6 lg:p-10 max-w-6xl mx-auto w-full">
          <SectionHeader 
            title={tabs.find(t => t.id === activeTab)?.label || ''} 
            description={tabs.find(t => t.id === activeTab)?.desc || ''} 
          />

          {activeTab === 'HISTORY' ? (
            <div className="space-y-4">
              {loading && <div className="flex justify-center p-20"><Loader2 className="animate-spin text-slate-400" /></div>}
              {!loading && history.length === 0 && <p className="text-center py-20 text-slate-400">No generation history yet.</p>}
              {history.map(item => (
                <div key={item.id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase">{item.action}</span>
                      <span className="text-xs text-slate-400">{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 truncate">
                      {item.input?.keyword || item.input?.topic || item.input?.url || 'Untitled Generation'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => { setResult(item.result); setActiveTab('GENERATE_FULL'); }}
                    className="shrink-0 text-brand-primary font-bold text-sm hover:underline"
                  >
                    View Report
                  </button>
                </div>
              ))}
            </div>
          ) : activeTab === 'SETTINGS' ? (
            <div className="max-w-xl">
              <form onSubmit={handleSaveBrandVoice} className="glass-card p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Global Brand Tone</label>
                  <input 
                    type="text"
                    value={brandVoice.voice}
                    onChange={(e) => setBrandVoice({...brandVoice, voice: e.target.value})}
                    placeholder="e.g. Professional, authoritative yet approachable"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-2">This tone will be applied to all your generated content automatically.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
                  <input 
                    type="text"
                    value={brandVoice.audience}
                    onChange={(e) => setBrandVoice({...brandVoice, audience: e.target.value})}
                    placeholder="e.g. Tech-savvy entrepreneurs, beginners in SEO"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "Save Brand Settings"}
                </button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Reuse previous Form Inputs logic based on activeTab */}
              <div className="space-y-6">
                {activeTab === 'SITE_AUDIT' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Website URL</label>
                    <input 
                      type="url" 
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-2">🔍 AI will use live search data to audit this URL's performance.</p>
                  </div>
                )}

                {activeTab === 'COMPETITOR_RESEARCH' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Domain or Niche</label>
                    <input 
                      type="text" 
                      required
                      value={domainOrTopic}
                      onChange={(e) => setDomainOrTopic(e.target.value)}
                      placeholder="e.g. nike.com or 'Eco-friendly shoes'"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-2">📊 AI will identify and compare top competitors in real-time.</p>
                  </div>
                )}

                {(activeTab === 'GENERATE_FULL' || activeTab === 'GAP_ANALYSIS') && (
                  <div className="space-y-4">
                    {activeTab === 'GENERATE_FULL' && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Keyword</label>
                        <input 
                          type="text" 
                          required
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          placeholder="e.g. best ergonomic chairs 2024"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Competitor Context (RAG)</label>
                      <textarea 
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Paste competitor content snippets or URLs here for analysis..."
                        className="w-full h-40 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                      />
                      <p className="text-xs text-slate-400 mt-2">💡 Providing context helps the AI find gaps and unique insights.</p>
                    </div>
                  </div>
                )}

                {(activeTab === 'FAQ' || activeTab === 'META') && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Focus Topic</label>
                    <input 
                      type="text" 
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Remote Work Productivity"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      {activeTab === 'FAQ' 
                        ? "AI will generate a list of high-intent FAQ questions and answers." 
                        : "AI will produce 5 sets of optimized meta titles and descriptions."}
                    </p>
                  </div>
                )}

                {(activeTab === 'AUTO_IMPROVE') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Existing Content</label>
                      <textarea 
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste the content you want to optimize or improve..."
                        className="w-full h-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Position</label>
                        <input 
                          type="text" 
                          value={stats.position}
                          onChange={(e) => setStats({...stats, position: e.target.value})}
                          placeholder="e.g. 15"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">CTR</label>
                        <input 
                          type="text" 
                          value={stats.ctr}
                          onChange={(e) => setStats({...stats, ctr: e.target.value})}
                          placeholder="e.g. 1.2%"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Impressions</label>
                        <input 
                          type="text" 
                          value={stats.impressions}
                          onChange={(e) => setStats({...stats, impressions: e.target.value})}
                          placeholder="e.g. 5k"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
                 <button onClick={handleGenerate} disabled={loading} className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                   {loading ? <Loader2 className="animate-spin" /> : <><Zap size={18} /> Execute Intelligence Engine</>}
                 </button>
              </div>

              {/* Enhanced Result Area */}
              <div className="relative">
                {result && (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                       <SEOGauge score={parseScore(result)} />
                       <div className="flex-1 glass-card p-4">
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Pre-Publish Checklist</div>
                         <div className="space-y-2">
                           {[
                             "H1 Title optimized for CTR",
                             "H2/H3 Structure for readability",
                             "AEO FAQ section included",
                             "Keyword density (1-2%) verified"
                           ].map((item, i) => (
                             <label key={i} className="flex items-center gap-2 group cursor-pointer">
                               <input type="checkbox" className="w-3 h-3 rounded border-slate-300 text-brand-primary focus:ring-0" />
                               <span className="text-[11px] text-slate-500 group-hover:text-slate-900 transition-colors">{item}</span>
                             </label>
                           ))}
                         </div>
                       </div>
                    </div>
                    
                    <motion.div id="printable-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card flex flex-col min-h-[600px] border-none shadow-xl">
                       <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/50 sticky top-0 z-20 backdrop-blur-sm">
                         <span className="text-xs font-bold text-slate-400 uppercase">Production-Ready Output</span>
                         <div className="flex gap-2">
                           <button 
                             onClick={copyToClipboard} 
                             className="text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-1.5 shadow-sm"
                             title="Copy plain markdown"
                           >
                             <Copy size={14} /> MD
                           </button>
                           <button 
                             onClick={() => {
                               const el = document.querySelector('.markdown-body');
                               if (!el) return;
                               const range = document.createRange();
                               range.selectNode(el);
                               window.getSelection()?.removeAllRanges();
                               window.getSelection()?.addRange(range);
                               document.execCommand('copy');
                               window.getSelection()?.removeAllRanges();
                               setCopied(true);
                               setTimeout(() => setCopied(false), 2000);
                             }}
                             className="text-[11px] font-bold bg-blue-50 text-brand-primary px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1.5 shadow-sm"
                             title="Copy with formatting for Google Docs"
                           >
                             <FileText size={14} /> Google Docs
                           </button>
                           <button 
                             onClick={handleExportPDF}
                             className="text-[11px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-xl shadow-slate-900/10 active:scale-95"
                             title="Download professionally formatted PDF"
                           >
                             <Download size={14} /> Download PDF
                           </button>
                           <button 
                             onClick={handleShare}
                             className="text-[11px] font-bold bg-brand-primary text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-all flex items-center gap-1.5 shadow-sm"
                           >
                             <Share2 size={14} /> Share
                           </button>
                         </div>
                       </div>
                       <div className="p-8 markdown-body overflow-y-auto max-h-[700px]">
                         <ReactMarkdown>{result}</ReactMarkdown>
                       </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

