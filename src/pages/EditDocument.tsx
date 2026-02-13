import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material'
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
import { useNotification } from '../contexts/NotificationContext'

type AwarenessState = {
  line: number
  column: number
  color: string
  name: string
}

const EditDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showNotification } = useNotification()

  const [markdown, setMarkdown] = useState<string>('')
  const [remoteCursors, setRemoteCursors] = useState<
    Record<number, AwarenessState>
  >({})
  const [title, setTitle] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [synced, setSynced] = useState<boolean>(false)
  const [isEditorReady, setIsEditorReady] = useState<boolean>(false)

  const collaborationRef = useRef<CollaborationProvider | null>(null)
  const editorRef = useRef<any>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)
  const modelRef = useRef<any>(null)
  const decorationIdsRef = useRef<string[]>([])

  const handleKicked = (msg: string) => {
    if (collaborationRef.current) {
      collaborationRef.current.destroy()
      collaborationRef.current = null
    }
    showNotification(msg, 'info', false)
    navigate(`/documents`)
  }

  const handleServerMessage = (msg: any) => {
    switch (msg.type) {
      case 'permission-changed':
        setUserRole(msg.role)
        showNotification(`Your role is changed to ${msg.role}`)
        break

      case 'kicked':
        handleKicked("You've been removed to access this document!")
        break

      case 'document-deleted':
        handleKicked('This document has been deleted by the owner!')
        break
    }
  }

  const bindMonaco = (msg: string) => {
    console.log(
      'from:',
      msg,
      'isEditorReady',
      isEditorReady,
      'synced:',
      synced,
      'editorRef:',
      Boolean(editorRef.current),
      'collabRef:',
      Boolean(collaborationRef.current)
    )
    if (!synced) return
    if (!editorRef.current) return
    if (!collaborationRef.current) return
    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }
    console.log('run bindmonaco')

    const editor = editorRef.current
    const monaco = (window as any).monaco
    const yText = collaborationRef.current.getText()

    const model = monaco.editor.createModel('', 'markdown')
    modelRef.current = model
    editor.setModel(model)

    bindingRef.current = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      collaborationRef.current.getAwareness()
    )
  }

  useEffect(() => {
    if (!id || !user) return

    let collab: CollaborationProvider | null = null
    let yObserver: (() => void) | null = null
    let awarenessObserver: (() => void) | null = null

    const init = async () => {
      try {
        const doc = await api.getDocument(id)
        setTitle(doc.title)
        setUserRole(doc.role)

        if (doc.role === UserRole.None) {
          navigate('/documents')
          return
        }

        // Destroy previous instance if exists
        if (collaborationRef.current) {
          collaborationRef.current.destroy()
          collaborationRef.current = null
        }

        collab = new CollaborationProvider(
          id,
          user,
          handleServerMessage,
          (state) => {
            setSynced(state)

            // // Bind editor ONLY when synced
            // if (state && editorRef.current && !bindingRef.current) {
            // bindMonaco()
            // }
          }
        )

        collaborationRef.current = collab

        // Observe Yjs text
        yObserver = () => {
          if (!collab) return
          setMarkdown(collab.getContent())
        }

        collab.text.observe(yObserver)

        // Awareness observer
        awarenessObserver = () => {
          const states = collab!.getAwareness().getStates()
          const cursors: any = {}

          states.forEach((state: any) => {
            // skip self
            if (!state.user || state.user.id === user.id) return

            cursors[state.user.id] = {
              line: state.cursor?.line || 1,
              column: state.cursor?.column || 1,
              color: state.user.color || '#cccccc',
              name: state.user.name || 'Anonymous',
            }
          })

          setRemoteCursors(cursors)
        }

        collab.getAwareness().on('change', awarenessObserver)
      } catch (err) {
        console.error('Init error:', err)
      }
    }

    init()

    return () => {
      if (collab && yObserver) {
        collab.text.unobserve(yObserver)
      }

      if (collab && awarenessObserver) {
        collab.getAwareness().off('change', awarenessObserver)
      }

      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }

      if (collab) {
        collab.destroy()
      }

      collaborationRef.current = null
      setSynced(false)
      console.log('clear main useEffect')
      setMarkdown('')
    }
  }, [id, user?.id])

  // binding when synced
  useEffect(() => {
    if (!synced || !isEditorReady) return
    bindMonaco('useeffect')
  }, [synced, isEditorReady])

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    setIsEditorReady(true)
    // bindMonaco('handleEditorDidMount')
    editor.onDidChangeCursorPosition(() => {
      const model = editor.getModel()
      const selection = editor.getSelection()
      if (!model || !selection || !collaborationRef.current) return

      // The cursor is the "active" end of the selection
      const cursor = {
        line: selection.positionLineNumber,
        column: selection.positionColumn,
        userName: user?.name || 'Anonymous',
      }

      // The selection is the full range (start to end)
      const selectionRange = {
        startLine: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLine: selection.endLineNumber,
        endColumn: selection.endColumn,
      }

      // send cursor position
      collaborationRef.current.sendCursorUpdate(cursor, selectionRange)
    })
  }

  // Remote Cursor Decorations
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || Object.keys(remoteCursors).length === 0) {
      decorationIdsRef.current =
        editor?.deltaDecorations(decorationIdsRef.current, []) || []
      return
    }

    const monaco =
      (window as any).monaco || editor._standaloneKeybindingService?._monaco
    if (!monaco) return

    const newDecorations: any[] = []

    // eslint-disable-next-line no-unused-vars
    Object.entries(remoteCursors).forEach(([_, data]: [string, any]) => {
      const colorHex = data.color.replace('#', '')

      // Draw the Cursor
      newDecorations.push({
        range: new monaco.Range(data.line, data.column, data.line, data.column),
        options: {
          // className: `remote-cursor remote-cursor-color-${colorHex}`,
          // beforeContentClassName: `remote-cursor-label remote-cursor-label-${colorHex}`,
          beforeContentClassName: `remote-cursor remote-cursor-color-${colorHex}`,
          afterContentClassName: `remote-cursor-label remote-cursor-label-${colorHex}`,
          hoverMessage: { value: data.name },
          // layering
          zIndex: 10,
        },
      })

      // Draw the Selection (The background highlight)
      // Only draw if start and end are different
      if (
        data.selection &&
        (data.selection.startLine !== data.selection.endLine ||
          data.selection.startColumn !== data.selection.endColumn)
      ) {
        newDecorations.push({
          range: new monaco.Range(
            data.selection.startLine,
            data.selection.startColumn,
            data.selection.endLine,
            data.selection.endColumn
          ),
          options: {
            className: `remote-selection remote-selection-color-${colorHex}`,
            isWholeLine: false,
            zIndex: 5, // Keep selection behind the cursor
          },
        })
      }
    })

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      newDecorations
    )
  }, [remoteCursors])

  useEffect(() => {
    return () => {
      console.log('FIRED')
      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }

      if (modelRef.current) {
        modelRef.current.dispose()
        modelRef.current = null
      }

      if (collaborationRef.current) {
        collaborationRef.current.destroy()
        collaborationRef.current = null
      }
    }
  }, [])

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
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 500 }}>
            {title || 'Untitled Document'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <AvatarGroup
              max={4}
              sx={{
                '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 14 },
              }}
            >
              {/* Show Yourself */}
              {user && (
                <Tooltip title={`${user.name} (You)`}>
                  <Avatar {...stringAvatar(user.name)} />
                </Tooltip>
              )}

              {/* Show Remote Collaborators */}
              {Object.entries(remoteCursors).map(([userId, cursor]) => (
                <Tooltip key={userId} title={cursor.name}>
                  <Avatar {...stringAvatar(cursor.name, cursor.color)} />
                </Tooltip>
              ))}
            </AvatarGroup>

            {/* Connection Status Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: synced ? 'success.main' : 'error.main',
                  boxShadow: synced ? '0 0 8px #4caf50' : 'none',
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {synced ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Show a small toast instead of hiding the whole editor */}
        {!synced && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 11,
              bgcolor: 'primary.main',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            Connecting...
          </Box>
        )}

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
                [rehypeAddClasses, { 'h1,h2,h3,h4,h5,h6': 'heading-with-hr' }],
                [
                  rehypeAutolinkHeadings,
                  {
                    behavior: 'append', // Change 'wrap' to 'append' or 'prepend'
                    content: {
                      type: 'element',
                      tagName: 'span',
                      properties: { className: ['icon-link'] },
                      children: [{ type: 'text', value: ' #' }], // Or use an SVG icon
                    },
                  },
                ],
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
    </Box>
  )
}

function stringAvatar(name: string, color?: string) {
  if (!color) {
    const hash = name
      .split('')
      .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
    color = `hsl(${hash % 360}, 65%, 50%)`
  }

  return {
    sx: {
      bgcolor: color,
      width: 32,
      height: 32,
      fontSize: '0.875rem',
      border: '2px solid #1e1e1e', // Adds a "ring" around
    },
    children: `${name.split(' ')[0][0]}${name.split(' ')[1]?.[0] || ''}`,
  }
}

export default EditDocument
