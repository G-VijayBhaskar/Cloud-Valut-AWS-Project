import React, { useEffect, useState } from 'react';
import { Folder, FolderPlus, Edit2, Trash2, FileText } from 'lucide-react';
import { api } from '../services/api';
import type { FolderItem } from '../types';
import { FolderModal } from '../components/FolderModal';

export const Folders: React.FC = () => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);

  const loadFolders = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFolders();
      setFolders(data);
    } catch (err) {
      console.error('Failed to load folders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleOpenCreate = () => {
    setEditingFolder(null);
    setShowFolderModal(true);
  };

  const handleOpenRename = (folder: FolderItem) => {
    setEditingFolder(folder);
    setShowFolderModal(true);
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (window.confirm('Delete this folder? Files inside will be moved to Root.')) {
      try {
        await api.deleteFolder(folderId);
        loadFolders();
      } catch (err: any) {
        alert(`Failed to delete folder: ${err.message}`);
      }
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Folders</h1>
          <p className="page-subtitle">Organize your cloud files into custom directories.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <FolderPlus size={18} /> New Folder
        </button>
      </div>

      {/* Folder Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading folders...
        </div>
      ) : folders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Folder size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>No folders created yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Create folders to keep your uploaded files organized.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <FolderPlus size={18} /> Create Your First Folder
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {folders.map(folder => (
            <div key={folder.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Folder size={22} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenRename(folder)}
                      title="Rename folder"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteFolder(folder.id)}
                      title="Delete folder"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  {folder.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={14} /> {folder.file_count ?? 0} files
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Created {new Date(folder.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showFolderModal && (
        <FolderModal 
          folderToEdit={editingFolder}
          onClose={() => setShowFolderModal(false)}
          onSuccess={loadFolders}
        />
      )}
    </div>
  );
};
