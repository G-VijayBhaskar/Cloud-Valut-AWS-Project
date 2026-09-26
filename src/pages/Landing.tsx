import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, HardDrive, FolderCheck, BarChart3, ArrowRight } from 'lucide-react';
import { CloudVaultLogo } from '../components/CloudVaultLogo';

export const Landing: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Public Navbar */}
      <header style={{
        height: '70px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 3rem',
        backgroundColor: 'var(--bg-sidebar)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CloudVaultLogo size={36} />
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>CloudVault</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" className="btn btn-secondary">
            Login
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 5rem auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: '#60a5fa',
            fontSize: '0.825rem',
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}>
            <CloudVaultLogo size={16} /> Production Ready AWS & FastAPI Cloud Architecture
          </div>

          <h1 style={{ fontSize: '3.25rem', fontWeight: '800', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            Simple and secure <br />
            <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              cloud file storage.
            </span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Upload, organize and access your files from anywhere. Powered by React, FastAPI, MySQL, and Amazon S3.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Login to Account
            </Link>
          </div>
        </div>

        {/* Feature Cards Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Secure Authentication</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              JWT token authentication with bcrypt password hashing. User role isolation enforced on FastAPI backend endpoints.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <HardDrive size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Cloud File Storage</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Direct integration with AWS S3 using boto3. Store binary objects securely in the cloud with MySQL metadata indexing.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <FolderCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Folder Organization</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Create folders, categorize files, move files across directories, and rename items with instant updates.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <BarChart3 size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Storage Tracking</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Real-time calculation of used storage, remaining space, total quotas, and user activity audit logging.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '2rem 3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        CloudVault &copy; {new Date().getFullYear()} — Personal Cloud Storage built with React, FastAPI, MySQL & AWS S3.
      </footer>
    </div>
  );
};
