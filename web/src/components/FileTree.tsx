import React, { useState } from 'react';

interface FileNode {
  _id: string;
  title: string;
  path: string;
  parentPath: string;
  type?: 'section' | 'document';
  children?: FileNode[];
  url?: string;
}

interface FileTreeProps {
  contents: FileNode[];
  onSelectFile: (fileId: string) => void;
  selectedFileId: string | null;
}

const FileTree: React.FC<FileTreeProps> = ({ contents, onSelectFile, selectedFileId }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '': true // Root folder is expanded by default
  });

  // Build tree structure
  const buildTree = () => {
    const rootNodes: FileNode[] = [];
    const childrenMap: Record<string, FileNode[]> = {};
    const processedNames = new Set<string>();

    // Group nodes by parent path and filter duplicates
    contents.forEach(node => {
      const parentPath = node.parentPath || '';
      
      // Extract URL path parts for display
      const urlPath = node.url ? new URL(node.url).pathname : '';
      const pathParts = urlPath.split('/').filter(Boolean);
      
      // Use the last segment of the URL path as the display name
      let displayName = 'Untitled';
      if (pathParts.length > 0) {
        displayName = pathParts[pathParts.length - 1];
        // Convert kebab-case to Title Case
        displayName = displayName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else if (node.title) {
        displayName = node.title;
      }
      
      // Skip duplicates based on display name and parent path
      const nameKey = `${parentPath}:${displayName}`;
      if (processedNames.has(nameKey)) {
        return;
      }
      
      processedNames.add(nameKey);
      
      if (!childrenMap[parentPath]) {
        childrenMap[parentPath] = [];
      }
      
      // Add display name to the node for rendering
      const nodeWithDisplayName = {
        ...node,
        displayName
      };
      
      childrenMap[parentPath].push(nodeWithDisplayName);
    });

    // Get root nodes (nodes with empty parent path)
    rootNodes.push(...(childrenMap[''] || []));

    // Recursive function to render tree
    const renderTree = (nodes: (FileNode & { displayName?: string })[], level = 0) => {
      return (
        <ul className={`list-none space-y-1 ${level > 0 ? 'ml-5' : ''}`}>
          {nodes.map(node => {
            const hasChildren = childrenMap[node.path]?.length > 0;
            const isExpanded = expandedFolders[node.path] || false;
            const isSection = node.type === 'section' || hasChildren;
            
            return (
              <li key={node._id} className="relative">
                <div 
                  className={`flex items-center justify-between cursor-pointer rounded px-2 py-2 hover:bg-gray-800 transition-colors ${selectedFileId === node._id ? 'bg-[#1e1e1e]' : ''}`}
                  onClick={() => {
                    if (isSection) {
                      // Toggle expansion for sections
                      setExpandedFolders(prev => ({
                        ...prev,
                        [node.path]: !prev[node.path]
                      }));
                    }
                    onSelectFile(node._id);
                  }}
                >
                  <span 
                    className={`truncate ${selectedFileId === node._id ? 'font-medium text-blue-400' : isSection ? 'text-gray-200 font-medium' : 'text-gray-300'}`}
                    style={{ fontSize: '0.95rem' }}
                  >
                    {node.displayName || 'Untitled'}
                  </span>
                  
                  {isSection && hasChildren && (
                    <span className="text-gray-400 w-4 h-4 flex items-center justify-center">
                      {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 6 15 12 9 18"></polyline>
                        </svg>
                      )}
                    </span>
                  )}
                </div>
                
                {hasChildren && isExpanded && (
                  <div>
                    {renderTree(childrenMap[node.path], level + 1)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      );
    };

    return renderTree(rootNodes);
  };

  return (
    <div className="overflow-auto h-full">
      <div className="p-4">
        {contents.length > 0 && (
          <h2 className="text-xl font-medium text-white mb-4">Tracing</h2>
        )}
        {contents.length === 0 ? (
          <p className="text-gray-400">No content available</p>
        ) : (
          buildTree()
        )}
      </div>
    </div>
  );
};

export default FileTree;
