import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../../../components/ProtectedRoute';
import FileTree from '../../../components/FileTree';
import TiptapEditor from '../../../components/TiptapEditor';

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

const SharedEdit = () => {
  const router = useRouter();
  const { pageName, uuid } = router.query;
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);

  // Fetch workspace data
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!uuid) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/workspace/${uuid}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setWorkspace(response.data.workspace);
        
        // Find the content by page name if provided, otherwise select the first content
        if (pageName && pageName !== 'index') {
          const content = response.data.workspace.contents.find(
            (c: Content) => c.path === pageName || c._id === pageName
          );
          
          if (content) {
            setSelectedContent(content);
          } else if (response.data.workspace.contents.length > 0) {
            setSelectedContent(response.data.workspace.contents[0]);
          }
        } else if (response.data.workspace.contents.length > 0) {
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
  }, [uuid, pageName]);

  // Handle content selection
  const handleSelectContent = (contentId: string) => {
    if (!workspace) return;
    
    const content = workspace.contents.find(c => c._id === contentId);
    if (content) {
      setSelectedContent(content);
      // Update URL without reloading the page
      router.push(`/edit/${content.path}/${uuid}`, undefined, { shallow: true });
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-indigo-600">SuperU</h1>
                </div>
                <div className="ml-6 flex space-x-8">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
              {workspace && (
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-4">
                    Editing: {workspace.name}
                  </span>
                  <div className="flex -space-x-2 overflow-hidden">
                    {collaborators.map((collaborator, index) => (
                      <span
                        key={index}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-xs font-medium text-white ring-2 ring-white"
                      >
                        {collaborator.charAt(0).toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            ) : workspace ? (
              <div>
                <div className="grid grid-cols-4 gap-6">
                  {/* File Tree */}
                  <div className="col-span-1 bg-white shadow overflow-hidden sm:rounded-lg">
                    <FileTree
                      contents={workspace.contents}
                      onSelectFile={handleSelectContent}
                      selectedFileId={selectedContent?._id || null}
                    />
                  </div>

                  {/* Content Editor */}
                  <div className="col-span-3 bg-white shadow overflow-hidden sm:rounded-lg p-6">
                    {selectedContent ? (
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedContent.title}</h2>
                        <TiptapEditor
                          content={selectedContent.content}
                          documentId={selectedContent._id}
                          onUpdate={handleUpdateContent}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-500">Select a file from the tree to edit</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SharedEdit;
