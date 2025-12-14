import { useState } from 'react';
import api from '../config/api';

// Mobile-optimized Database Test Page
const TestDB = () => {
  const [supabaseStatus, setSupabaseStatus] = useState('Not tested');
  const [prismaStatus, setPrismaStatus] = useState('Not tested');
  const [loading, setLoading] = useState(false);

  const testSupabase = async () => {
    setLoading(true);
    try {
      const response = await api.get('/test-supabase');
      setSupabaseStatus(response.data.message || 'Connected ✅');
    } catch (error) {
      setSupabaseStatus(`Error: ${error.message} ❌`);
    } finally {
      setLoading(false);
    }
  };

  const testPrisma = async () => {
    setLoading(true);
    try {
      const response = await api.get('/test-prisma');
      setPrismaStatus(response.data.message || 'Connected ✅');
    } catch (error) {
      setPrismaStatus(`Error: ${error.message} ❌`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-db-page">
      <h1 className="mb-3">Database Connection Test</h1>

      <div className="card-flat mb-2">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Supabase Connection</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          Status: {supabaseStatus}
        </p>
        <button 
          className="btn-primary" 
          onClick={testSupabase} 
          disabled={loading}
          style={{ fontSize: '0.8rem', padding: '0.6rem 1.2rem' }}
        >
          {loading ? 'Testing...' : 'Test Supabase'}
        </button>
      </div>

      <div className="card-flat">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Prisma Connection</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          Status: {prismaStatus}
        </p>
        <button 
          className="btn-primary" 
          onClick={testPrisma} 
          disabled={loading}
          style={{ fontSize: '0.8rem', padding: '0.6rem 1.2rem' }}
        >
          {loading ? 'Testing...' : 'Test Prisma'}
        </button>
      </div>
    </div>
  );
};

export default TestDB;
