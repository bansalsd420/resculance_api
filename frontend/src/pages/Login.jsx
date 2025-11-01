import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Form';
import { toast } from 'react-toastify';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-subtle"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl mb-6 text-center animate-scale-in">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-4 shadow-2xl transform hover:scale-110 transition-transform duration-200">
              <span className="text-4xl">🚑</span>
            </div>
            <h1 className="text-5xl font-bold mb-2 text-white tracking-tight">RESCULANCE</h1>
            <p className="text-gray-300 font-semibold text-lg">Emergency Response Management</p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Sign In</h2>
            <p className="text-gray-300 text-sm mt-1">Enter your credentials to access your account</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-group">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full btn-lg mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 spinner !border-white !border-t-gray-300"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span>→</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Demo Credentials Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-3xl shadow-2xl mt-6 animate-scale-in border-2 border-blue-400" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/30">
              <span className="text-2xl">🔑</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-white mb-3 text-lg">Demo Credentials</p>
              <div className="space-y-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 ring-1 ring-white/30">
                  <p className="text-blue-100 text-xs font-semibold mb-2 uppercase tracking-wider">Superadmin Account</p>
                  <p className="text-white font-mono text-sm mb-1">📧 superadmin@resculance.com</p>
                  <p className="text-white font-mono text-sm">🔒 Admin@123</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          © 2025 RESCULANCE. All rights reserved.
        </p>
      </div>
    </div>
  );
};
