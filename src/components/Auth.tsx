import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { LogIn, LogOut, Brain } from 'lucide-react';
import { motion } from 'motion/react';

export function Auth() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100"
      >
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <Brain className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Cognitive System</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          A closed-loop system to convert information into principles, frameworks, and insights.
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </button>
      </motion.div>
    </div>
  );
}

export function UserProfile() {
  const user = auth.currentUser;
  if (!user) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
      <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-slate-100" referrerPolicy="no-referrer" />
      <span className="text-sm font-medium text-slate-700 hidden sm:inline">{user.displayName}</span>
      <button onClick={() => signOut(auth)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
