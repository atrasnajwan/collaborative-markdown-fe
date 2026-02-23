import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../styles/markdown.css'
import 'prismjs/themes/prism-tomorrow.css'
import Editor, { loader } from '@monaco-editor/react'
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
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'

import { useNotification } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { CollaborationProvider } from '../services/CollaborationProvider'
import {
  AwarenessState,
  CursorPosition,
  SelectionRange,
  User,
  UserAwareness,
  UserRole,
} from '../types/types'

import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { full as emoji } from 'markdown-it-emoji'
import Prism from 'prismjs'
import 'prismjs/plugins/autoloader/prism-autoloader'

// Tell the prism autoloader where to find the language files (using a CDN)
if (typeof window !== 'undefined') {
  Prism.plugins.autoloader.languages_path =
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/'
}

const mdParser: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (code, lang) => {
    // Check if the language is loaded in Prism
    if (lang && Prism.languages[lang]) {
      try {
        return `<pre class="language-${lang}"><code class="language-${lang}">${Prism.highlight(
          code,
          Prism.languages[lang],
          lang
        )}</code></pre>`
      } catch (e) {
        console.error('Prism highlighting error:', e)
      }
    }

    // Fallback for unknown languages
    return `<pre class="language-none"><code class="language-none">${mdParser.utils.escapeHtml(code)}</code></pre>`
  },
}).use(emoji)

const EditDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showNotification } = useNotification()

  const [monacoReady, setMonacoReady] = useState(false)
  const [markdown, setMarkdown] = useState<string>('')

  const [collaborators, setCollaborators] = useState<
    Record<number, UserAwareness>
  >({})
  const [title, setTitle] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [wsConnected, setWsConnected] = useState<boolean>(false)
  const [synced, setSynced] = useState<boolean>(false)
  const [isEditorReady, setIsEditorReady] = useState<boolean>(false)
  const [showPreview, setShowPreview] = useState<boolean>(false)

  const collaborationRef = useRef<CollaborationProvider | null>(null)
  const editorRef = useRef<any>(null)
  const MonacoBindingRef = useRef<any>(null)
  const bindingRef = useRef<any | null>(null)
  const modelRef = useRef<any>(null)
  const decorationIdsRef = useRef<string[]>([])
  const throttledCursorSyncRef = useRef<((editor: any) => void) | null>(null)

  // load monaco from CDN for editor binding
  useEffect(() => {
    let cancelled = false

    loader.config({
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs',
      },
    })

    loader.init().then(async () => {
      if (!cancelled) {
        setMonacoReady(true)
        const mon = await import('y-monaco')
        MonacoBindingRef.current = mon.MonacoBinding
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

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
        showNotification(`Your role have been changed to ${msg.role}`)
        break

      case 'kicked':
        handleKicked(`You've been removed to access this document! (${title})`)
        break

      case 'document-deleted':
        handleKicked(`Document has been deleted by the owner!`)
        break

      case 'auth-error':
        handleKicked(`Invalid authentication! Try refresh your browser`)
        break

      case 'no-access':
        handleKicked(`You don't have access to this document!`)
        break
    }
  }

  const bindMonaco = () => {
    if (!synced) return
    if (!editorRef.current) return
    if (!collaborationRef.current) return
    if (!MonacoBindingRef.current) return
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

    bindingRef.current = new MonacoBindingRef.current(
      yText,
      modelRef.current,
      new Set([editor]),
      collaborationRef.current.getAwareness()
    )
  }

  useEffect(() => {
    if (!id || !user) return

    let collab: CollaborationProvider | null = null

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

        const awarenessObserver = (states: Map<number, AwarenessState>) => {
          if (!editorRef.current) return

          const newDecorations: any[] = []
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

        collab = new CollaborationProvider(
          id,
          user,
          (isConnected) => setWsConnected(isConnected),
          handleServerMessage,
          (state) => setSynced(state),
          (str) => setMarkdown(str),
          awarenessObserver
        )

        collaborationRef.current = collab
      } catch (err) {
        console.error('Init error:', err)
      }
    }

    init()

    return () => {
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
    if (!synced || !isEditorReady || !monacoReady) return
    bindMonaco()
  }, [synced, isEditorReady, monacoReady])

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

  const isReadOnly = () =>
    !isEditorReady || !synced || userRole === UserRole.Viewer

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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Back to Documents">
              <IconButton
                onClick={() => navigate('/documents')}
                sx={{ color: 'white', ml: 0, mr: 1 }}
              >
                <ArrowBackIosIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 500 }}>
              {title || 'Untitled Document'}
            </Typography>
          </Box>
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
            <CollaboratorAvatars
              currentUser={user}
              collaborators={collaborators}
            />

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
                {wsConnected ? 'Online' : 'Offline'}
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
        {(!wsConnected || !synced) && (
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
            {!wsConnected ? 'Connecting...' : !synced && 'Syncing...'}
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
          {monacoReady ? (
            <Editor
              height="100%"
              defaultLanguage="markdown"
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                readOnly: isReadOnly(),
                domReadOnly: isReadOnly(),
                minimap: { enabled: !showPreview },
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
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              Loading editor...
            </Box>
          )}
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
            <Preview md={mdParser} markdown={markdown} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

const Preview: React.FC<{ md: MarkdownIt; markdown: string }> = ({
  md,
  markdown,
}) => {
  const html = useMemo(() => {
    const rawHtml = md.render(markdown)
    return DOMPurify.sanitize(rawHtml)
  }, [md, markdown])

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className="markdown-preview"
    />
  )
}

const CollaboratorAvatars: React.FC<{
  collaborators: Record<number, UserAwareness>
  currentUser: User | null
}> = React.memo(({ collaborators, currentUser }) => {
  return (
    <AvatarGroup
      max={4}
      sx={{
        '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 14 },
      }}
    >
      {/* Show Yourself */}
      {currentUser && (
        <Tooltip title={`${currentUser.name} (You)`}>
          <Avatar {...stringAvatar(currentUser.name)} />
        </Tooltip>
      )}

      {/* Show Remote Collaborators */}
      {Object.entries(collaborators).map(([userId, collaborator]) => (
        <Tooltip key={userId} title={collaborator.name}>
          <Avatar {...stringAvatar(collaborator.name, collaborator.color)} />
        </Tooltip>
      ))}
    </AvatarGroup>
  )
})

const stringAvatar = (name: string, color?: string) => {
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
