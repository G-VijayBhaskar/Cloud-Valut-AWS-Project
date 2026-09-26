import React, { useEffect, useState } from 'react';
import { Terminal, Server, Database, HardDrive, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { DeveloperStatus } from '../types';

export const DeveloperStatusPage: React.FC = () => {
  const [status, setStatus] = useState<DeveloperStatus | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        const data = await api.getDeveloperStatus();
        setStatus(data);
      } catch (err: any) {
        setError(err.message || 'Access denied or failed to load developer diagnostics.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#c084fc' }}>
            <Terminal size={26} /> Developer Status & Diagnostics
          </h1>
          <p className="page-subtitle">Internal operational status metrics for backend API, MySQL database, and AWS S3 storage.</p>
        </div>
        <span className="badge badge-purple" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
          <ShieldCheck size={14} /> Developer Role Authenticated
        </span>
      </div>

      {error ? (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1.5rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      ) : isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading developer system diagnostics...
        </div>
      ) : (
        <>
          {/* Status Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>API Status</span>
                <Server size={18} style={{ color: 'var(--success)' }} />
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }}></span>
                {status?.api_status}
              </p>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Version: {status?.api_version}
              </span>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Database</span>
                <Database size={18} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {status?.database_status}
              </p>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Engine: MySQL / SQLAlchemy ORM
              </span>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Cloud Storage</span>
                <HardDrive size={18} style={{ color: 'var(--accent-purple)' }} />
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {status?.storage_provider}
              </p>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Provider: Amazon Web Services S3
              </span>
            </div>
          </div>

          {/* System Totals Card */}
          <div className="card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              System Metrics Aggregation
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#0d1322', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total System Users</span>
                <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {status?.total_users}
                </p>
              </div>

              <div style={{ backgroundColor: '#0d1322', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Files Stored</span>
                <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {status?.total_files}
                </p>
              </div>

              <div style={{ backgroundColor: '#0d1322', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Global S3 Storage Consumption</span>
                <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#c084fc', marginTop: '0.25rem' }}>
                  {formatBytes(status?.total_storage_used || 0)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
