import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw, FileText, AlertTriangle, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { FileItem } from '../types';

export const Trash: React.FC = () => {
  const [deletedFiles, setDeletedFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for Permanent Delete Confirmation
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadTrashFiles = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFiles({ is_deleted: true });
      setDeletedFiles(data);
    } catch (err) {
      console.error('Failed to load trash files', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrashFiles();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRestore = async (fileId: number) => {
    try {
      await api.restoreFile(fileId);
      setToastMessage('File restored successfully.');
      setTimeout(() => setToastMessage(null), 3000);
      loadTrashFiles();
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    }
  };

  const handleOpenPermanentDeleteModal = (file: FileItem) => {
    setFileToDelete(file);
    setModalError(null);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    setModalError(null);

    try {
      await api.deleteFilePermanent(fileToDelete.id);
      
      // Success handling
      setFileToDelete(null);
      setToastMessage('File permanently deleted.');
      setTimeout(() => setToastMessage(null), 3500);
      loadTrashFiles();
    } catch (err: any) {
      setModalError(err.message || 'Unable to permanently delete the file. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trash2 size={24} style={{ color: 'var(--danger)' }} /> Trash & Soft Delete
          </h1>
          <p className="page-subtitle">Items in trash can be restored or permanently removed from storage.</p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', animation: 'bannerSlide 0.3s ease' }}>
          <CheckCircle2 size={18} /> {toastMessage}
        </div>
      )}

      <div className="alert" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <AlertTriangle size={18} /> Soft deleted files do not count towards your active storage usage calculation.
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Deleted Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading trash...
                </td>
              </tr>
            ) : deletedFiles.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Trash is empty. No deleted files found.
                </td>
              </tr>
            ) : (
              deletedFiles.map(file => (
                <tr key={file.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={18} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: '500', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                        {file.filename}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                      {file.mime_type.split('/')[1] || file.mime_type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatBytes(file.size)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    {new Date(file.updated_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRestore(file.id)}
                        title="Restore file"
                      >
                        <RotateCcw size={14} /> Restore File
                      </button>

                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleOpenPermanentDeleteModal(file)}
                        title="Delete permanently from S3 & Database"
                      >
                        <Trash2 size={14} /> Delete Permanently
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Permanent Deletion */}
      {fileToDelete && (
        <div className="modal-overlay" onClick={() => !isDeleting && setFileToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                <Trash2 size={20} /> Delete file permanently?
              </h3>
              <button 
                onClick={() => !isDeleting && setFileToDelete(null)} 
                disabled={isDeleting}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {modalError && (
                <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertCircle size={16} /> {modalError}
                </div>
              )}

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
                This action cannot be undone. The file <strong style={{ color: 'var(--text-primary)' }}>"{fileToDelete.filename}"</strong> and its stored data in Amazon S3 will be permanently deleted.
              </p>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmPermanentDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting Permanently...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
