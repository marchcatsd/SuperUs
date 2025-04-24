import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../../../components/ProtectedRoute';

interface Workspace {
  _id: string;
  name: string;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  _id: string;
  name: string;
}

const TeamWorkspaces = () => {
  const router = useRouter();
  const { teamId } = router.query;
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch team and workspaces
  useEffect(() => {
    const fetchData = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch team
        const teamResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/team/${teamId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setTeam(teamResponse.data.team);
        
        // Fetch workspaces
        const workspacesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/workspace/team/${teamId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setWorkspaces(workspacesResponse.data.workspaces);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch team workspaces');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [teamId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {team ? `${team.name} Workspaces` : 'Team Workspaces'}
                </h1>
              </div>
              <button
                onClick={() => router.push(`/workspace/create?teamId=${teamId}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                Create Workspace
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : error ? (
              <div className="bg-[#330000] border border-red-800 text-red-400 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="bg-[#121212] border border-[#333333] overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <h3 className="text-lg leading-6 font-medium text-white">No workspaces found</h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Create a workspace to get started.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#121212] border border-[#333333] overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-[#333333]">
                  {workspaces.map((workspace) => (
                    <li key={workspace._id}>
                      <div className="block hover:bg-[#1e1e1e]">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="ml-3">
                                <p className="text-sm font-medium text-white truncate">
                                  {workspace.name}
                                </p>
                                <p className="text-sm text-gray-400 truncate">
                                  {workspace.sourceUrl}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => router.push(`/workspace/${workspace._id}`)}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-xs font-medium rounded text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500"
                              >
                                View
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-400">
                                Created: {formatDate(workspace.createdAt)}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-400 sm:mt-0">
                              <p>
                                Last updated: {formatDate(workspace.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TeamWorkspaces;
