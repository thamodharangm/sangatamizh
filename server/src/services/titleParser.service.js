/**
 * Title Parser Service
 * Intelligently parses YouTube titles to extract song name, movie name, and other metadata
 */

// Noise words to remove from titles
const NOISE_WORDS = [
    // Video quality and format
    'full video', 'full song', 'full', 'video song', 'video', 'audio song', 'audio',
    'official video', 'official music video', 'official', 'music video', 'mv',
    'lyric video', 'lyrics video', 'lyrical video', 'lyric', 'lyrics',
    'hd', '4k', '8k', 'uhd', '1080p', '720p', '60fps', '30fps',
    
    // Production markers
    'prod by', 'produced by', 'directed by',
    
    // Common tags
    'ft', 'feat', 'featuring', 'with',
    
    // Languages (often redundant)
    'tamil', 'hindi', 'telugu', 'malayalam', 'kannada',
    'song', 'songs', 'music', 'musical'
];

// Artist name suffixes to remove
const ARTIST_SUFFIXES = [
    'official', 'vevo', 'music', 'records', 'entertainment',
    'south', 'india', 'international', 'movies',  'films'
];

/**
 * Clean a title by removing noise words and extra whitespace
 */
function cleanTitle(title) {
    let cleaned = title;
    
    // Remove content in brackets/parentheses
    cleaned = cleaned.replace(/\[.*?\]/g, '');
    cleaned = cleaned.replace(/\(.*?\)/g, '');
    cleaned = cleaned.replace(/\{.*?\}/g, '');
    
    // Remove noise words (case insensitive)
    NOISE_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Clean up multiple spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

/**
 * Split title by common separators
 */
function splitTitle(title) {
    // Split by common separators: |, -, –, —, :, //, •
    // Better regex using alternation for multi-char separators and escaping
    const parts = title.split(/\s*(?:\||[\-–—]|:\/\/|:|\/\/|•)\s*/).map(part => part.trim()).filter(part => part.length > 0);
    return parts.length > 0 ? parts : [title];
}

/**
 * Clean artist/uploader name
 */
function cleanArtistName(uploader) {
    let cleaned = uploader;
    
    // Remove common suffixes
    ARTIST_SUFFIXES.forEach(suffix => {
        const regex = new RegExp(`\\b${suffix}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Clean up
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned || uploader; // Fallback to original if everything was removed
}

// Common actors/artists to ignore when detecting Movie Name
const COMMON_ACTORS = [
    'vishal', 'vijay', 'ajith', 'rajinikanth', 'kamal haasan', 'suriya', 
    'dhanush', 'simbu', 'str', 'sivakarthikeyan', 'sk', 'karthi', 
    'vikram', 'chiyaan', 'jiiva', 'arya', 'jayam ravi', 'vijay sethupathi', 
    'vjs', 'nayanthara', 'samantha', 'trisha', 'anirudh', 'ar rahman', 'a.r. rahman', 'a.r.rahman',
    'u1', 'yuvan', 'harris jayaraj', 'ilayaraja', 'thaman', 'dsp',
    'hiphop tamizha', 'gv prakash', 'akshay', 'sara', 'kiara', 'rashmika', 'musical'
];

/**
 * Parse YouTube title to extract song and movie
 */
export function parseYouTubeTitle(title, uploader = '') {
    const cleaned = cleanTitle(title);
    const rawParts = splitTitle(cleaned);
    
    // Filter out common actors/artists from parts to find Movie/Song
    const parts = rawParts.filter(p => {
        const lower = p.toLowerCase();
        return p.length > 2 && !COMMON_ACTORS.some(actor => lower.includes(actor));
    });
    
    let song = '';
    let movie = '';
    let artist = cleanArtistName(uploader);
    
    if (parts.length >= 2) {
        // If we found at least 2 non-artist parts, first is likely song, second is movie
        song = parts[0];
        movie = parts[1];
    } else if (parts.length === 1) {
        // Only 1 non-artist part? 
        // If uploader matches movie name pattern, use it
        song = parts[0];
        movie = '';
    } else {
        // Fallback: use first and second raw parts
        song = rawParts[0];
        movie = rawParts.length > 1 ? rawParts[1] : '';
    }
    
    return {
        song: song || title,
        movie: movie || '',
        artist: artist
    };
}

/**
 * Infer genre from title/description
 */
function inferGenre(title, description = '') {
    const combined = `${title} ${description}`.toLowerCase();
    
    if (combined.match(/\b(tamil|kollywood|ilayaraja|ar rahman|anirudh|yuvan|harris)\b/)) {
        return 'Tamil';
    }
    if (combined.match(/\b(hindi|bollywood|arijit|shreya|sonu nigam|atif)\b/)) {
        return 'Hindi';
    }
    if (combined.match(/\b(telugu|tollywood|thaman|devi sri prasad|dsp)\b/)) {
        return 'Telugu';
    }
    if (combined.match(/\b(malayalam|mollywood|gopi sundar)\b/)) {
        return 'Malayalam';
    }
    if (combined.match(/\b(kannada|sandalwood|v harikrishna)\b/)) {
        return 'Kannada';
    }
    
    return 'Tamil'; // Default
}

/**
 * Infer emotion from title/description
 */
function inferEmotion(title, description = '') {
    const combined = `${title} ${description}`.toLowerCase();
    
    if (combined.match(/\b(love|romantic|kadhal|inbam|pyaar|ishq)\b/)) {
        return 'Love';
    }
    if (combined.match(/\b(sad|cry|sogam|dukh|breakup|alone|miss)\b/)) {
        return 'Sad';
    }
    if (combined.match(/\b(motivat|power|energy|mass|gethu|josh|victory|fight)\b/)) {
        return 'Motivate';
    }
    if (combined.match(/\b(party|dance|kuthu|beat|celebration|jolly|enjoy)\b/)) {
        return 'Vibe';
    }
    
    return 'Feel Good'; // Default
}

/**
 * Main parser function - parses full metadata
 */
export function parseYouTubeMetadata(metadata) {
    const { title, uploader, thumbnail, duration, description = '' } = metadata;
    
    // Parse title
    const parsed = parseYouTubeTitle(title, uploader);
    
    // Infer additional data
    const genre = inferGenre(title, description);
    const emotion = inferEmotion(title, description);
    
    return {
        song: parsed.song,
        movie: parsed.movie,
        artist: parsed.artist,
        uploader: uploader,
        thumbnail: thumbnail,
        duration: duration,
        genre: genre,
        emotion: emotion,
        rawTitle: title,
        rawUploader: uploader
    };
}

export default {
    parseYouTubeTitle,
    parseYouTubeMetadata,
    cleanTitle,
    cleanArtistName
};
