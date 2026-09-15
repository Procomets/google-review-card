import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setLoading(true);
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/admin');
    } catch (err) {
      setError('Failed to ' + (isLogin ? 'log in' : 'register') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/admin');
    } catch (err) {
      setError('Failed to log in with Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center p-4">
      <div className="bg-[#2a2a2a] rounded-2xl shadow-xl max-w-md w-full border border-[#3a3a3a] p-8">
        <h2 className="text-3xl font-bold text-white text-center mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {isLogin ? 'Sign in to access your dashboard' : 'Sign up to get started'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border-l-4 border-red-500/50 text-red-400 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <span className="h-px w-full bg-[#3a3a3a]"></span>
          <span className="px-4 text-sm text-gray-500">OR</span>
          <span className="h-px w-full bg-[#3a3a3a]"></span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-[#1f1f1f] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a] font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-blue-500 font-semibold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
