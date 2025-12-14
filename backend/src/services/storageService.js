const supabase = require('../config/supabase');
const fs = require('fs');

async function uploadFile(filePath, destinationPath, contentType = 'audio/mpeg') {
    const file = fs.readFileSync(filePath);
    const { error } = await supabase.storage
        .from("music_assets")
        .upload(destinationPath, file, { contentType });
    
    if (error) {
        console.error("Supabase Upload Error:", JSON.stringify(error, null, 2));
        throw error;
    }
    
    const publicUrl = supabase.storage.from("music_assets").getPublicUrl(destinationPath).data.publicUrl;
    return publicUrl;
}

async function deleteFile(path) {
    // Expecting path to be relative "songs/filename.mp3"
    const { error } = await supabase.storage
        .from("music_assets")
        .remove([path]);
    
    if (error) {
        console.error("Supabase Delete Error:", error);
        // We don't throw here to avoid blocking DB delete if file is already gone
    }
}

module.exports = { uploadFile, deleteFile };
