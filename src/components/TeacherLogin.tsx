import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { translations } from '../translations';

export function TeacherLogin({ lang, onLoginSuccess }: { lang: 'vi' | 'en', onLoginSuccess: (user: any, token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isLogin ? '/api/v1/teacher/login' : '/api/v1/teacher/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      if (data.token) {
        onLoginSuccess({ uid: data.uid, email: email.toLowerCase() }, data.token);
      } else {
        throw new Error('No authentication token received');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 backdrop-blur-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white text-center">
            {lang === 'vi' ? 'Đăng nhập Giáo viên' : 'Teacher Login'}
          </h2>
          <p className="text-sm text-slate-400 mt-2 text-center">
            {lang === 'vi' ? 'Vui lòng đăng nhập để truy cập khoang lái' : 'Please sign in to access the cockpit'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={lang === 'vi' ? 'Mật khẩu' : 'Password'}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-4 py-3 font-medium transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? (lang === 'vi' ? 'Đăng nhập' : 'Sign In') : (lang === 'vi' ? 'Đăng ký' : 'Sign Up'))}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {isLogin 
              ? (lang === 'vi' ? 'Chưa có tài khoản? Đăng ký' : 'Need an account? Sign up')
              : (lang === 'vi' ? 'Đã có tài khoản? Đăng nhập' : 'Already have an account? Sign in')}
          </button>
        </div>
      </div>
    </div>
  );
}
