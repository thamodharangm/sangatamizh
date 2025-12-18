// Simple, fast metadata extractor using only video ID
function extractVideoId(url) {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\\w-]{11})/);
    return match ? match[1] : null;
}

// Generate basic metadata from video ID without API calls
function generateBasicMetadata(url) {
    const videoId = extractVideoId(url);
    
    if (!videoId) {
        throw new Error('Invalid YouTube URL');
    }
    
    return {
        title: `YouTube Video ${videoId}`, // User can edit after upload
        artist: 'YouTube',
        coverUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, // Standard YouTube thumbnail
        emotion: 'Feel Good', // Default emotion
        description: '',
        viewCount: 0
    };
}

// Ultra-fast metadata fetch with 5-second timeout
async function getMetadataFast(url) {
    const videoId = extractVideoId(url);
    
    if (!videoId) {
        throw new Error('Invalid YouTube URL');
    }
    
    // Try YouTube API with strict timeout
    if (process.env.YT_API_KEY) {
        const keys = process.env.YT_API_KEY.split(',').map(k => k.trim()).filter(k => k);
        
        for (const key of keys) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sec max
                
                const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${key}`;
                const response = await fetch(apiUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.items && data.items.length > 0) {
                        const snippet = data.items[0].snippet;
                        return {
                            title: snippet.title,
                            artist: snippet.channelTitle,
                            coverUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
                            emotion: 'Feel Good', // Simple default
                            description: snippet.description || '',
                            viewCount: 0
                        };
                    }
                }
            } catch (e) {
                // Continue to next key or fallback
            }
        }
    }
    
    // Fallback: Use basic metadata (instant)
    return generateBasicMetadata(url);
}

module.exports = { getMetadataFast, generateBasicMetadata, extractVideoId };
