import React, { useEffect, useRef, useState, useCallback } from 'react'
import { api, Document } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Fab,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import SourceIcon from '@mui/icons-material/Source'
import PeopleIcon from '@mui/icons-material/People'
import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'

import ShareDocumentModal from '../components/ShareDocumentModal'
import CreateDocumentModal from '../components/CreateDocumentModal'
import DocumentCard from '../components/DocumentCard'
import DeleteDialog from '../components/DeleteDialog'
import { useNotification } from '../contexts/NotificationContext'

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document>()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const { showNotification } = useNotification()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [view, setView] = useState<'my' | 'shared'>('my')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const [page, setPage] = useState<number>(1)
  const pageSize = 10
  const [hasMore, setHasMore] = useState<boolean>(true)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const isProfileOpen = Boolean(profileAnchor)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const isMenuOpen = Boolean(menuAnchor)

  useEffect(() => {
    setDocuments([])
    setPage(1)
    setHasMore(true)
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

        setHasMore(fetched.length === pageSize)
        setPage(pageToFetch)
      } catch (err) {
        showNotification(err, 'error')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchDocuments(view, 1)
  }, [view, fetchDocuments])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchDocuments(view, page + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoadingMore, isLoading, view, page, fetchDocuments])

  const handleCreateDocument = async (e: React.FormEvent, title: string) => {
    e.preventDefault()
    try {
      const newDocument = await api.createDocument(title)
      if (view === 'shared') setView('my')
      setDocuments((prev) => [newDocument, ...prev])
      setIsCreateModalOpen(false)
      showNotification('Successfully create new document', 'success')
    } catch (err) {
      showNotification(err, 'error')
    }
  }

  const toEditPage = (id: number) => {
    navigate(`/documents/${id}/edit`)
  }

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    doc: Document
  ) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setSelectedDocument(doc)
  }

  const handleCloseMenu = () => setMenuAnchor(null)

  const handleShare = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setIsShareModalOpen(true)
    handleCloseMenu()
  }

  const handleDelete = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setIsDeleteModalOpen(true)
    handleCloseMenu()
  }

  const handleConfirmDelete = async () => {
    if (!selectedDocument) return
    setIsDeleteLoading(true)
    try {
      await api.deleteDocument(selectedDocument.id)
      setDocuments((prev) => prev.filter((d) => d.id !== selectedDocument.id))
      setIsDeleteModalOpen(false)
      setSelectedDocument(undefined)
      showNotification('Succesfully delete document', 'success')
    } catch (err) {
      showNotification(err, 'error')
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const handleOpenProfile = (e: React.MouseEvent<HTMLElement>) =>
    setProfileAnchor((prev) => (prev ? null : e.currentTarget))

  const handleCloseProfile = () => setProfileAnchor(null)

  if (isLoading && page === 1) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  const drawerContent = (
    <Box sx={{ width: 280, p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">Menu</Typography>
        <IconButton onClick={() => setMobileDrawerOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ my: 2 }} />
      <List>
        <ListItemButton
          selected={view === 'my'}
          onClick={() => {
            setView('my')
            setMobileDrawerOpen(false)
          }}
        >
          <ListItemIcon>
            <SourceIcon />
          </ListItemIcon>
          <ListItemText primary="My Documents" />
        </ListItemButton>
        <ListItemButton
          selected={view === 'shared'}
          onClick={() => {
            setView('shared')
            setMobileDrawerOpen(false)
          }}
        >
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Shared with me" />
        </ListItemButton>
      </List>
    </Box>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            {view === 'my' ? 'My Documents' : 'Shared with me'}
          </Typography>
          <IconButton
            onClick={handleOpenProfile}
            color="inherit"
            title="Profile"
            aria-haspopup="true"
            aria-expanded={isProfileOpen ? 'true' : undefined}
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            anchorEl={profileAnchor}
            open={isProfileOpen}
            onClose={handleCloseProfile}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem
              onClick={() => {
                handleCloseProfile()
                logout()
              }}
            >
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box
            sx={{
              width: 280,
              p: 2,
              borderRight: '1px solid',
              borderColor: 'divider',
              overflowY: 'auto',
            }}
          >
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => setIsCreateModalOpen(true)}
              sx={{ mb: 2 }}
            >
              New Document
            </Button>
            <List>
              <ListItemButton
                selected={view === 'my'}
                onClick={() => setView('my')}
              >
                <ListItemIcon>
                  <SourceIcon />
                </ListItemIcon>
                <ListItemText primary="My Documents" />
              </ListItemButton>
              <ListItemButton
                selected={view === 'shared'}
                onClick={() => setView('shared')}
              >
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Shared with me" />
              </ListItemButton>
            </List>
          </Box>
        )}

        {/* Main Content Area */}
        <Container maxWidth="lg" sx={{ py: 4, flex: 1, overflowY: 'auto' }}>
          {documents.length === 0 && !isLoading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" color="text.secondary">
                No documents yet. Create your first one!
              </Typography>
              {!isMobile && view === 'my' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  sx={{ mt: 3 }}
                >
                  Create Document
                </Button>
              )}
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  },
                  gap: 3,
                }}
              >
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    user={user}
                    onClick={toEditPage}
                    onClickMenu={handleOpenMenu}
                    onClickShare={handleShare}
                    onClickDelete={handleDelete}
                    isMenuOpen={isMenuOpen}
                    onCloseMenu={handleCloseMenu}
                    anchorEl={menuAnchor}
                  />
                ))}
              </Box>

              {/* Infinite Scroll Sentinel */}
              <Box
                ref={sentinelRef}
                sx={{ py: 4, display: 'flex', justifyContent: 'center' }}
              >
                {isLoadingMore && <CircularProgress size={32} />}
                {!hasMore && documents.length > 0 && (
                  <Typography color="text.secondary">
                    No more documents
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Container>
      </Box>

      {/* Floating Action Button (Mobile) */}
      {isMobile && view === 'my' && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setIsCreateModalOpen(true)}
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Modals */}
      <CreateDocumentModal
        open={isCreateModalOpen}
        handleCreateDocument={handleCreateDocument}
        onClose={() => setIsCreateModalOpen(false)}
      />
      {selectedDocument && (
        <>
          <ShareDocumentModal
            open={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            documentId={selectedDocument.id}
            onNotification={showNotification}
          />
          <DeleteDialog
            open={isDeleteModalOpen}
            description={`Do you really want to delete document "${selectedDocument.title}"?`}
            onClose={() => setIsDeleteModalOpen(false)}
            loading={isDeleteLoading}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </Box>
  )
}

export default Documents
