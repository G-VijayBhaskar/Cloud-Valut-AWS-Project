import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  HardDrive, 
  Download, 
  Trash2, 
  Folder, 
  Clock, 
  Activity,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import type { FileItem, FolderItem, StorageStats, ActivityLog } from '../types';
import { UploadModal } from '../components/UploadModal';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [storageData, filesData, foldersData, activityData] = await Promise.all([
        api.getStorageStats(),
        api.getFiles({ is_deleted: false, sort_by: 'date' }),
        api.getFolders(),
        api.getActivity(10)
      ]);
      setStats(storageData);
      setRecentFiles(filesData.slice(0, 5));
      setFolders(foldersData);
      setActivities(activityData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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
      loadDashboardData();
    } catch (err: any) {
      alert(`Download error: ${err.message}`);
    }
  };

  const handleDelete = async (fileId: number) => {
    try {
      await api.deleteFile(fileId);
      loadDashboardData();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const usedPercentage = stats 
    ? Math.min(100, Math.round((stats.used_storage / stats.total_storage) * 100))
    : 0;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back. Manage your files and track your storage status.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Plus size={18} /> Upload New File
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Total Files</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {isLoading ? '...' : stats?.file_count ?? 0}
          </p>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Active files stored</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Storage Used</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={18} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {isLoading ? '...' : formatBytes(stats?.used_storage ?? 0)}
          </p>
          <div style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${usedPercentage}%` }}></div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
              {usedPercentage}% of {formatBytes(stats?.total_storage ?? 10737418240)}
            </span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Storage Remaining</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={18} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {isLoading ? '...' : formatBytes(stats?.remaining_storage ?? 0)}
          </p>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Free space available</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Total Folders</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Folder size={18} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {isLoading ? '...' : folders.length}
          </p>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Custom folder categories</span>
        </div>
      </div>

      {/* Main Content Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Recent Files Table */}
        <div style={{ flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>Recent Uploads</h2>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No files uploaded yet. Click "Upload New File" to get started.
                    </td>
                  </tr>
                ) : (
                  recentFiles.map(file => (
                    <tr key={file.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                          <span style={{ fontWeight: '500' }}>{file.filename}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatBytes(file.size)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        {new Date(file.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => handleDownload(file)}
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => handleDelete(file.id)}
                            title="Delete"
                          >
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

        {/* Activity Feed */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} style={{ color: 'var(--accent-purple)' }} /> Recent Activity
            </h2>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            {activities.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                No recent activity recorded.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activities.map(act => (
                  <div key={act.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <Clock size={14} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.675rem' }}>{act.action}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {act.details || act.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal 
          folders={folders} 
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={loadDashboardData}
        />
      )}
    </div>
  );
};
