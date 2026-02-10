/**
 * Supabase Admin Routes
 * Routes for managing Supabase SQL and Storage
 */

import express from 'express';
import * as supabaseController from '../controllers/supabase.admin.controller.js';

const router = express.Router();

// ============================================================
//                    SQL OPERATIONS
// ============================================================

// Get all tables
router.get('/tables', supabaseController.listTables);

// Get table schema
router.get('/tables/:tableName/schema', supabaseController.getTableSchema);

// Get table data
router.get('/tables/:tableName/data', supabaseController.getTableData);

// Insert row
router.post('/tables/:tableName/insert', supabaseController.insertRow);

// Update row
router.put('/tables/:tableName/:id', supabaseController.updateRow);

// Delete row
router.delete('/tables/:tableName/:id', supabaseController.deleteRow);

// Execute raw SQL
router.post('/sql/execute', supabaseController.executeSQL);

// ============================================================
//                    STORAGE OPERATIONS
// ============================================================

// List all buckets
router.get('/storage/buckets', supabaseController.listBuckets);

// List files in bucket
router.get('/storage/:bucketName/files', supabaseController.listFiles);

// Upload file to bucket
router.post(
    '/storage/:bucketName/upload',
    supabaseController.upload.single('file'),
    supabaseController.uploadFileToBucket
);

// Delete file from bucket
router.delete('/storage/:bucketName/files', supabaseController.deleteFileFromBucket);

// Create new bucket
router.post('/storage/buckets/create', supabaseController.createBucket);

// Get storage stats
router.get('/storage/stats', supabaseController.getStorageStats);

export default router;
