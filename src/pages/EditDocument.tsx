import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Box, Typography, AppBar, Toolbar } from '@mui/material';
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
    const [title, setTitle] = useState<string>('');
    const collaborationRef = useRef<CollaborationProvider | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const document = await api.getDocument(id!);
                setMarkdown(document.content);
                setTitle(document.title);

                // Initialize collaboration
                if (id && user) {
                    collaborationRef.current = new CollaborationProvider(id, user);
                }
            } catch (error) {
                console.error('Failed to fetch document:', error);
            }
        };

        if (id && user) {
            fetchDocument();
        }

        return () => {
            if (collaborationRef.current) {
                collaborationRef.current.destroy();
                collaborationRef.current = null
            }
        };
    }, [id]);

    // handle received broadcast message
    useEffect(() => {
        if (collaborationRef.current) {
            const yText = collaborationRef.current.getText();
            const updateHandler = () => setMarkdown(yText.toString())
            yText.observe(updateHandler);

            return () => yText.unobserve(updateHandler);
        }
    }, [collaborationRef.current]);

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
        editor.onDidChangeCursorPosition((e: any) => {
            if (collaborationRef.current && user) {
                const position = e.position;
                collaborationRef.current.sendCursorUpdate({
                    line: position.lineNumber,
                    column: position.column,
                    userName: user.name
                });
            }
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#1e1e1e' }}>
            {/* Header */}
            <AppBar position="static" sx={{ bgcolor: '#1e1e1e', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Toolbar>
                    <Typography variant="h6" component="h1" sx={{ color: '#fff', fontWeight: 500 }}>
                        {title || 'Untitled Document'}
                    </Typography>
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
