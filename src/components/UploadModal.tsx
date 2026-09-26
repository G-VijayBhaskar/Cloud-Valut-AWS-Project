import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Folder } from 'lucide-react';
import { api } from '../services/api';
import type { FolderItem } from '../types';

interface UploadModalProps {
  folders: FolderItem[];
  currentFolderId?: number | null;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  folders,
  currentFolderId,
  onClose,
  onUploadSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<number | null>(currentFolderId || null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadState('idle');
      setErrorMessage('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadState('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadState('uploading');
    setErrorMessage('');

    try {
      await api.uploadFile(selectedFile, targetFolderId);
      setUploadState('success');
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setUploadState('error');
      setErrorMessage(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={18} style={{ color: 'var(--accent-primary)' }} /> Upload File to CloudVault
          </h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Folder size={14} /> Destination Folder
            </label>
            <select 
              value={targetFolderId || ''} 
              onChange={(e) => setTargetFolderId(e.target.value ? Number(e.target.value) : null)}
              className="form-select"
            >
              <option value="">Root (No Folder)</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragOver ? 'var(--accent-primary)' : 'var(--border-color-hover)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.05)' : '#0d1322',
              transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              style={{ display: 'none' }} 
            />
            <Upload size={32} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {selectedFile ? selectedFile.name : 'Click to select or drag and drop a file'}
            </p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Supports images, documents, archives, code files'}
            </span>
          </div>

          {uploadState === 'uploading' && (
            <div className="alert" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #60a5fa', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
              Uploading file to Amazon S3 & storing metadata...
            </div>
          )}

          {uploadState === 'success' && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} /> Upload complete! File saved successfully.
            </div>
          )}

          {uploadState === 'error' && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> Upload failed: {errorMessage}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading || uploadState === 'success'}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
};
