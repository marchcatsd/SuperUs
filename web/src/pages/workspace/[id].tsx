import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../../components/ProtectedRoute';
import FileTree from '../../components/FileTree';
import TiptapEditor from '../../components/TiptapEditor';

interface Content {
  _id: string;
  title: string;
  content: any;
  path: string;
  parentPath: string;
  lastEditedBy: string;
  lastEditedAt: string;
}

interface Workspace {
  _id: string;
  name: string;
  sourceUrl: string;
  team: {
    _id: string;
    name: string;
  };
  contents: Content[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const WorkspaceView = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentParent, setNewContentParent] = useState('');

  // Fetch workspace data
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/workspace/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setWorkspace(response.data.workspace);
        
        // Select the first content by default
        if (response.data.workspace.contents.length > 0) {
          setSelectedContent(response.data.workspace.contents[0]);
        }
      } catch (error) {
        console.error('Error fetching workspace:', error);
        setError('Failed to fetch workspace');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkspace();
  }, [id]);

  // Handle content selection
  const handleSelectContent = (contentId: string) => {
    if (!workspace) return;
    
    const content = workspace.contents.find(c => c._id === contentId);
    if (content) {
      setSelectedContent(content);
    }
  };

  // Handle content update
  const handleUpdateContent = async (updatedContent: any) => {
    if (!selectedContent || !workspace) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/${workspace._id}/content/${selectedContent._id}`,
        { content: updatedContent },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      const updatedContents = workspace.contents.map(c => {
        if (c._id === selectedContent._id) {
          return { ...c, content: updatedContent };
        }
        return c;
      });
      
      setWorkspace({ ...workspace, contents: updatedContents });
    } catch (error) {
      console.error('Error updating content:', error);
      // We don't set error state here to avoid disrupting the user experience
    }
  };

  // Handle adding new content
  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspace || !newContentTitle.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/${workspace._id}/content`,
        {
          title: newContentTitle,
          content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] },
          path: `${newContentTitle.toLowerCase().replace(/\s+/g, '-')}`,
          parentPath: newContentParent
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      const newContent = response.data.content;
      const updatedContents = [...workspace.contents, newContent];
      
      setWorkspace({ ...workspace, contents: updatedContents });
      setSelectedContent(newContent);
      setNewContentTitle('');
      setNewContentParent('');
      setShowAddContentModal(false);
    } catch (error) {
      console.error('Error adding content:', error);
      setError('Failed to add content');
    }
  };

  // Generate parent path options
  const getParentPathOptions = () => {
    if (!workspace) return [];
    
    return [
      { value: '', label: 'Root' },
      ...workspace.contents.map(c => ({ value: c.path, label: c.title }))
    ];
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
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : error ? (
              <div className="bg-[#330000] border border-red-800 text-red-400 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            ) : workspace ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{workspace.name}</h1>
                    <p className="text-sm text-gray-400">
                      Source: <a href={workspace.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">{workspace.sourceUrl}</a>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddContentModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    Add Content
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-6">
                  {/* File Tree */}
                  <div className="col-span-1 bg-[#121212] border border-[#333333] overflow-hidden sm:rounded-lg">
                    <div className="p-4 border-b border-[#333333]">
                      <h3 className="text-lg font-medium text-white">Content Structure</h3>
                    </div>
                    <FileTree
                      contents={workspace.contents}
                      onSelectFile={handleSelectContent}
                      selectedFileId={selectedContent?._id || null}
                    />
                  </div>

                  {/* Content Editor */}
                  <div className="col-span-3 bg-[#121212] border border-[#333333] overflow-hidden sm:rounded-lg p-6">
                    {selectedContent ? (
                      <div>
                        <h2 className="text-xl font-bold text-white mb-4">{selectedContent.title}</h2>
                        <TiptapEditor
                          content={selectedContent.content}
                          documentId={selectedContent._id}
                          onUpdate={handleUpdateContent}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-400">Select a file from the tree to edit</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Add Content Modal */}
        {showAddContentModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-black opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-[#121212] border border-[#333333] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-white">
                      Add New Content
                    </h3>
                    <div className="mt-2">
                      <form onSubmit={handleAddContent}>
                        <div className="mb-4">
                          <label htmlFor="title" className="block text-sm font-medium text-gray-300 text-left">
                            Title
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={newContentTitle}
                            onChange={(e) => setNewContentTitle(e.target.value)}
                            className="mt-1 block w-full bg-[#1e1e1e] border border-[#333333] rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            placeholder="Enter content title"
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="parentPath" className="block text-sm font-medium text-gray-300 text-left">
                            Parent
                          </label>
                          <select
                            id="parentPath"
                            name="parentPath"
                            value={newContentParent}
                            onChange={(e) => setNewContentParent(e.target.value)}
                            className="mt-1 block w-full bg-[#1e1e1e] border border-[#333333] rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                          >
                            {getParentPathOptions().map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-gray-600 px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:col-start-2 sm:text-sm"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddContentModal(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default WorkspaceView;
