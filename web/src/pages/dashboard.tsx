import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

interface Team {
  _id: string;
  name: string;
  owner: {
    _id: string;
    email: string;
  };
  members: Array<{
    user: string;
    email: string;
    status: string;
    role: string;
  }>;
  workspaces: string[];
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');

  // Fetch teams on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          return;
        }
        
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/team`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setTeams(response.data.teams);
      } catch (error) {
        console.error('Error fetching teams:', error);
        setError('Failed to fetch teams');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/team`,
        { name: teamName },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setTeams([...teams, response.data.team]);
      setTeamName('');
      setShowCreateTeamModal(false);
    } catch (error) {
      console.error('Error creating team:', error);
      setError('Failed to create team');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim() || !selectedTeam) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/team/${selectedTeam._id}/invite`,
        { email: inviteEmail, role: inviteRole },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Refresh teams
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/team`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setTeams(response.data.teams);
      setInviteEmail('');
      setInviteRole('editor');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      setError('Failed to invite member');
    }
  };

  const handleCreateWorkspace = (teamId: string) => {
    router.push(`/workspace/create?teamId=${teamId}`);
  };

  const handleViewWorkspace = (teamId: string) => {
    router.push(`/workspace/team/${teamId}`);
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
              </div>
              <div className="flex items-center">
                <span className="text-gray-300 mr-4">{user?.email}</span>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-gray-600 text-sm leading-4 font-medium rounded-md text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="py-10">
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  Create Team
                </button>
              </div>
            </div>
          </header>
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              {error && (
                <div className="bg-[#330000] border border-red-800 text-red-400 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : teams.length === 0 ? (
                <div className="bg-[#121212] border border-[#333333] overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <h3 className="text-lg leading-6 font-medium text-white">No teams found</h3>
                    <p className="mt-2 text-sm text-gray-400">Create a team to get started.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-6">
                  {teams.map((team) => (
                    <div key={team._id} className="bg-[#121212] border border-[#333333] overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                          <h3 className="text-lg leading-6 font-medium text-white">{team.name}</h3>
                          <p className="mt-1 max-w-2xl text-sm text-gray-400">
                            {team.members.length} members
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTeam(team);
                              setShowInviteModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-xs font-medium rounded text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500"
                          >
                            Invite Member
                          </button>
                          <button
                            onClick={() => handleCreateWorkspace(team._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-xs font-medium rounded text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500"
                          >
                            Create Workspace
                          </button>
                          <button
                            onClick={() => handleViewWorkspace(team._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-xs font-medium rounded text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500"
                          >
                            View Workspaces
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-[#333333]">
                        <div className="px-4 py-5 sm:p-6">
                          <h4 className="text-md font-medium text-white">Team Members</h4>
                          <ul className="mt-3 divide-y divide-[#333333]">
                            {/* Owner */}
                            <li className="py-2 flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-white">{team.owner.email}</span>
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#333333] text-gray-300">Owner</span>
                              </div>
                            </li>
                            
                            {/* Members */}
                            {team.members.filter(m => m.user !== team.owner._id).map((member) => (
                              <li key={member.user} className="py-2 flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-white">{member.email}</span>
                                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#333333] text-gray-300">{member.role}</span>
                                  {member.status !== 'active' && (
                                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#222222] text-gray-400">{member.status}</span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Create Team Modal */}
        {showCreateTeamModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-black opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-[#121212] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-[#333333]">
                <div className="bg-[#121212] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                        Create New Team
                      </h3>
                      <div className="mt-2">
                        <form onSubmit={handleCreateTeam}>
                          <div className="mb-4">
                            <label htmlFor="teamName" className="block text-sm font-medium text-gray-300">
                              Team Name
                            </label>
                            <input
                              type="text"
                              id="teamName"
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              className="mt-1 block w-full bg-[#1e1e1e] border border-[#333333] rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                              placeholder="Enter team name"
                              required
                            />
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#1e1e1e] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-[#333333]">
                  <button
                    type="button"
                    onClick={handleCreateTeam}
                    className="w-full inline-flex justify-center rounded-md border border-gray-600 px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateTeamModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite Member Modal */}
      {showInviteModal && selectedTeam && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-[#121212] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-[#333333]">
              <div className="bg-[#121212] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                      Invite Member to {selectedTeam.name}
                    </h3>
                    <div className="mt-2">
                      <form onSubmit={handleInviteMember}>
                        <div className="mb-4">
                          <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-300">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="inviteEmail"
                            id="inviteEmail"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="mt-1 block w-full bg-[#1e1e1e] border border-[#333333] rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            placeholder="Enter email address"
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-300">
                            Role
                          </label>
                          <select
                            id="inviteRole"
                            name="inviteRole"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="mt-1 block w-full bg-[#1e1e1e] border border-[#333333] rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#1e1e1e] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-[#333333]">
                <button
                  type="button"
                  onClick={handleInviteMember}
                  className="w-full inline-flex justify-center rounded-md border border-gray-600 px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Invite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}  
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
