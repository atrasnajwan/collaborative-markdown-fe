import React, { useState, useEffect } from 'react';
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

const EditDocument: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [markdown, setMarkdown] = useState<string>('');
    const [title, setTitle] = useState<string>('');

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

        if (id) fetchDocument();
    }, [id]);

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
                <Box sx={{ flex: 1, height: '100%', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                    <textarea
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        className="markdown-editor"
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