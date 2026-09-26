import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Download, 
  Edit2, 
  Trash2, 
  Plus, 
  Filter, 
  ArrowUpDown, 
  Folder as FolderIcon 
} from 'lucide-react';
import { api } from '../services/api';
import type { FileItem, FolderItem } from '../types';
import { UploadModal } from '../components/UploadModal';

export const MyFiles: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') || '';

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Rename State Modal / Prompt
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const loadFilesAndFolders = async () => {
    setIsLoading(true);
    try {
      const [filesData, foldersData] = await Promise.all([
        api.getFiles({
          search: searchQuery,
          is_deleted: false,
          folder_id: selectedFolderId,
          sort_by: sortBy
        }),
        api.getFolders()
      ]);
      setFiles(filesData);
      setFolders(foldersData);
    } catch (err) {
      console.error('Failed to fetch files', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFilesAndFolders();
  }, [searchQuery, selectedFolderId, sortBy]);

  useEffect(() => {
    setSearchQuery(searchFromUrl);
  }, [searchFromUrl]);

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
    if (window.confirm('Move this file to trash?')) {
      try {
        await api.deleteFile(fileId);
        loadFilesAndFolders();
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleOpenRename = (file: FileItem) => {
    setRenamingFile(file);
    setNewFileName(file.filename);
  };

  const handleSaveRename = async () => {
    if (!renamingFile || !newFileName.trim()) return;
    try {
      await api.updateFile(renamingFile.id, { filename: newFileName.trim() });
      setRenamingFile(null);
      loadFilesAndFolders();
    } catch (err: any) {
      alert(`Rename failed: ${err.message}`);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Files</h1>
          <p className="page-subtitle">View, search, download, rename, and manage all your cloud files.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Plus size={18} /> Upload File
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px', height: '38px', fontSize: '0.875rem' }}
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Folder Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select 
            className="form-select" 
            style={{ height: '38px', fontSize: '0.875rem', width: 'auto', minWidth: '160px' }}
            value={selectedFolderId === null ? '' : selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All Folders</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Sort selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpDown size={16} style={{ color: 'var(--text-muted)' }} />
          <select 
            className="form-select"
            style={{ height: '38px', fontSize: '0.875rem', width: 'auto' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>
      </div>

      {/* Files Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Folder</th>
              <th>Updated</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading files from S3 and MySQL...
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No files found. {searchQuery ? 'Try clearing your search query.' : 'Click "Upload File" to add files.'}
                </td>
              </tr>
            ) : (
              files.map(file => {
                const folderName = folders.find(f => f.id === file.folder_id)?.name || 'Root';
                return (
                  <tr key={file.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FileText size={18} />
                        </div>
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          {file.filename}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {file.mime_type.split('/')[1] || file.mime_type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatBytes(file.size)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        <FolderIcon size={14} /> {folderName}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleDownload(file)}
                          title="Download from S3"
                        >
                          <Download size={14} /> Download
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleOpenRename(file)}
                          title="Rename"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDelete(file.id)}
                          title="Move to Trash"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal 
          folders={folders}
          currentFolderId={selectedFolderId}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={loadFilesAndFolders}
        />
      )}

      {/* Rename File Modal */}
      {renamingFile && (
        <div className="modal-overlay" onClick={() => setRenamingFile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Rename File</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">File Name</label>
                <input 
                  type="text"
                  className="form-input"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRenamingFile(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRename}>Save Name</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
