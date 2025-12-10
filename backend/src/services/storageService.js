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

module.exports = { uploadFile };
