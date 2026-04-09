import { useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { KnowledgeUnit } from '../types';
import { MessageSquare, Zap, Loader2, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { synthesizeDecision } from '../services/geminiService';
import Markdown from 'react-markdown';

export function DecisionEngine() {
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSynthesize = async () => {
    if (!queryText.trim() || !auth.currentUser) return;
    setLoading(true);
    setResult(null);
    
    try {
      // 1. Retrieve relevant knowledge (Simple keyword search for now)
      // In a real app, we'd use vector embeddings + cosine similarity
      const q = query(
        collection(db, 'knowledge'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const allKnowledge = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeUnit));
      
      // Simple heuristic: filter units that have common words with the query
      const queryWords = queryText.toLowerCase().split(/\s+/);
      const relevantKnowledge = allKnowledge.filter(unit => {
        const content = (unit.title + ' ' + unit.content + ' ' + unit.tags.join(' ')).toLowerCase();
        return queryWords.some(word => word.length > 3 && content.includes(word));
      }).slice(0, 10); // Limit to top 10 for context window

      // 2. Synthesize using Gemini
      const synthesis = await synthesizeDecision(queryText, relevantKnowledge);
      setResult(synthesis);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'knowledge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Decision Engine</h2>
        <p className="text-slate-500">Map your current situation to your stored principles and frameworks.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your Situation</label>
            <textarea 
              placeholder="Describe the problem or decision you're facing... (e.g., 'I need to scale my engineering team while maintaining quality. What principles should I apply?')"
              className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-slate-700 leading-relaxed text-lg"
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
            />
          </div>

          <button
            onClick={handleSynthesize}
            disabled={loading || !queryText.trim()}
            className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Synthesizing Strategy...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                Generate High-Leverage Decision
              </>
            )}
          </button>
        </div>

        {result && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-slate-100 bg-slate-50/50 p-8 md:p-10"
          >
            <div className="flex items-center gap-2 mb-6 text-indigo-600">
              <MessageSquare className="w-5 h-5" />
              <span className="font-bold uppercase tracking-widest text-xs">Strategic Output</span>
            </div>
            
            <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
              <Markdown>{result}</Markdown>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-2xl border border-amber-100">
        <Info className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900 text-sm">How this works</h4>
          <p className="text-amber-800/80 text-sm leading-relaxed">
            The Decision Engine performs a hybrid search across your **Structured Memory**. It retrieves the most relevant principles, frameworks, and insights, then uses Gemini to synthesize a controlled response. It is strictly forbidden from using external knowledge, ensuring the advice is grounded in your own curated intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}
