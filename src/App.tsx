import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Auth, UserProfile } from './components/Auth';
import { Ingestion } from './components/Ingestion';
import { KnowledgeBase } from './components/KnowledgeBase';
import { DecisionEngine } from './components/DecisionEngine';
import { Brain, Database, Zap, LayoutDashboard, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'dashboard' | 'ingestion' | 'memory' | 'decision';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar / Navigation */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 md:top-0 md:left-0 md:translate-x-0 md:h-screen w-[90%] md:w-24 bg-white/80 backdrop-blur-xl border border-slate-200 md:border-r shadow-2xl md:shadow-none z-50 flex md:flex-col items-center justify-around md:justify-center gap-8 px-4 md:py-8 rounded-3xl md:rounded-none m-0">
        <div className="hidden md:flex p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-8">
          <Brain className="w-8 h-8 text-white" />
        </div>
        
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Home" />
        <NavButton active={activeTab === 'ingestion'} onClick={() => setActiveTab('ingestion')} icon={<Database />} label="Ingest" />
        <NavButton active={activeTab === 'memory'} onClick={() => setActiveTab('memory')} icon={<Brain />} label="Memory" />
        <NavButton active={activeTab === 'decision'} onClick={() => setActiveTab('decision')} icon={<Zap />} label="Decide" />
      </nav>

      {/* Main Content */}
      <main className="md:pl-24 pb-24 md:pb-0">
        <header className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 capitalize">{activeTab}</h1>
            <p className="text-xs text-slate-500 font-medium">Cognitive Intelligence System</p>
          </div>
          <UserProfile />
        </header>

        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
              {activeTab === 'ingestion' && <Ingestion />}
              {activeTab === 'memory' && <KnowledgeBase />}
              {activeTab === 'decision' && <DecisionEngine />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative p-4 rounded-2xl transition-all duration-300 ${
        active 
        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110' 
        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
      }`}
    >
      {icon}
      <span className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
        {label}
      </span>
    </button>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <div className="space-y-12">
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-widest uppercase"
          >
            <Sparkles className="w-4 h-4" />
            Active Intelligence
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight">
            Convert Information into <span className="text-indigo-400">High-Leverage Decisions.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
            Your cognitive system extracts principles and frameworks from your sources, creating a closed-loop memory that improves your strategic thinking.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => onNavigate('ingestion')}
              className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-lg"
            >
              Start Ingesting
            </button>
            <button 
              onClick={() => onNavigate('decision')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
            >
              Open Decision Engine
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/20 to-transparent pointer-events-none" />
        <Brain className="absolute -right-20 -bottom-20 w-96 h-96 text-white/5 rotate-12" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <StatCard icon={<Database className="text-indigo-600" />} title="Ingestion" description="Parse books, courses, and notes into semantic chunks." />
        <StatCard icon={<Brain className="text-amber-600" />} title="Extraction" description="AI-driven identification of principles and frameworks." />
        <StatCard icon={<Zap className="text-emerald-600" />} title="Synthesis" description="Controlled RAG for strategic decision making." />
      </div>
    </div>
  );
}

function StatCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
