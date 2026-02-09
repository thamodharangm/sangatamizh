import { supabase } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';

export const storageService = {
    isCloud: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY),

    async uploadFile(file, folder) {
        if (!this.isCloud) {
            // Return local path as before
            return `uploads/${file.filename}`;
        }

        try {
            const fileName = `${Date.now()}_${file.originalname}`;
            const filePath = `${folder}/${fileName}`;

            // Read file from local disk (where multer saved it temporarily)
            const fileBuffer = fs.readFileSync(file.path);

            const { data, error } = await supabase.storage
                .from('music-app') // Replace with your bucket name
                .upload(filePath, fileBuffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('music-app')
                .getPublicUrl(filePath);

            // Cleanup local temp file
            try { fs.unlinkSync(file.path); } catch (e) {}

            return publicUrl;
        } catch (err) {
            console.error('[Storage] Upload error:', err);
            throw err;
        }
    },

    async deleteFile(url) {
        if (!this.isCloud || !url.includes('supabase.co')) {
            // Handle local deletion
            try {
                const localPath = path.join(process.cwd(), url);
                if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
            } catch (e) {}
            return;
        }

        try {
            // Extract path from URL
            // Example: https://xyz.supabase.co/storage/v1/object/public/music-app/songs/123_abc.mp3
            const parts = url.split('/music-app/');
            if (parts.length > 1) {
                const filePath = parts[1];
                await supabase.storage
                    .from('music-app')
                    .remove([filePath]);
            }
        } catch (err) {
            console.error('[Storage] Delete error:', err);
        }
    }
};
