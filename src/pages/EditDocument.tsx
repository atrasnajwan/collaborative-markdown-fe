import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeAddClasses from 'rehype-add-classes'
import '../styles/markdown.css'
import Editor from '@monaco-editor/react'
import { MonacoBinding } from 'y-monaco'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Visibility from '@mui/icons-material/Visibility'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import AvatarGroup from '@mui/material/AvatarGroup'
import Avatar from '@mui/material/Avatar'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

import { useNotification } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/AuthContext'
import { api, UserRole } from '../services/api'
import {
  AwarenessState,
  CollaborationProvider,
  CursorPosition,
  SelectionRange,
  UserAwareness,
} from '../services/CollaborationProvider'


const EditDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showNotification } = useNotification()

  const [markdown, setMarkdown] = useState<string>('')
  const [collaborators, setCollaborators] = useState<
    Record<number, UserAwareness>
  >({})
  const [title, setTitle] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [synced, setSynced] = useState<boolean>(false)
  const [isEditorReady, setIsEditorReady] = useState<boolean>(false)
  const [showPreview, setShowPreview] = useState<boolean>(false)

  const collaborationRef = useRef<CollaborationProvider | null>(null)
  const editorRef = useRef<any>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)
  const modelRef = useRef<any>(null)
  const decorationIdsRef = useRef<string[]>([])
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const throttledCursorSyncRef = useRef<((editor: any) => void) | null>(null)

  const togglePreview = () => {
    setShowPreview((prev) => {
      const nextState = !prev
      if (nextState && collaborationRef.current) {
        setMarkdown(collaborationRef.current.getContent())
      }
      return nextState
    })
  }

  // toogle preview using keyboard shortcut (ctrl + p)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        togglePreview()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleKicked = (msg: string) => {
    if (collaborationRef.current) {
      collaborationRef.current.destroy()
      collaborationRef.current = null
    }
    showNotification(msg, 'error', false)
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

  const bindMonaco = () => {
    if (!synced) return
    if (!editorRef.current) return
    if (!collaborationRef.current) return
    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }

    const editor = editorRef.current
    const monaco = (window as any).monaco
    const yText = collaborationRef.current.getText()

    // only create once
    if (!modelRef.current) {
      const model = monaco.editor.createModel('', 'markdown')
      modelRef.current = model
    }
    editor.setModel(modelRef.current)

    bindingRef.current = new MonacoBinding(
      yText,
      modelRef.current,
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
          handleKicked("You don't have access to this document!")
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
          (state) => setSynced(state)
        )

        collaborationRef.current = collab

        // Observe Yjs text
        yObserver = () => {
          // Clear the previous timer if the user is still typing
          if (previewTimerRef.current) {
            clearTimeout(previewTimerRef.current)
          }

          previewTimerRef.current = setTimeout(() => {
            if (collaborationRef.current) {
              setMarkdown(collaborationRef.current.getContent())
            }
            previewTimerRef.current = null
          }, 300)
        }

        collab.text.observe(yObserver)

        // Awareness observer
        awarenessObserver = () => {
          const states = collab!.getAwareness().getStates() as Map<
            number,
            AwarenessState
          >
          const newDecorations: any[] = []
          if (!editorRef.current) return
          const monaco =
            (window as any).monaco ||
            editorRef.current._standaloneKeybindingService?._monaco
          if (!monaco) return

          const remoteUsers: Record<number, UserAwareness> = {}

          states.forEach((state: any) => {
            // skip self
            if (!state.user || state.user.id === user.id) return
            remoteUsers[state.user.id] = state.user

            if (!state.cursor) return

            // Remote Cursor Decorations
            const colorHex = state.user.color.replace('#', '')
            // Cursor & Label Decoration
            if (state.cursor) {
              newDecorations.push({
                // collapsed range = no width
                range: new monaco.Range(
                  state.cursor.line,
                  state.cursor.column,
                  state.cursor.line,
                  state.cursor.column
                ),
                options: {
                  className: `remote-cursor remote-cursor-${colorHex}`,
                  beforeContentClassName: `remote-cursor-label remote-cursor-label-${colorHex}`,
                  hoverMessage: { value: state.user.name },
                  showIfCollapsed: true,
                },
              })
            }

            // Selection Decoration
            if (state.uiSelection) {
              const { startLine, startColumn, endLine, endColumn } =
                state.uiSelection
              if (startLine !== endLine || startColumn !== endColumn) {
                newDecorations.push({
                  range: new monaco.Range(
                    startLine,
                    startColumn,
                    endLine,
                    endColumn
                  ),
                  options: {
                    className: `remote-selection remote-selection-${colorHex}`,
                    zIndex: 5,
                  },
                })
              }
            }
          })

          // Directly update Monaco without triggering a React re-render
          if (editorRef.current) {
            decorationIdsRef.current = editorRef.current.deltaDecorations(
              decorationIdsRef.current,
              newDecorations
            )
          }

          // state for the AppBar Avatars
          setCollaborators(remoteUsers)
        }

        collab.getAwareness().on('change', awarenessObserver)
      } catch (err) {
        console.error('Init error:', err)
      }
    }

    init()

    return () => {
      if (collab && yObserver) collab.text.unobserve(yObserver)
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)

      if (collab && awarenessObserver)
        collab.getAwareness().off('change', awarenessObserver)

      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }

      if (collab) collab.destroy()

      collaborationRef.current = null
      setSynced(false)
      setMarkdown('')
    }
  }, [id, user?.id])

  // binding when synced
  useEffect(() => {
    if (!synced || !isEditorReady) return
    bindMonaco()
  }, [synced, isEditorReady])

  useEffect(() => {
    let lastRun = 0

    throttledCursorSyncRef.current = (editor: any) => {
      const now = Date.now()

      // 100ms
      if (now - lastRun < 100) return

      lastRun = now

      const selection = editor.getSelection()
      if (!selection || !collaborationRef.current) return

      const cursor: CursorPosition = {
        line: selection.positionLineNumber,
        column: selection.positionColumn,
      }

      const selectionRange: SelectionRange = {
        startLine: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLine: selection.endLineNumber,
        endColumn: selection.endColumn,
      }

      collaborationRef.current.sendCursorUpdate(cursor, selectionRange)
    }
  }, []) // Initialize once

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    setIsEditorReady(true)

    editor.onDidChangeCursorPosition(() => {
      if (throttledCursorSyncRef.current) {
        throttledCursorSyncRef.current(editor)
      }
    })
  }

  useEffect(() => {
    return () => {
      if (modelRef.current) {
        modelRef.current.dispose()
        modelRef.current = null
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
          <Tooltip title="Toggle Preview (Ctrl+P)">
            <IconButton
              onClick={togglePreview}
              sx={{
                color: 'white',
                ml: 1,
                display: { xs: 'none', md: 'block' },
              }}
            >
              {showPreview ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>

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
              {Object.entries(collaborators).map(([userId, collaborator]) => (
                <Tooltip key={userId} title={collaborator.name}>
                  <Avatar
                    {...stringAvatar(collaborator.name, collaborator.color)}
                  />
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
            width: showPreview ? '50%' : '100%',
            borderRight: showPreview
              ? '1px solid rgba(255,255,255,0.1)'
              : 'none',
          }}
        >
          <Editor
            height="100%"
            defaultLanguage="markdown"
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              readOnly:
                !isEditorReady || !synced || userRole === UserRole.Viewer,
              domReadOnly:
                !isEditorReady || !synced || userRole === UserRole.Viewer,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              wrappingIndent: 'same',
              automaticLayout: true,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
              },
              // Prevents Monaco from re-scanning the whole doc for links while you type
              links: false,
              // Fast scrolling
              fastScrollSensitivity: 7,
            }}
          />
        </Box>

        {/* Preview Section */}
        {showPreview && (
          <Box
            sx={{
              flex: 1,
              width: '50%',
              height: '100%',
              overflow: 'auto',
              bgcolor: '#2d2d2d',
              display: { xs: 'none', md: 'block' },
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
        )}
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
