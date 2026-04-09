import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { Source, Chunk } from '../types';
import { Plus, FileText, Link as LinkIcon, Book, Video, Send, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractKnowledge } from '../services/geminiService';

export function Ingestion() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  
  const [newSource, setNewSource] = useState({ title: '', type: 'article' as Source['type'], author: '', url: '' });
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [chunkContent, setChunkContent] = useState('');
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'sources'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Source)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sources'));

    return unsubscribe;
  }, []);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'sources'), {
        ...newSource,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setNewSource({ title: '', type: 'article', author: '', url: '' });
      setShowAddSource(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sources');
    } finally {
      setLoading(false);
    }
  };

  const handleIngestChunk = async () => {
    if (!selectedSourceId || !chunkContent.trim() || !auth.currentUser) return;
    setIngesting(true);
    try {
      // 1. Store the raw chunk
      const chunkRef = await addDoc(collection(db, 'chunks'), {
        sourceId: selectedSourceId,
        content: chunkContent,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      // 2. Extract knowledge using Gemini
      const extracted = await extractKnowledge(chunkContent);

      // 3. Store extracted knowledge units
      for (const unit of extracted) {
        await addDoc(collection(db, 'knowledge'), {
          ...unit,
          sourceId: selectedSourceId,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      }

      setChunkContent('');
      alert(`Ingested chunk and extracted ${extracted.length} knowledge units.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chunks');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Sources List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Sources</h2>
          <button 
            onClick={() => setShowAddSource(!showAddSource)}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {showAddSource && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddSource}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 overflow-hidden"
            >
              <input 
                placeholder="Title"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={newSource.title}
                onChange={e => setNewSource({...newSource, title: e.target.value})}
                required
              />
              <select 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={newSource.type}
                onChange={e => setNewSource({...newSource, type: e.target.value as any})}
              >
                <option value="book">Book</option>
                <option value="course">Course</option>
                <option value="article">Article</option>
                <option value="note">Note</option>
              </select>
              <input 
                placeholder="Author (optional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={newSource.author}
                onChange={e => setNewSource({...newSource, author: e.target.value})}
              />
              <input 
                placeholder="URL (optional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={newSource.url}
                onChange={e => setNewSource({...newSource, url: e.target.value})}
              />
              <button 
                disabled={loading}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Source'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {sources.map(source => (
            <button
              key={source.id}
              onClick={() => setSelectedSourceId(source.id!)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedSourceId === source.id 
                ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${selectedSourceId === source.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  {source.type === 'book' && <Book className="w-4 h-4" />}
                  {source.type === 'course' && <Video className="w-4 h-4" />}
                  {source.type === 'article' && <LinkIcon className="w-4 h-4" />}
                  {source.type === 'note' && <FileText className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{source.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{source.author || 'Unknown Author'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ingestion Area */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Ingestion Pipeline</h2>
          </div>
          
          {!selectedSourceId ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
              <p className="text-slate-400">Select a source to start ingesting knowledge chunks.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Source</span>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {sources.find(s => s.id === selectedSourceId)?.title}
                </span>
              </div>
              
              <textarea 
                placeholder="Paste a text chunk here (e.g., a chapter summary, a lecture transcript, or a key note)..."
                className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-slate-700 leading-relaxed"
                value={chunkContent}
                onChange={e => setChunkContent(e.target.value)}
              />
              
              <div className="flex justify-end">
                <button
                  onClick={handleIngestChunk}
                  disabled={ingesting || !chunkContent.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
                >
                  {ingesting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Extracting Knowledge...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Ingest & Extract
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">How it works</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              When you ingest a chunk, our **Extraction Agent** parses the text to identify fundamental principles, structured frameworks, and specific insights. These are then stored in your cognitive database for future retrieval and decision synthesis.
            </p>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
