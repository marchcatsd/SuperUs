import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const Home = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>SuperU - Collaborative Content Management</title>
        <meta name="description" content="Collaborative content management system" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav style={{ backgroundColor: '#1e1e1e', borderBottom: '1px solid #333333' }} className="p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">SuperU</div>
          <div className="space-x-4">
            <button 
              onClick={() => router.push('/login')} 
              className="btn btn-outline"
            >
              Login
            </button>
            <button 
              onClick={() => router.push('/signup')} 
              className="btn btn-primary"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              The AI-Powered <span style={{ color: '#ffffff' }}>Content Management</span> for Your Team
            </h1>
            <p className="text-xl mb-8" style={{ color: '#a0a0a0' }}>
              SuperU helps teams scrape, organize, and collaborate on content in real-time.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => router.push('/signup')} 
                className="btn btn-primary"
              >
                Get Started
              </button>
              <button 
                onClick={() => router.push('/login')} 
                className="btn btn-outline"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card">
              <h3 className="text-xl font-bold mb-3">Website Scraping</h3>
              <p style={{ color: '#a0a0a0' }}>Extract and organize content from any website with a single click.</p>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
              <p style={{ color: '#a0a0a0' }}>Work together with your team in real-time on the same content.</p>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold mb-3">Content Editing</h3>
              <p style={{ color: '#a0a0a0' }}>Edit content with a powerful rich text editor and auto-save.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1e1e1e', borderTop: '1px solid #333333', color: '#a0a0a0' }} className="p-6 text-center">
        <p>© 2025 SuperU. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
