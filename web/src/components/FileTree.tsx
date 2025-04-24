import React, { useState } from 'react';

interface FileNode {
  _id: string;
  title: string;
  path: string;
  parentPath: string;
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

    // Group nodes by parent path
    contents.forEach(node => {
      const parentPath = node.parentPath || '';
      
      if (!childrenMap[parentPath]) {
        childrenMap[parentPath] = [];
      }
      
      childrenMap[parentPath].push(node);
    });

    // Get root nodes (nodes with empty parent path)
    rootNodes.push(...(childrenMap[''] || []));

    // Recursive function to render tree
    const renderTree = (nodes: FileNode[], level = 0) => {
      return (
        <ul className={`pl-${level > 0 ? 4 : 0}`}>
          {nodes.map(node => {
            const hasChildren = childrenMap[node.path]?.length > 0;
            const isExpanded = expandedFolders[node.path] || false;
            
            return (
              <li key={node._id} className="py-1">
                <div 
                  className={`flex items-center cursor-pointer ${selectedFileId === node._id ? 'bg-[#1e1e1e] rounded' : ''}`}
                  onClick={() => onSelectFile(node._id)}
                >
                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedFolders(prev => ({
                          ...prev,
                          [node.path]: !prev[node.path]
                        }));
                      }}
                      className="mr-1 text-gray-400 focus:outline-none"
                    >
                      {isExpanded ? '▼' : '►'}
                    </button>
                  )}
                  <span className={`truncate ${selectedFileId === node._id ? 'font-medium text-blue-400' : 'text-gray-300'}`}>
                    {node.title}
                  </span>
                </div>
                
                {hasChildren && isExpanded && renderTree(childrenMap[node.path], level + 1)}
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
