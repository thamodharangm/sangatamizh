
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, HardDrive, Terminal, Table, Play, 
  Trash2, Plus, RefreshCw, Layers, Folder, File, Upload,
  ChevronRight, ChevronDown, Check, X, Search
} from 'lucide-react';
import './SupabaseDashboard.css'; // We'll need some CSS

const API_URL = 'http://localhost:3002/api/supabase';

const SupabaseDashboard = ({ onClose, embedded = false }) => {
  const [activeTab, setActiveTab] = useState('sql'); // sql, tables, storage
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const Content = (
    <div className={embedded ? "supabase-dashboard-embedded" : "supabase-dashboard-container"}>
      {/* Header - Only show if not embedded or if we want a title */}
      {!embedded && (
        <div className="dashboard-header">
          <div className="header-title">
            <Database size={24} color="#3ECF8E" /> 
            <h2>Supabase Manager</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
      )}

      {/* Sidebar & Content Layout */}
      <div className="dashboard-body">
        <div className="dashboard-sidebar">
          <button 
            className={`sidebar-item ${activeTab === 'sql' ? 'active' : ''}`}
            onClick={() => setActiveTab('sql')}
          >
            <Terminal size={18} /> SQL Editor
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'tables' ? 'active' : ''}`}
            onClick={() => setActiveTab('tables')}
          >
            <Table size={18} /> Table Editor
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveTab('storage')}
          >
            <HardDrive size={18} /> Storage
          </button>
        </div>

        <div className="dashboard-content">
          <AnimatePresence mode="wait">
            {activeTab === 'sql' && <SQLEditor key="sql" apiUrl={API_URL} showNotification={showNotification} />}
            {activeTab === 'tables' && <TableEditor key="tables" apiUrl={API_URL} showNotification={showNotification} />}
            {activeTab === 'storage' && <StorageManager key="storage" apiUrl={API_URL} showNotification={showNotification} />}
          </AnimatePresence>
        </div>
      </div>
      
      {notification && (
        <div className={`notification-toast ${notification.type}`} style={embedded ? {position: 'absolute', bottom: '20px', right: '20px'} : {}}>
          {notification.msg}
        </div>
      )}
    </div>
  );

  if (embedded) return Content;

  return (
    <div className="supabase-dashboard-overlay">
      {Content}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS (Will be fleshed out)
// ============================================================================

const SQLEditor = ({ apiUrl, showNotification }) => {
  const [query, setQuery] = useState('SELECT * FROM songs LIMIT 10;');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [executing, setExecuting] = useState(false);

  const executeQuery = async () => {
    setExecuting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${apiUrl}/sql/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Execution failed');
      
      setResult(data.data);
      showNotification('Query executed successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="tab-content"
    >
      <div className="sql-toolbar">
        <h3>SQL Query</h3>
        <button className="btn-primary" onClick={executeQuery} disabled={executing}>
          <Play size={16} fill="white" /> {executing ? 'Running...' : 'Run'}
        </button>
      </div>
      <div className="sql-editor-wrapper">
        <textarea 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sql-textarea"
          spellCheck="false"
        />
      </div>
      
      {error && (
        <div className="sql-error">
          <Terminal size={16} /> <span>{error}</span>
        </div>
      )}

      {result !== null && (
        <div className="sql-results">
           <h4>Results ({Array.isArray(result) ? result.length : 0} rows)</h4>
           <div className="table-responsive">
             {Array.isArray(result) && result.length > 0 ? (
               <table>
                 <thead>
                   <tr>
                     {Object.keys(result[0]).map(key => <th key={key}>{key}</th>)}
                   </tr>
                 </thead>
                 <tbody>
                   {result.map((row, i) => (
                     <tr key={i}>
                       {Object.values(row).map((val, j) => (
                         <td key={j}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             ) : (
               <p className="no-data">No data returned or empty result set.</p>
             )}
           </div>
        </div>
      )}
    </motion.div>
  );
};

const TableEditor = ({ apiUrl, showNotification }) => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch(`${apiUrl}/tables`);
      const data = await res.json();
      if (data.tables) setTables(data.tables.map(t => t.table_name));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTableData = async (tableName) => {
    setLoading(true);
    setSelectedTable(tableName);
    try {
      const res = await fetch(`${apiUrl}/tables/${tableName}/data?limit=50`);
      const data = await res.json();
      /* data: { success, data: [...], count, limit, offset } */
      if (data.success) {
        setTableData(data.data);
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to fetch table data', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="tab-content split-view"
    >
      <div className="split-sidebar">
        <h4>Tables</h4>
        <div className="list-group">
          {tables.map(table => (
            <div 
              key={table} 
              className={`list-item ${selectedTable === table ? 'active' : ''}`}
              onClick={() => fetchTableData(table)}
            >
              <Table size={14} /> {table}
            </div>
          ))}
        </div>
      </div>
      <div className="split-main">
        {selectedTable ? (
           <>
             <div className="toolbar">
               <h3>{selectedTable}</h3>
               <button className="btn-icon" onClick={() => fetchTableData(selectedTable)} disabled={loading}>
                 <RefreshCw size={16} className={loading ? 'spin' : ''} />
               </button>
             </div>
             <div className="table-responsive full-height">
               {tableData.length > 0 ? (
                 <table>
                   <thead>
                     <tr>
                       {Object.keys(tableData[0]).map(k => <th key={k}>{k}</th>)}
                     </tr>
                   </thead>
                   <tbody>
                     {tableData.map((row, i) => (
                       <tr key={i}>
                         {Object.values(row).map((v, j) => (
                           <td key={j} className="truncate-cell">
                             {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : (
                 <div className="empty-state">No records found</div>
               )}
             </div>
           </>
        ) : (
          <div className="empty-state">Select a table to view data</div>
        )}
      </div>
    </motion.div>
  );
};

const StorageManager = ({ apiUrl, showNotification }) => {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBuckets();
  }, []);

  const fetchBuckets = async () => {
    try {
      const res = await fetch(`${apiUrl}/storage/buckets`);
      const data = await res.json();
      if (data.buckets) setBuckets(data.buckets);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFiles = async (bucketName) => {
    setLoading(true);
    setSelectedBucket(bucketName);
    try {
      const res = await fetch(`${apiUrl}/storage/${bucketName}/files`);
      const data = await res.json();
      if (data.files) setFiles(data.files);
    } catch (err) {
      console.error(err);
      showNotification('Failed to fetch files', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileName) => {
    if (!window.confirm(`Delete ${fileName}?`)) return;
    
    try {
      const res = await fetch(`${apiUrl}/storage/${selectedBucket}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fileName })
      });
      
      if (res.ok) {
        showNotification('File deleted');
        fetchFiles(selectedBucket);
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };
  
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedBucket) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', file.name); // Simple upload to root
    
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/storage/${selectedBucket}/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        showNotification('File uploaded successfully');
        fetchFiles(selectedBucket);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="tab-content split-view"
    >
      <div className="split-sidebar">
        <h4>Buckets</h4>
        <div className="list-group">
          {buckets.map(bucket => (
            <div 
              key={bucket.id} 
              className={`list-item ${selectedBucket === bucket.name ? 'active' : ''}`}
              onClick={() => fetchFiles(bucket.name)}
            >
              <Layers size={14} /> {bucket.name}
            </div>
          ))}
        </div>
      </div>
      <div className="split-main">
        {selectedBucket ? (
          <>
            <div className="toolbar">
              <h3>{selectedBucket}</h3>
              <div className="actions">
                <input 
                  type="file" 
                  id="file-upload" 
                  style={{ display: 'none' }} 
                  onChange={handleUpload}
                />
                <label htmlFor="file-upload" className="btn-secondary btn-sm">
                   <Upload size={14} /> Upload
                </label>
                <button className="btn-icon" onClick={() => fetchFiles(selectedBucket)}>
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
              </div>
            </div>
            
            <div className="file-grid">
              {files.map(file => (
                <div key={file.id} className="file-card">
                  <div className="file-icon">
                    {file.metadata?.mimetype?.startsWith('image/') ? (
                      <img src={file.publicUrl} alt={file.name} loading="lazy" />
                    ) : (
                      <File size={32} strokeWidth={1} />
                    )}
                  </div>
                  <div className="file-info">
                    <div className="file-name" title={file.name}>{file.name}</div>
                    <div className="file-meta">
                      {(file.metadata?.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button className="delete-btn" onClick={() => handleDelete(file.name)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {files.length === 0 && !loading && (
                 <div className="empty-state">Bucket is empty</div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">Select a bucket to view files</div>
        )}
      </div>
    </motion.div>
  );
};

export default SupabaseDashboard;
