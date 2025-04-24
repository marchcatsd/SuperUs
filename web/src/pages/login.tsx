import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await login(formData.email, formData.password);
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || error.response?.data?.message || 'Invalid credentials'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Left side - Branding */}
      <div className="w-1/2 p-16 flex flex-col justify-center">
        <h1 className="text-2xl font-bold mb-8">SuperU</h1>
        <h2 className="text-5xl font-bold mb-4">Your AI Content Management Platform</h2>
        <p className="text-lg text-[#a0a0a0]">
          SuperU-powered content management to collaborate, organize, and edit content in real-time.
        </p>
      </div>

      {/* Right side - Login Form */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6">Log in to SuperU</h2>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 border border-[#ff4444] rounded-md text-sm" style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)' }}>
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-2 text-white focus:outline-none focus:border-white"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-2 text-white focus:outline-none focus:border-white"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#1e1e1e] text-white rounded border border-[#333333] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-[#a0a0a0] text-sm">
                Don&apos;t have an account? {' '}
                <Link href="/signup" className="text-[#a855f7] hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
