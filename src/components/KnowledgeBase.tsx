import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { KnowledgeUnit } from '../types';
import { Search, Filter, Brain, Layers, Lightbulb, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function KnowledgeBase() {
  const [units, setUnits] = useState<KnowledgeUnit[]>([]);
  const [filter, setFilter] = useState<'all' | 'principle' | 'framework' | 'insight'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'knowledge'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeUnit)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'knowledge'));

    return unsubscribe;
  }, []);

  const filteredUnits = units.filter(unit => {
    const matchesFilter = filter === 'all' || unit.type === filter;
    const matchesSearch = unit.title.toLowerCase().includes(search.toLowerCase()) || 
                         unit.content.toLowerCase().includes(search.toLowerCase()) ||
                         unit.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Structured Memory</h2>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {(['all', 'principle', 'framework', 'insight'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}s
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          placeholder="Search principles, frameworks, insights, or tags..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredUnits.map(unit => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={unit.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${
                  unit.type === 'principle' ? 'bg-amber-50 text-amber-600' :
                  unit.type === 'framework' ? 'bg-indigo-50 text-indigo-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {unit.type === 'principle' && <Brain className="w-5 h-5" />}
                  {unit.type === 'framework' && <Layers className="w-5 h-5" />}
                  {unit.type === 'insight' && <Lightbulb className="w-5 h-5" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">
                  {unit.type}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{unit.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow line-clamp-4">
                {unit.content}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-50">
                {unit.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredUnits.length === 0 && (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No knowledge units found</h3>
          <p className="text-slate-500">Try adjusting your search or filters, or ingest more content.</p>
        </div>
      )}
    </div>
  );
}
