/**
 * Supabase Admin Service
 * Direct CRUD operations on Supabase SQL and Storage
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('⚠️  Supabase credentials not configured');
}

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================
//                    SQL OPERATIONS
// ============================================================

/**
 * Execute raw SQL query
 * ⚠️  Use with caution - no SQL injection protection
 */
export async function executeSQL(query) {
    try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { query });
        
        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error('[Supabase SQL Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Get all tables in the database
 */
export async function getTables() {
    try {
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `;
        
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { query });
        
        if (error) throw error;
        return { success: true, tables: data };
    } catch (err) {
        console.error('[Get Tables Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Get table schema (columns)
 */
export async function getTableSchema(tableName) {
    try {
        const query = `
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' 
            ORDER BY ordinal_position;
        `;
        
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { query });
        
        if (error) throw error;
        return { success: true, schema: data };
    } catch (err) {
        console.error('[Get Schema Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Get table data with pagination
 */
export async function getTableData(tableName, { limit = 100, offset = 0, orderBy = 'id' } = {}) {
    try {
        let query = supabaseAdmin.from(tableName).select('*');
        
        if (orderBy) {
            query = query.order(orderBy, { ascending: false });
        }
        
        query = query.range(offset, offset + limit - 1);
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return { 
            success: true, 
            data, 
            count,
            limit,
            offset 
        };
    } catch (err) {
        console.error('[Get Table Data Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Insert row into table
 */
export async function insertRow(tableName, rowData) {
    try {
        const { data, error } = await supabaseAdmin
            .from(tableName)
            .insert([rowData])
            .select();
        
        if (error) throw error;
        
        return { success: true, data: data[0] };
    } catch (err) {
        console.error('[Insert Row Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Update row in table
 */
export async function updateRow(tableName, id, updates) {
    try {
        const { data, error } = await supabaseAdmin
            .from(tableName)
            .update(updates)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        return { success: true, data: data[0] };
    } catch (err) {
        console.error('[Update Row Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Delete row from table
 */
export async function deleteRow(tableName, id) {
    try {
        const { error } = await supabaseAdmin
            .from(tableName)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        return { success: true };
    } catch (err) {
        console.error('[Delete Row Error]:', err.message);
        return { success: false, error: err.message };
    }
}

// ============================================================
//                    STORAGE OPERATIONS
// ============================================================

/**
 * List all buckets
 */
export async function listBuckets() {
    try {
        const { data, error } = await supabaseAdmin.storage.listBuckets();
        
        if (error) throw error;
        
        return { success: true, buckets: data };
    } catch (err) {
        console.error('[List Buckets Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * List files in bucket
 */
export async function listFiles(bucketName, path = '') {
    try {
        const { data, error } = await supabaseAdmin.storage
            .from(bucketName)
            .list(path, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });
        
        if (error) throw error;
        
        // Get public URLs for each file
        const filesWithUrls = data.map(file => {
            const { data: urlData } = supabaseAdmin.storage
                .from(bucketName)
                .getPublicUrl(`${path}${file.name}`);
            
            return {
                ...file,
                publicUrl: urlData.publicUrl,
                fullPath: `${path}${file.name}`
            };
        });
        
        return { success: true, files: filesWithUrls };
    } catch (err) {
        console.error('[List Files Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Upload file to bucket
 */
export async function uploadFile(bucketName, filePath, fileBuffer, contentType) {
    try {
        const { data, error } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(filePath, fileBuffer, {
                contentType,
                upsert: true
            });
        
        if (error) throw error;
        
        const { data: urlData } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(filePath);
        
        return { 
            success: true, 
            path: data.path,
            publicUrl: urlData.publicUrl
        };
    } catch (err) {
        console.error('[Upload File Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Delete file from bucket
 */
export async function deleteFile(bucketName, filePath) {
    try {
        const { error } = await supabaseAdmin.storage
            .from(bucketName)
            .remove([filePath]);
        
        if (error) throw error;
        
        return { success: true };
    } catch (err) {
        console.error('[Delete File Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Create new bucket
 */
export async function createBucket(bucketName, isPublic = true) {
    try {
        const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
            public: isPublic
        });
        
        if (error) throw error;
        
        return { success: true, bucket: data };
    } catch (err) {
        console.error('[Create Bucket Error]:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Get storage usage stats
 */
export async function getStorageStats() {
    try {
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        
        const stats = await Promise.all(buckets.map(async (bucket) => {
            const { data: files } = await supabaseAdmin.storage
                .from(bucket.name)
                .list('', { limit: 1000 });
            
            const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;
            const fileCount = files?.length || 0;
            
            return {
                name: bucket.name,
                fileCount,
                totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
            };
        }));
        
        return { success: true, stats };
    } catch (err) {
        console.error('[Get Storage Stats Error]:', err.message);
        return { success: false, error: err.message };
    }
}

export default {
    // SQL Operations
    executeSQL,
    getTables,
    getTableSchema,
    getTableData,
    insertRow,
    updateRow,
    deleteRow,
    
    // Storage Operations
    listBuckets,
    listFiles,
    uploadFile,
    deleteFile,
    createBucket,
    getStorageStats
};
