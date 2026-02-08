import React, { useEffect, useRef, useState, useCallback } from 'react'
import { api, Document } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

import ShareDocumentModal from '../components/ShareDocumentModal'
import CreateDocumentModal from '../components/CreateDocumentModal'
import DocumentCard from '../components/DocumentCard'
import DeleteDialog from '../components/DeleteDialog'
import SourceIcon from '@mui/icons-material/Source'
import PeopleIcon from '@mui/icons-material/People'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import IconButton from '@mui/material/IconButton'
import { Box, Fab, useMediaQuery, useTheme } from '@mui/material'

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document>()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // view: 'my' | 'shared'
  const [view, setView] = useState<'my' | 'shared'>('my')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const [page, setPage] = useState<number>(1)
  const pageSize = 10
  const [hasMore, setHasMore] = useState<boolean>(true)
  // infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // reset when view changes
  useEffect(() => {
    setDocuments([])
    setPage(1)
    setHasMore(true)
    setError('')
    setIsLoading(true)
  }, [view])

  const fetchDocuments = useCallback(
    async (which: 'my' | 'shared' = 'my', pageToFetch = 1) => {
      if (pageToFetch === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      try {
        const response =
          which === 'shared'
            ? await api.getSharedDocuments({
                page: pageToFetch,
                per_page: pageSize,
              })
            : await api.getDocuments({ page: pageToFetch, per_page: pageSize })

        const fetched: Document[] = response.data || []
        if (pageToFetch === 1) {
          setDocuments(fetched)
        } else {
          setDocuments((prev) => [...prev, ...fetched])
        }
        // if fewer items than pageSize, no more pages
        setHasMore(fetched.length === pageSize)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load documents'
        )
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchDocuments(view, page)
  }, [fetchDocuments, page, view])

  // intersection observer to trigger loading next page
  useEffect(() => {
    if (!sentinelRef.current) return
    if (!hasMore) return

    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    }

    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting && !isLoadingMore && !isLoading) {
        setPage((prev) => prev + 1)
      }
    }, options)

    observerRef.current.observe(sentinelRef.current)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [hasMore, isLoadingMore, isLoading])

  const handleCreateDocument = async (e: React.FormEvent, title: string) => {
    e.preventDefault()

    try {
      const newDocument = await api.createDocument(title)
      // switch to my documents so user sees it
      if (view === 'shared') setView('my')

      setDocuments((prev) => [newDocument, ...prev])
      setIsCreateModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document')
    }
  }

  const toEditPage = (id: number) => {
    navigate(`/documents/${id}/edit`)
  }

  const [anchorEl, setAnchorEl] = useState<any>(null)
  const open = Boolean(anchorEl)

  const handleOpenMenu = (event: any, doc: Document) => {
    event.stopPropagation() // Prevents card's onClick
    setAnchorEl(event.currentTarget)
    setSelectedDocument(doc)
  }

  const handleCloseMenu = (event: any) => {
    if (event) event.stopPropagation()
    setAnchorEl(null)
  }

  const handleShare = (event: any) => {
    event.stopPropagation()
    setIsShareModalOpen(true)
  }

  const handleDelete = (event: any) => {
    event.stopPropagation()
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedDocument) return
    setIsDeleteLoading(true)
    try {
      await api.removeDocument(selectedDocument.id)
      const newDocuments = documents.filter(
        (doc) => doc.id !== selectedDocument.id
      )
      setDocuments(newDocuments)
      setSelectedDocument(undefined)
      setAnchorEl(null)
    } catch (err) {
      console.log(err)
    } finally {
      setIsDeleteModalOpen(false)
      setIsDeleteLoading(false)
    }
  }

  // profile menu
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const isProfileOpen = Boolean(profileAnchor)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  const handleOpenProfile = (e: React.MouseEvent<HTMLElement>) => {
    // toggle on repeated clicks
    setProfileAnchor((prev) => (prev ? null : e.currentTarget))
  }
  const handleCloseProfile = () => setProfileAnchor(null)

  // close profile menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isProfileOpen) return
    const onDown = (ev: MouseEvent) => {
      const target = ev.target as Node
      if (profileMenuRef.current?.contains(target)) return
      if (profileAnchor?.contains(target)) return
      setProfileAnchor(null)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setProfileAnchor(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isProfileOpen, profileAnchor])

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="bg-card-bg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              {/* mobile: show menu button that opens sidebar */}
              {isMobile && (
                <IconButton
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </IconButton>
              )}

              <h1 className="text-xl font-bold text-text-primary">
                {view === 'my' ? 'My Documents' : 'Shared with me'}
              </h1>
              {/* removed top links - links now only in sidebar */}
            </div>
            <div className="flex items-end">
              <div className="relative">
                <IconButton
                  onClick={handleOpenProfile}
                  size="medium"
                  title="Profile"
                  aria-haspopup="true"
                  aria-expanded={isProfileOpen ? 'true' : undefined}
                >
                  <AccountCircleIcon fontSize="large" />
                </IconButton>
                {isProfileOpen && (
                  <div
                    ref={profileMenuRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                  >
                    {/* TODO create profile edit */}
                    {/* <button
                      onClick={() => { handleCloseProfile(); navigate('/profile'); }}
                      className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100"
                    >
                      Profile
                    </button> */}
                    <button
                      onClick={() => {
                        handleCloseProfile()
                        logout()
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-card-bg p-3 shadow h-full overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Menu</h3>
              <IconButton
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close menu"
              >
                <CloseIcon />
              </IconButton>
            </div>
            <nav>
              <button
                onClick={() => {
                  setView('my')
                  setMobileSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded ${view === 'my' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-gray-50'}`}
              >
                <SourceIcon /> <span>My Documents</span>
              </button>
              <button
                onClick={() => {
                  setView('shared')
                  setMobileSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 mt-2 px-3 py-2 rounded ${view === 'shared' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-gray-50'}`}
              >
                <PeopleIcon /> <span>Shared with me</span>
              </button>
            </nav>
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex gap-6">
        {/* Left column - small nav for desktop */}
        <aside className="w-56 hidden sm:block">
          <div className="flex items-center mb-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 w-full rounded-md bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors hidden sm:inline-block"
            >
              New
            </button>
          </div>
          <div className="bg-card-bg p-3 rounded shadow">
            <nav>
              <button
                onClick={() => setView('my')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded ${view === 'my' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-gray-50'}`}
              >
                <SourceIcon /> <span>My Documents</span>
              </button>
              <button
                onClick={() => setView('shared')}
                className={`w-full flex items-center gap-3 mt-2 px-3 py-2 rounded ${view === 'shared' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-gray-50'}`}
              >
                <PeopleIcon /> <span>Shared with me</span>
              </button>
            </nav>
          </div>
        </aside>

        <section className="flex-1">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400">
              {error}
            </div>
          )}

          {documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary text-lg">
                No documents yet. Create your first one!
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onClick={toEditPage}
                    onClickMenu={handleOpenMenu}
                    onClickShare={handleShare}
                    onClickDelete={handleDelete}
                    isMenuOpen={open}
                    onCloseMenu={handleCloseMenu}
                    anchorEl={anchorEl}
                  />
                ))}
              </div>

              {/* sentinel for infinite scroll */}
              <div
                ref={sentinelRef}
                className="h-8 flex items-center justify-center mt-6"
              >
                {isLoadingMore && (
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
                )}
                {!hasMore && (
                  <p className="text-center text-sm text-text-secondary">
                    No more documents
                  </p>
                )}
              </div>
            </>
          )}
          {isMobile && view === 'my' && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
              }}
            >
              <Fab color="primary" aria-label="add">
                <AddIcon onClick={() => setIsCreateModalOpen(true)} />
              </Fab>
            </Box>
          )}
        </section>
      </main>

      {/* Create Document Modal */}
      <CreateDocumentModal
        open={isCreateModalOpen}
        handleCreateDocument={handleCreateDocument}
        onClose={async () => setIsCreateModalOpen(false)}
      />
      {selectedDocument && (
        <>
          <ShareDocumentModal
            open={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            documentId={selectedDocument?.id}
          />
          <DeleteDialog
            open={isDeleteModalOpen}
            description={`Do you really want to delete document ${selectedDocument.title}?`}
            onClose={() => setIsDeleteModalOpen(false)}
            loading={isDeleteLoading}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </div>
  )
}

export default Documents
