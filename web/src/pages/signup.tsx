import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

const Signup = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        email: formData.email,
        password: formData.password
      });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.response?.data?.message || 'An error occurred during signup');
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

      {/* Right side - Signup Form */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6">Create your account</h2>
          
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
                  style={{
                    width: '100%',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    color: 'white',
                  }}
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
                  autoComplete="new-password"
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    color: 'white',
                  }}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    color: 'white',
                  }}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#1e1e1e',
                  color: 'white',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '8px 0',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e1e1e'}
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-[#a0a0a0] text-sm">
                Already have an account? {' '}
                <Link href="/login" className="text-[#a855f7] hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
