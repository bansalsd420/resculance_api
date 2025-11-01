import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Form';
import { toast } from 'react-toastify';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: 'linear-gradient(135deg, #e0f2ff 0%, #f0f9ff 50%, #fef3f2 100%)' }}>
      {/* Left Side - Illustration & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-400 rounded-full opacity-40 animate-float"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 bg-green-400 rounded-full opacity-40 animate-float-delayed"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-orange-300 rounded-full opacity-30 animate-float"></div>
        <div className="absolute bottom-10 right-40 w-16 h-16 bg-pink-400 rounded-full opacity-40 animate-float-delayed"></div>
        <div className="absolute top-20 right-10 w-10 h-10 bg-blue-300 rounded-full opacity-50 animate-float"></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-16 text-white">
          {/* Illustration Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-12 shadow-2xl border border-white/20 max-w-md transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white rounded-2xl p-8 mb-4 shadow-lg">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 text-gray-800 mb-2">
                  <span className="text-2xl">🚑</span>
                  <span className="font-bold text-xl">RESCULANCE</span>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">660 <span className="text-sm font-normal text-gray-500">kcal</span></p>
                    <p className="text-xs text-gray-500">Daily Target</p>
                  </div>
                  <div className="text-4xl">💊</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <span className="text-3xl">🥗</span>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-gray-800">Patient Care</p>
                      <p className="text-xs text-gray-500">Real-time monitoring</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <span className="text-3xl">📊</span>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-gray-800">Analytics Dashboard</p>
                      <p className="text-xs text-gray-500">Track performance</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-700">Emergency response active</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="inline-block mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                  <svg className="w-8 h-8 text-white transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tagline */}
          <div className="text-center max-w-md">
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Transform Emergency<br/>Medical Care
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">
              A modern platform connecting ambulances, hospitals, and healthcare providers for seamless emergency response.
            </p>
            
            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-8 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white/80 backdrop-blur-sm">
        <div className="w-full max-w-md">
          {/* Logo & Greeting */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Hello Again!</h1>
            <p className="text-gray-500">Welcome back to RESCULANCE Emergency Portal</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-scale-in">
            {/* Email Input */}
            <div className="form-group">
              <label className="label">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input pl-12"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pl-12"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-600">Remember Me</span>
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Recovery Password
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 spinner !border-white !border-t-gray-300"></div>
                  Signing in...
                </span>
              ) : (
                'Login'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            {/* Demo Credentials */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-2">Demo Credentials</p>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white/80 rounded-lg px-3 py-2">
                      <p className="text-gray-600 font-medium mb-1">📧 superadmin@resculance.com</p>
                      <p className="text-gray-600 font-medium">🔒 Admin@123</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-gray-600 mt-8">
              Don't have an account yet?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign Up
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
