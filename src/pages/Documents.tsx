import React, { useEffect, useState } from 'react';
import { api, Collaborator, Document, User } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ShareDocumentModal from '../components/ShareDocumentModal';
import CreateDocumentModal from '../components/CreateDocumentModal';
import { red } from '@mui/material/colors';

interface DocumentCollaborator extends Document {
  collaborators?: Collaborator[]
}
const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentCollaborator>()
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);


  const fetchDocuments = async () => {
    try {
      const response = await api.getDocuments();
      setDocuments(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent, title: string) => {
    e.preventDefault();

    try {
      const newDocument = await api.createDocument(title);
      setDocuments([newDocument, ...documents]);
      // setNewDocumentTitle('');
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
    } 
  };

  const toEditPage = (id: Number) => {
    navigate(`/documents/${id}/edit`)
  } 
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: any, doc: Document) => {
    event.stopPropagation(); // Prevents card's onClick
    setAnchorEl(event.currentTarget);
    setSelectedDocument(doc)
  };

  const handleCloseMenu = (event: any) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const handleShare = (event: any) => {
    event.stopPropagation();
    setIsShareModalOpen(true)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="bg-card-bg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-text-primary">My Documents</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-md bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors mr-4"
              >
                New Document
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-md text-text-secondary hover:text-accent-primary transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400">
            {error}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">No documents yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="relative bg-card-bg p-6 rounded-lg shadow-lg border border-accent-primary/10 hover:border-accent-primary/30 transition-all duration-200 cursor-pointer"
                onClick={() => toEditPage(doc.id)}
              >
                <div className="absolute top-4 right-2">
                  <IconButton 
                    onClick={(e) => handleOpenMenu(e, doc)}
                    size="small"
                    sx={{ color: 'var(--text-secondary)' }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                  
                  <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleCloseMenu}
                    onClick={(e) => e.stopPropagation()} // Stop menu clicks from bubbling
                  >
                    <MenuItem onClick={handleShare}>
                      <PersonAddAltIcon fontSize='small'sx={{ mr: 1 }} /> Share
                    </MenuItem>
                    <MenuItem onClick={handleShare} sx={{ color: red[500] }} >
                      <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                    </MenuItem>
                  </Menu>
              </div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">{doc.title}</h2>
                <p className="text-text-secondary mb-4 line-clamp-2">{}</p>
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Created: {new Date(doc.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(doc.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Document Modal */}
      <CreateDocumentModal
        open={isCreateModalOpen}
        handleCreateDocument={handleCreateDocument}
        onClose={async () => setIsCreateModalOpen(false)}
      />
      <ShareDocumentModal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        documentId={selectedDocument?.id}
      />
    </div>
  );
};

export default Documents; 