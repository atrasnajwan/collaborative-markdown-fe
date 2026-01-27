import React, { useEffect, useState } from 'react';
import { api, Document } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
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

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocumentTitle.trim()) return;

    setIsCreating(true);
    try {
      const newDocument = await api.createDocument(newDocumentTitle);
      setDocuments([newDocument, ...documents]);
      setNewDocumentTitle('');
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  const toEditPage = (id: Number) => {
    navigate(`/documents/${id}/edit`)
  } 
  
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
                className="bg-card-bg p-6 rounded-lg shadow-lg border border-accent-primary/10 hover:border-accent-primary/30 transition-all duration-200 cursor-pointer"
                onClick={() => toEditPage(doc.id)}
              >
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
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card-bg rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Create New Document</h2>
            <form onSubmit={handleCreateDocument}>
              <input
                type="text"
                value={newDocumentTitle}
                onChange={(e) => setNewDocumentTitle(e.target.value)}
                placeholder="Document title"
                className="w-full p-2 rounded-md bg-bg-primary border border-accent-primary/20 text-text-primary mb-4"
                disabled={isCreating}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-md text-text-secondary hover:text-accent-primary transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                  disabled={isCreating || !newDocumentTitle.trim()}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents; 