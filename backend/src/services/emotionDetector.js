/**
 * Emotion Detection Service
 * Analyzes YouTube video metadata to automatically detect song emotions/moods
 */

const emotionKeywords = {
  'Sad songs': {
    keywords: [
      'sad', 'cry', 'tears', 'heartbreak', 'broken', 'pain', 'hurt', 'lonely', 'alone',
      'miss', 'missing', 'lost', 'goodbye', 'farewell', 'emotional', 'melancholy',
      'depression', 'sorrow', 'grief', 'breakup', 'விடை', 'பிரிவு', 'கண்ணீர்',
      'துக்கம்', 'வேதனை', 'தனிமை', 'காதல் தோல்வி'
    ],
    weight: 1.5 // Higher weight for strong emotional indicators
  },
  
  'Feel Good': {
    keywords: [
      'happy', 'joy', 'celebrate', 'party', 'dance', 'fun', 'love', 'smile',
      'positive', 'upbeat', 'cheerful', 'bright', 'sunshine', 'good vibes',
      'feel good', 'happiness', 'celebration', 'wedding', 'festival',
      'மகிழ்ச்சி', 'சந்தோஷம்', 'கொண்டாட்டம்', 'நடனம்', 'காதல்', 'திருமணம்'
    ],
    weight: 1.3
  },
  
  'Vibe': {
    keywords: [
      'chill', 'relax', 'vibe', 'mood', 'aesthetic', 'lofi', 'calm', 'peaceful',
      'ambient', 'smooth', 'mellow', 'groove', 'cool', 'laid back', 'night',
      'drive', 'sunset', 'coffee', 'rain', 'நிம்மதி', 'அமைதி', 'இரவு'
    ],
    weight: 1.2
  },
  
  'Motivation': {
    keywords: [
      'motivation', 'inspire', 'power', 'strong', 'fight', 'warrior', 'victory',
      'success', 'achieve', 'determination', 'courage', 'brave', 'hero', 'rise',
      'overcome', 'struggle', 'hustle', 'grind', 'workout', 'gym', 'energy',
      'வெற்றி', 'சக்தி', 'போராட்டம்', 'தைரியம்', 'உத்வேகம்'
    ],
    weight: 1.4
  }
};

/**
 * Detect emotion from text using keyword matching with weighted scoring
 * @param {string} text - Text to analyze (title, description, etc.)
 * @returns {string} - Detected emotion category
 */
function detectEmotion(text) {
  if (!text) return 'Feel Good'; // Default fallback
  
  const lowerText = text.toLowerCase();
  const scores = {};
  
  // Initialize scores
  Object.keys(emotionKeywords).forEach(emotion => {
    scores[emotion] = 0;
  });
  
  // Calculate scores for each emotion
  Object.entries(emotionKeywords).forEach(([emotion, config]) => {
    config.keywords.forEach(keyword => {
      // Count occurrences of keyword
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        scores[emotion] += matches.length * config.weight;
      }
    });
  });
  
  // Find emotion with highest score
  let maxScore = 0;
  let detectedEmotion = 'Feel Good'; // Default
  
  Object.entries(scores).forEach(([emotion, score]) => {
    if (score > maxScore) {
      maxScore = score;
      detectedEmotion = emotion;
    }
  });
  
  // If no keywords matched, use heuristics
  if (maxScore === 0) {
    // Check for common patterns
    if (lowerText.includes('love') || lowerText.includes('காதல்')) {
      return 'Feel Good';
    }
    if (lowerText.includes('song') || lowerText.includes('music')) {
      return 'Vibe';
    }
  }
  
  return detectedEmotion;
}

/**
 * Analyze YouTube metadata and return emotion + confidence
 * @param {Object} metadata - YouTube metadata object
 * @returns {Object} - { emotion, confidence, scores }
 */
function analyzeMetadata(metadata) {
  const { title = '', description = '', tags = [] } = metadata;
  
  // Combine all text sources
  const combinedText = [
    title,
    description,
    ...(Array.isArray(tags) ? tags : [])
  ].join(' ');
  
  const emotion = detectEmotion(combinedText);
  
  // Calculate confidence based on text length and keyword density
  const wordCount = combinedText.split(/\s+/).length;
  const confidence = Math.min(wordCount > 50 ? 0.8 : 0.6, 1.0);
  
  return {
    emotion,
    confidence,
    analyzedText: {
      title,
      descriptionLength: description.length,
      tagCount: tags.length
    }
  };
}

/**
 * Get suggested category based on emotion
 * Maps emotions to broader categories if needed
 */
function getSuggestedCategory(emotion) {
  const categoryMap = {
    'Sad songs': 'Tamil',
    'Feel Good': 'Tamil',
    'Vibe': 'General',
    'Motivation': 'General'
  };
  
  return categoryMap[emotion] || 'General';
}

module.exports = {
  detectEmotion,
  analyzeMetadata,
  getSuggestedCategory,
  emotionKeywords
};
