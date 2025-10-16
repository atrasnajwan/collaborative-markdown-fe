import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Box, Typography, AppBar, Toolbar, Button } from '@mui/material';
import { api } from '../services/api';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeAddClasses from 'rehype-add-classes';
import '../styles/markdown.css';
import Editor from '@monaco-editor/react';
import { CollaborationProvider } from '../services/CollaborationProvider';
import { useAuth } from '../contexts/AuthContext';

const EditDocument: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [markdown, setMarkdown] = useState<string>('');
    const [remoteCursors, setRemoteCursors] = useState<{ [userId: string]: { line: number; column: number; color: string; name: string } }>({});
    const [title, setTitle] = useState<string>('');
    const collaborationRef = useRef<CollaborationProvider | null>(null);
    const editorRef = useRef<any>(null);
    const [decorationIds, setDecorationIds] = useState<string[]>([]);
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState<boolean>(false)

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const document = await api.getDocument(id!);
                setMarkdown(document.content);
                setTitle(document.title);
            } catch (error) {
                console.error('Failed to fetch document:', error);
            }
        };

        if (id && user) {
            fetchDocument();
            collaborationRef.current = new CollaborationProvider(id, user);
            
            return () => {
                if (collaborationRef.current) {
                    collaborationRef.current.destroy();
                    collaborationRef.current = null
                }
            };
        }
    }, [id, user]);

    // handle received broadcast message
    useEffect(() => {
        if (!collaborationRef.current) return;

        // Sync markdown content from Yjs
        const yText = collaborationRef.current.getText();
        const updateHandler = () => setMarkdown(yText.toString());
        yText.observe(updateHandler);

        // Sync remote cursors from awareness
        const awareness = collaborationRef.current.getAwareness();
        const onAwarenessChange = () => {
            const states = awareness.getStates();
            let cursors: typeof remoteCursors = {};

            for (const [_, state] of states) {
                if (user && state.cursor && state.user && state.user.id !== user.id) {
                    cursors[state.user.id] = {
                        line: state.cursor.line,
                        column: state.cursor.column,
                        color: state.user.color,
                        name: state.user.name
                    };
                }
            }
            setRemoteCursors(cursors);
        };
        awareness.on('change', onAwarenessChange);
        // Cleanup both observers
        return () => {
            yText.unobserve(updateHandler);
            awareness.off('change', onAwarenessChange);
        };
    }, [collaborationRef.current, user]);

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setMarkdown(value);
            if (collaborationRef.current) {
                collaborationRef.current.sendContentUpdate(value);
            }
        }
    };

    // cursor update
    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
        editor.onDidChangeCursorPosition((_e: any) => {
            if (collaborationRef.current && user) {
                const model = editor.getModel();
                const selection = editor.getSelection();
                
                if (model && selection) {
                    const lineContent = model.getLineContent(selection.positionLineNumber);
                    const lineLength = lineContent.length;
                    
                    // Check if cursor is at end of line
                    const column = selection.positionColumn > lineLength ? 
                        lineLength + 1 : selection.positionColumn;

                    collaborationRef.current.sendCursorUpdate({
                        line: selection.positionLineNumber,
                        column: column,
                        userName: user.name
                    });
                }
            }
        });
        console.log('Awareness states:', collaborationRef.current?.getAwareness().getStates());
    };

    useEffect(() => {
        if (!editorRef.current || Object.keys(remoteCursors).length === 0) return;

        if (editorRef.current.constructor && editorRef.current.constructor.name === "W") {
            // Monaco is available as a property of the editor instance
            const monacoInstance = editorRef.current._standaloneKeybindingService?._monaco || editorRef.current._monaco;
            const MonacoRange = monacoInstance?.Range || (window as any).monaco?.Range;
            console.log("user", user?.name, "remote cursor", remoteCursors)
            const decorations = Object.entries(remoteCursors).map(([_, cursor]) => ({
                range: new MonacoRange(
                    cursor.line,
                    cursor.column,
                    cursor.line,
                    cursor.column
                ),
                options: {
                    className: `remote-cursor remote-cursor-color-${cursor.color.replace('#', '')}`,
                    // beforeContentClassName: `remote-cursor-label remote-cursor-label-${cursor.color.replace('#', '')}`,
                    hoverMessage: { value: cursor.name },
                    // inlineClassName: `remote-cursor-color-${cursor.color.replace('#', '')}`, // Use color value
                },
            }));
             // Clear previous decorations and set new ones
            const newDecorationIds = editorRef.current.deltaDecorations(decorationIds, decorations);
            setDecorationIds(newDecorationIds);
        }
    }, [remoteCursors]);

    const handleUpdateDocument = async() => {
        try {
            setIsSaving(true)
            await api.updateDocument(id!, markdown)
        } catch(err) {
            console.error('Failed to update document:', err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#1e1e1e' }}>
            {/* Header */}
            <AppBar position="static" sx={{ bgcolor: '#1e1e1e', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Toolbar>
                    <Typography variant="h6" component="h1" sx={{ color: '#fff', fontWeight: 500 }}>
                        {title || 'Untitled Document'}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant='contained' disabled={isSaving} onClick={handleUpdateDocument}>Save</Button>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Editor Section */}
                <Box sx={{ flex: 1, height: '100%', borderRight: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                    <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        value={markdown}
                        onChange={handleEditorChange}
                        onMount={handleEditorDidMount}
                        theme="vs-dark"
                        options={{  
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            wrappingIndent: 'same',
                            automaticLayout: true,
                        }}
                    />
                </Box>

                {/* Preview Section */}
                <Box sx={{ flex: 1, height: '100%', overflow: 'auto', bgcolor: '#2d2d2d' }}>
                    <div className="markdown-preview">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[
                                rehypeRaw,
                                rehypeSanitize,
                                rehypeSlug,
                                [rehypeAddClasses, { 'h1,h2,h3,h4,h5,h6': 'heading-with-hr' }],
                                [rehypeAutolinkHeadings, { behavior: 'wrap' }]
                            ]}
                            components={{
                                code: ({ className, children, ...props }: any) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return className ? (
                                        <SyntaxHighlighter
                                            {...props}
                                            style={vscDarkPlus}
                                            language={match ? match[1] : ''}
                                            PreTag="div"
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {markdown}
                        </ReactMarkdown>
                    </div>
                </Box>
            </Box>
        </Box>
    );
};

export default EditDocument;
