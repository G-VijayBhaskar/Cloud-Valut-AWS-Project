import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { api } from '../services/api';
import type { FolderItem } from '../types';

interface FolderModalProps {
  folderToEdit?: FolderItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  folderToEdit,
  onClose,
  onSuccess
}) => {
  const [folderName, setFolderName] = useState(folderToEdit ? folderToEdit.name : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (folderToEdit) {
        await api.updateFolder(folderToEdit.id, folderName.trim());
      } else {
        await api.createFolder(folderName.trim());
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderPlus size={18} style={{ color: 'var(--accent-primary)' }} />
              {folderToEdit ? 'Rename Folder' : 'Create New Folder'}
            </h3>
            <button 
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            
            <div className="form-group">
              <label className="form-label">Folder Name</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. Documents, Resumes, Project Artifacts"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!folderName.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : folderToEdit ? 'Rename' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
