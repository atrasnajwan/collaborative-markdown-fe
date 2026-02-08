import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Box, Typography, AppBar, Toolbar } from '@mui/material'
import { api, UserRole } from '../services/api'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeAddClasses from 'rehype-add-classes'
import '../styles/markdown.css'
import Editor from '@monaco-editor/react'
import { CollaborationProvider } from '../services/CollaborationProvider'
import { useAuth } from '../contexts/AuthContext'
import { MonacoBinding } from 'y-monaco'

const EditDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [markdown, setMarkdown] = useState<string>('')
  const [remoteCursors, setRemoteCursors] = useState<{
    [userId: string]: {
      line: number
      column: number
      color: string
      name: string
    }
  }>({})
  const [title, setTitle] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const collaborationRef = useRef<CollaborationProvider | null>(null)
  const editorRef = useRef<any>(null)
  const [synced, setSynced] = useState<boolean>(false)
  const [decorationIds, setDecorationIds] = useState<string[]>([])
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchDocument = async () => {
    try {
      // const doc = await api.getDocument(id!);
      const doc = await api.getDocument(id!)
      setTitle(doc.title)
      setUserRole(doc.role)
      if (doc.role === UserRole.None) {
        alert("You don't have permission to access this document!")
        navigate(`/documents`)
      }
    } catch (error) {
      console.error('Failed to fetch document:', error)
    }
  }

  useEffect(() => {
    if (!id || !user) return
    fetchDocument()
    collaborationRef.current = new CollaborationProvider(
      id,
      user,
      handleServerMessage
    )

    // Set initial sync state
    setSynced(collaborationRef.current.synced)

    const updatePreview = () => {
      if (collaborationRef.current) {
        setMarkdown(collaborationRef.current.getContent())
      }
    }

    // initial render
    updatePreview()
    collaborationRef.current?.text.observe(updatePreview)

    return () => {
      if (collaborationRef.current) {
        // cleanup observer + provider
        collaborationRef.current.text.unobserve(updatePreview)
        collaborationRef.current.destroy()
        collaborationRef.current = null
      }
    }
  }, [id, user])

  useEffect(() => {
    if (!collaborationRef.current) return
    setSynced(collaborationRef.current.synced)
  }, [collaborationRef.current?.synced])

  const handleKicked = (msg: string) => {
    if (collaborationRef.current) {
      collaborationRef.current.destroy()
      collaborationRef.current = null
    }
    alert(msg)
    navigate(`/documents`)
  }

  const handleServerMessage = (msg: any) => {
    switch (msg.type) {
      case 'permission-changed':
        setUserRole(msg.role)
        alert(`Your role is changed to ${msg.role}`)
        break

      case 'kicked':
        handleKicked("You've been removed to access this document!")
        break

      case 'document-deleted':
        handleKicked('This document has been deleted by the owner!')
        break
    }
  }
  const bindMonaco = () => {
    if (!collaborationRef.current) return
    if (!editorRef.current || !synced) return

    new MonacoBinding(
      collaborationRef.current?.getText(),
      editorRef.current?.getModel(),
      new Set([editorRef.current]),
      collaborationRef.current?.getAwareness()
    )
  }

  const handleEditorDidMount = (editor: any) => {
    if (!collaborationRef.current) return

    editorRef.current = editor
    bindMonaco()

    editor.onDidChangeCursorPosition((_e: any) => {
      const model = editor.getModel()
      if (!model) return
      if (collaborationRef.current && user) {
        const selection = editor.getSelection()

        if (model && selection) {
          const lineContent = model.getLineContent(selection.positionLineNumber)
          const lineLength = lineContent.length

          // Check if cursor is at end of line
          const column =
            selection.positionColumn > lineLength
              ? lineLength + 1
              : selection.positionColumn

          collaborationRef.current.sendCursorUpdate({
            line: selection.positionLineNumber,
            column: column,
            userName: user.name,
          })
        }
      }
    })
    // console.log('Awareness states:', collaborationRef.current?.getAwareness().getStates());
  }

  useEffect(() => {
    if (!collaborationRef.current) return

    // Sync remote cursors from awareness
    const awareness = collaborationRef.current.getAwareness()
    const onAwarenessChange = () => {
      const states = awareness.getStates()
      const cursors: typeof remoteCursors = {}

      for (const [_, state] of states) {
        if (user && state.cursor && state.user && state.user.id !== user.id) {
          cursors[state.user.id] = {
            line: state.cursor.line,
            column: state.cursor.column,
            color: state.user.color,
            name: state.user.name,
          }
        }
      }
      setRemoteCursors(cursors)
    }
    awareness.on('change', onAwarenessChange)
    // Cleanup both observers
    return () => {
      awareness.off('change', onAwarenessChange)
    }
  }, [collaborationRef.current, user])

  useEffect(() => {
    if (!editorRef.current || Object.keys(remoteCursors).length === 0) return

    if (
      editorRef.current.constructor &&
      editorRef.current.constructor.name === 'W'
    ) {
      // Monaco is available as a property of the editor instance
      const monacoInstance =
        editorRef.current._standaloneKeybindingService?._monaco ||
        editorRef.current._monaco
      const MonacoRange = monacoInstance?.Range || (window as any).monaco?.Range
      console.log('user', user?.name, 'remote cursor', remoteCursors)
      const decorations = Object.entries(remoteCursors).map(([_, cursor]) => ({
        range: new MonacoRange(
          cursor.line,
          cursor.column,
          cursor.line,
          cursor.column
        ),
        options: {
          className: `remote-cursor remote-cursor-color-${cursor.color.replace('#', '')}`,
          beforeContentClassName: `remote-cursor-label remote-cursor-label-${cursor.color.replace('#', '')}`,
          hoverMessage: { value: cursor.name },
          inlineClassName: `remote-cursor-color-${cursor.color.replace('#', '')}`, // Use color value
        },
      }))
      // Clear previous decorations and set new ones
      const newDecorationIds = editorRef.current.deltaDecorations(
        decorationIds,
        decorations
      )
      setDecorationIds(newDecorationIds)
    }
  }, [remoteCursors])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: '#1e1e1e',
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          bgcolor: '#1e1e1e',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component="h1"
            sx={{ color: '#fff', fontWeight: 500 }}
          >
            {title || 'Untitled Document'}
          </Typography>
        </Toolbar>
      </AppBar>
      {/* Main Content */}
      {synced ? (
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* Editor Section */}
          <Box
            sx={{
              flex: 1,
              height: '100%',
              borderRight: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
            }}
          >
            <Editor
              height="100%"
              defaultLanguage="markdown"
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                readOnly: !synced || userRole === UserRole.Viewer,
                domReadOnly: !synced || userRole === UserRole.Viewer,
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
          <Box
            sx={{
              flex: 1,
              height: '100%',
              overflow: 'auto',
              bgcolor: '#2d2d2d',
            }}
          >
            <div className="markdown-preview">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                  rehypeRaw,
                  rehypeSanitize,
                  rehypeSlug,
                  [
                    rehypeAddClasses,
                    { 'h1,h2,h3,h4,h5,h6': 'heading-with-hr' },
                  ],
                  [rehypeAutolinkHeadings, { behavior: 'wrap' }],
                ]}
                components={{
                  code: ({ className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '')
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
                    )
                  },
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </Box>
        </Box>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"></div>
        </div>
      )}
    </Box>
  )
}

export default EditDocument
