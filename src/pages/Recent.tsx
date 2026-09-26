import React, { useEffect, useState } from 'react';
import { Clock, FileText, Download, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import type { FileItem } from '../types';

export const Recent: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecentFiles = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFiles({ is_deleted: false, sort_by: 'date' });
      setFiles(data);
    } catch (err) {
      console.error('Failed to load recent files', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (file: FileItem) => {
    try {
      await api.downloadFile(file.id, file.filename);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (window.confirm('Move file to trash?')) {
      try {
        await api.deleteFile(fileId);
        loadRecentFiles();
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={24} style={{ color: 'var(--accent-primary)' }} /> Recent Files
          </h1>
          <p className="page-subtitle">Your most recently uploaded and accessed files.</p>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading recent files...
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No recent files available.
                </td>
              </tr>
            ) : (
              files.map(file => (
                <tr key={file.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontWeight: '500' }}>{file.filename}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple">{file.mime_type.split('/')[1] || file.mime_type}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatBytes(file.size)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    {new Date(file.created_at).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(file)}>
                        <Download size={14} /> Download
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(file.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
