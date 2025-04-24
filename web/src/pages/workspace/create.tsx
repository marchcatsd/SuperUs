import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../../components/ProtectedRoute';

interface Team {
  _id: string;
  name: string;
}

const CreateWorkspace = () => {
  const router = useRouter();
  const { teamId } = router.query;
  
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) return;
      
      try {
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/team/${teamId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setTeam(response.data.team);
      } catch (error) {
        console.error('Error fetching team:', error);
        setError('Failed to fetch team information');
      }
    };
    
    fetchTeam();
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !url.trim() || !teamId) {
      setError('Workspace name, URL, and team are required');
      return;
    }
    
    try {
      setLoading(true);
      setScraping(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workspace`,
        {
          name,
          url,
          teamId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Redirect to the workspace page
      router.push(`/workspace/${response.data.workspace._id}`);
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      setError(error.response?.data?.message || 'Failed to create workspace');
      setScraping(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <nav className="bg-black border-b border-[#333333]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-white">SuperU</h1>
                </div>
                <div className="ml-6 flex space-x-8">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="border-transparent text-gray-400 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="py-10">
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-white">Create Workspace</h1>
              {team && (
                <p className="text-gray-400">Creating workspace for team: <span className="text-white">{team.name}</span></p>
              )}
            </div>
          </header>
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="bg-[#121212] border border-[#333333] overflow-hidden sm:rounded-lg mt-5">
                <div className="px-4 py-5 sm:p-6">
                  {error && (
                    <div className="bg-[#330000] border border-red-800 text-red-400 px-4 py-3 rounded relative mb-4" role="alert">
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}
                  
                  {scraping && (
                    <div className="bg-[#1e1e1e] border border-[#333333] px-4 py-3 rounded relative mb-4" role="alert">
                      <span className="block sm:inline text-gray-300">
                        Scraping website content. This may take a moment...
                      </span>
                      <div className="mt-2 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                          Workspace Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-2 text-white focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          placeholder="Enter workspace name"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
                          Website URL
                        </label>
                        <input
                          type="url"
                          name="url"
                          id="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-2 text-white focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          placeholder="https://docs.mixpanel.com/docs/what-is-mixpanel"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Enter the URL of the website you want to scrape. Example: https://docs.mixpanel.com/docs/what-is-mixpanel
                        </p>
                      </div>
                      
                      <div className="pt-5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 border border-gray-600 rounded text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading || !teamId}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-600 rounded text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50"
                          >
                            {loading ? 'Creating...' : 'Create Workspace'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CreateWorkspace;
