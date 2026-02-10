/**
 * Supabase Admin Controller
 * Endpoints for SQL and Storage management
 */

import * as supabaseAdmin from '../services/supabase.admin.service.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

// ============================================================
//                    SQL OPERATIONS
// ============================================================

/**
 * GET /api/supabase/tables
 * List all tables
 */
export const listTables = async (req, res) => {
    try {
        const result = await supabaseAdmin.getTables();
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ tables: result.tables });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/supabase/tables/:tableName/schema
 * Get table schema
 */
export const getTableSchema = async (req, res) => {
    try {
        const { tableName } = req.params;
        const result = await supabaseAdmin.getTableSchema(tableName);
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ schema: result.schema });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/supabase/tables/:tableName/data
 * Get table data with pagination
 */
export const getTableData = async (req, res) => {
    try {
        const { tableName } = req.params;
        const { limit, offset, orderBy } = req.query;
        
        const result = await supabaseAdmin.getTableData(tableName, {
            limit: parseInt(limit) || 100,
            offset: parseInt(offset) || 0,
            orderBy: orderBy || 'id'
        });
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/supabase/tables/:tableName/insert
 * Insert row into table
 */
export const insertRow = async (req, res) => {
    try {
        const { tableName } = req.params;
        const rowData = req.body;
        
        const result = await supabaseAdmin.insertRow(tableName, rowData);
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ success: true, data: result.data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PUT /api/supabase/tables/:tableName/:id
 * Update row in table
 */
export const updateRow = async (req, res) => {
    try {
        const { tableName, id } = req.params;
        const updates = req.body;
        
        const result = await supabaseAdmin.updateRow(tableName, id, updates);
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ success: true, data: result.data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * DELETE /api/supabase/tables/:tableName/:id
 * Delete row from table
 */
export const deleteRow = async (req, res) => {
    try {
        const { tableName, id } = req.params;
        
        const result = await supabaseAdmin.deleteRow(tableName, id);
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/supabase/sql/execute
 * Execute raw SQL query
 */
export const executeSQL = async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'SQL query required' });
        }
        
        const result = await supabaseAdmin.executeSQL(query);
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ success: true, data: result.data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
//                    STORAGE OPERATIONS
// ============================================================

/**
 * GET /api/supabase/storage/buckets
 * List all storage buckets
 */
export const listBuckets = async (req, res) => {
    try {
        const result = await supabaseAdmin.listBuckets();
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ buckets: result.buckets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/supabase/storage/:bucketName/files
 * List files in bucket
 */
export const listFiles = async (req, res) => {
    try {
        const { bucketName } = req.params;
        const { path = '' } = req.query;
        
        const result = await supabaseAdmin.listFiles(bucketName, path);
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ files: result.files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/supabase/storage/:bucketName/upload
 * Upload file to bucket
 */
export const uploadFileToBucket = async (req, res) => {
    try {
        const { bucketName } = req.params;
        const { path: filePath } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const result = await supabaseAdmin.uploadFile(
            bucketName,
            filePath || req.file.originalname,
            req.file.buffer,
            req.file.mimetype
        );
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * DELETE /api/supabase/storage/:bucketName/files
 * Delete file from bucket
 */
export const deleteFileFromBucket = async (req, res) => {
    try {
        const { bucketName } = req.params;
        const { path } = req.body;
        
        if (!path) {
            return res.status(400).json({ error: 'File path required' });
        }
        
        const result = await supabaseAdmin.deleteFile(bucketName, path);
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/supabase/storage/buckets/create
 * Create new bucket
 */
export const createBucket = async (req, res) => {
    try {
        const { name, isPublic = true } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Bucket name required' });
        }
        
        const result = await supabaseAdmin.createBucket(name, isPublic);
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ success: true, bucket: result.bucket });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/supabase/storage/stats
 * Get storage usage statistics
 */
export const getStorageStats = async (req, res) => {
    try {
        const result = await supabaseAdmin.getStorageStats();
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        
        res.json({ stats: result.stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export { upload };
