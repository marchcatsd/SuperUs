import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { Heading1, Heading2, Heading3, List, ListOrdered, Text, CheckSquare } from 'lucide-react';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

// Add custom CSS for the editor
const editorStyles = `
  .ProseMirror ul {
    list-style-type: disc !important;
    padding-left: 1.5em !important;
  }
  
  .ProseMirror ol {
    list-style-type: decimal !important;
    padding-left: 1.5em !important;
  }
  
  .ProseMirror ul li, .ProseMirror ol li {
    margin-bottom: 0.5em;
  }
  
  .ProseMirror ul[data-type="taskList"] {
    list-style-type: none !important;
    padding-left: 0.5em !important;
  }
  
  .ProseMirror ul[data-type="taskList"] li {
    display: flex;
    align-items: flex-start;
    margin-bottom: 0.5em;
  }
  
  .ProseMirror ul[data-type="taskList"] li > label {
    margin-right: 0.5em;
    user-select: none;
  }
  
  .ProseMirror ul[data-type="taskList"] li > div {
    flex: 1;
  }
`;

const Placeholder = require('@tiptap/extension-placeholder').default;

interface TiptapEditorProps {
  content: any;
  documentId: string;
  onUpdate: (content: any) => void;
  readOnly?: boolean;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, documentId, onUpdate, readOnly = false }) => {
  const [saving, setSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Initialize YJS document
  const ydoc = useMemo(() => new Y.Doc(), []);

  // Initialize the shared type
  const ytype = useMemo(() => {
    // Get the default type from the YDoc
    return ydoc.getXmlFragment('prosemirror');
  }, [ydoc]);

  // Helper function to check if editor is empty
  const isEditorEmpty = (editor: any) => {
    if (!editor) return true;
    const text = editor.getText();
    return text.length === 0 || text === '/';
  };
  
  // Handle key press in the editor
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!editor) return;
    
    console.log('Key pressed:', event.key);
    
    // Show menu when slash is typed
    if (event.key === '/') {
      console.log('Slash detected, showing menu');
      setShowMenu(true);
      event.preventDefault(); // Prevent the slash from being typed
    }
    
    // Hide menu when escape is pressed
    if (event.key === 'Escape') {
      setShowMenu(false);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);

      // Join document room
      newSocket.emit('join-document', documentId);
      setIsConnected(true);
    });

    newSocket.on('content-change', (data) => {
      console.log('Received content change:', data);
      // The editor will handle the content change through the Collaboration extension
    });

    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      setIsConnected(false);
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [documentId, saveTimeout]);

  // Handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize editor only after socket is connected
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing or use / for commands...',
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Collaboration.configure({
        document: ydoc,
        field: 'prosemirror',
      }),
      // Only add CollaborationCursor if socket is connected
      ...(isConnected ? [
        CollaborationCursor.configure({
          provider: socketRef.current,
          user: {
            name: localStorage.getItem('userName') || 'Anonymous',
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          },
        })
      ] : []),
    ],
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const newContent = editor.getJSON();

      // Emit content change to server
      if (socketRef.current && isConnected) {
        socketRef.current.emit('content-change', {
          documentId,
          content: newContent
        });
      }

      // Debounce save to prevent too many requests
      setSaving(true);
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      const timeout = setTimeout(() => {
        onUpdate(newContent);
        setSaving(false);
      }, 1000);

      setSaveTimeout(timeout);
    },
  });

  // Set initial content when editor is ready
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [content, editor, ytype]);

  // Effect to show menu when editor is empty or focused
  useEffect(() => {
    if (editor) {
      // Show menu when editor is focused and empty
      editor.on('focus', () => {
        console.log('Editor focused');
        if (isEditorEmpty(editor)) {
          console.log('Editor is empty, showing menu');
          setShowMenu(true);
        }
      });
      
      
      editor.on('update', () => {
        const text = editor.getText();
        console.log('Editor updated, text:', text);
        
        if (text === '/') {
          console.log('Slash detected in text, showing menu');
          setShowMenu(true);
        } else if (text.length === 0) {
          console.log('Empty text, showing menu');
          setShowMenu(true);
        } else {
          console.log('Non-empty text, hiding menu');
          setShowMenu(false);
        }
      });
    }
  }, [editor]);

  return (
    <>
      {/* Add custom styles */}
      <style>{editorStyles}</style>
      
      <div className="relative" ref={editorContainerRef}>
      {/* Formatting toolbar (bubble menu) */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="bg-black text-white text-sm py-1 px-3 rounded-md shadow-lg flex space-x-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'font-bold' : ''}
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'italic' : ''}
            >
              I
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'line-through' : ''}
            >
              S
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive('code') ? 'font-mono' : ''}
            >
              {`</>`}
            </button>
          </div>
        </BubbleMenu>
      )}

      {/* Custom floating menu */}
      {editor && showMenu && (
        <div
          ref={menuRef}
          className="absolute z-50 top-12 left-1/2 transform -translate-x-1/2 bg-[#121212] rounded-md shadow-lg overflow-hidden border border-[#333333] w-80"
        >
          <div className="max-w-sm divide-y divide-[#333333]">
            <button
              onClick={() => {
                editor.chain().focus().setParagraph().run();
                setShowMenu(false);
              }}
              className="flex items-center px-4 py-2 hover:bg-[#1e1e1e] w-full text-left text-white"
            >
              <div className="mr-2"><Text size={18} /></div>
              <div>
                <div className="font-medium text-white">Text</div>
                <div className="text-xs text-gray-400">Just start typing with plain text.</div>
              </div>
            </button>

            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                setShowMenu(false);
              }}
              className="flex items-center px-4 py-2 hover:bg-[#1e1e1e] w-full text-left text-white"
            >
              <div className="mr-2"><Heading1 size={18} /></div>
              <div>
                <div className="font-medium text-white">Heading 1</div>
                <div className="text-xs text-gray-400">Big section heading.</div>
              </div>
            </button>

            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                setShowMenu(false);
              }}
              className="flex items-center px-4 py-2 hover:bg-[#1e1e1e] w-full text-left text-white"
            >
              <div className="mr-2"><Heading2 size={18} /></div>
              <div>
                <div className="font-medium text-white">Heading 2</div>
                <div className="text-xs text-gray-400">Medium section heading.</div>
              </div>
            </button>

            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                setShowMenu(false);
              }}
              className="flex items-center px-4 py-2 hover:bg-[#1e1e1e] w-full text-left text-white"
            >
              <div className="mr-2"><Heading3 size={18} /></div>
              <div>
                <div className="font-medium text-white">Heading 3</div>
                <div className="text-xs text-gray-400">Small section heading.</div>
              </div>
            </button>

            <button
              onClick={() => {
                editor.chain().focus().toggleBulletList().run();
                setShowMenu(false);
              }}
              className="flex items-center px-4 py-2 hover:bg-[#1e1e1e] w-full text-left text-white"
            >
              <div className="mr-2"><List size={18} /></div>
              <div>
                <div className="font-medium text-white">Bullet List</div>
                <div className="text-xs text-gray-400">Create a simple bullet list.</div>
              </div>
            </button>

            <button
              onClick={() => {
                editor.chain().focus().toggleOrderedList().run();
                setShowMenu(false);
              }}
              className="flex items-center px-4 py-2 hover:bg-[#1e1e1e] w-full text-left text-white"
            >
              <div className="mr-2"><ListOrdered size={18} /></div>
              <div>
                <div className="font-medium text-white">Numbered List</div>
                <div className="text-xs text-gray-400">Create a list with numbering.</div>
              </div>
            </button>
            
            <button
              onClick={() => {
                // Create a task list by first creating a bullet list and then converting it
                editor.chain().focus().toggleBulletList().run();
                // We can't directly toggle task list with the current setup
                setShowMenu(false);
              }}
              className="flex items-center px-4 py-2 hover:bg-[#1e1e1e] w-full text-left text-white"
            >
              <div className="mr-2"><CheckSquare size={18} /></div>
              <div>
                <div className="font-medium text-white">Task List</div>
                <div className="text-xs text-gray-400">Create a checklist of tasks.</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Editor content */}
      <div className="p-4 min-h-[350px]">
        {editor && (
          <EditorContent
            editor={editor}
            className="prose prose-invert max-w-none min-h-[350px] focus:outline-none"
            onKeyDown={handleKeyDown}
          />
        )}
      </div>

      {/* Status indicator */}
      {saving && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          Saving...
        </div>
      )}
    </div>
    </>
  );
};

export default TiptapEditor;
