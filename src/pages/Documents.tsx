import React, { useEffect, useState } from 'react';
import { api, Collaborator, Document } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import ShareDocumentModal from '../components/ShareDocumentModal';
import CreateDocumentModal from '../components/CreateDocumentModal';
import DocumentCard from '../components/DocumentCard';
import DeleteDialog from '../components/DeleteDialog';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document>()
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  const handleDelete = (event: any) => {
    event.stopPropagation();
    setIsDeleteModalOpen(true)
  };


  const handleConfirmDelete = async () => {
    if (!selectedDocument) return
    setIsDeleteLoading(true)
            try {
              await api.removeDocument(selectedDocument.id)
              const newDocuments = documents.filter(doc => doc.id !== selectedDocument.id)
              setDocuments(newDocuments);
              setSelectedDocument(undefined)
              setAnchorEl(null);
            } catch(err) {
              console.log(err)
            } finally {
              setIsDeleteModalOpen(false)
              setIsDeleteLoading(false)
            }
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
        )}
      </main>

      {/* Create Document Modal */}
      <CreateDocumentModal
        open={isCreateModalOpen}
        handleCreateDocument={handleCreateDocument}
        onClose={async () => setIsCreateModalOpen(false)}
      />
      {
        selectedDocument && (
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
        )
      }
    </div>
  );
};

export default Documents; 