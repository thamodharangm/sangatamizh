/**
 * Enhanced Emotion Detection Service
 * Advanced AI-powered emotion detection with multi-factor analysis
 * Supports phrase matching, context analysis, and weighted scoring
 */

// Enhanced keyword database with phrases and context
const emotionPatterns = {
  'Sad songs': {
    // Single keywords
    keywords: [
      'sad', 'cry', 'tears', 'heartbreak', 'broken', 'pain', 'hurt', 'lonely', 'alone',
      'miss', 'missing', 'lost', 'goodbye', 'farewell', 'emotional', 'melancholy',
      'depression', 'sorrow', 'grief', 'breakup', 'break up', 'separation', 'regret',
      'empty', 'darkness', 'suffering', 'aching', 'bleeding', 'shattered', 'devastated',
      // Tamil keywords
      'விடை', 'பிரிவு', 'கண்ணீர்', 'துக்கம்', 'வேதனை', 'தனிமை', 'காதல் தோல்வி',
      'பிரிவு வேதனை', 'மனம் உடைந்த', 'தனிமை'
    ],
    // Phrase patterns (higher weight)
    phrases: [
      'broken heart', 'heart break', 'cry alone', 'lost love', 'miss you',
      'without you', 'left me', 'gone away', 'never come back', 'tears fall',
      'painful memories', 'sad love', 'emotional song', 'breakup song',
      'காதல் தோல்வி', 'பிரிவு பாடல்', 'கண்ணீர் பாடல்'
    ],
    // Negation words that reduce score
    negations: ['not sad', 'no more tears', 'happy ending'],
    weight: 2.0,
    phraseWeight: 3.0
  },
  
  'Feel Good': {
    keywords: [
      'happy', 'joy', 'celebrate', 'party', 'dance', 'fun', 'love', 'smile',
      'positive', 'upbeat', 'cheerful', 'bright', 'sunshine', 'good vibes',
      'happiness', 'celebration', 'wedding', 'festival', 'romantic', 'beautiful',
      'amazing', 'wonderful', 'blessed', 'grateful', 'excited', 'energetic',
      // Tamil keywords
      'மகிழ்ச்சி', 'சந்தோஷம்', 'கொண்டாட்டம்', 'நடனம்', 'காதல்', 'திருமணம்',
      'இனிமை', 'மகிழ்வு', 'உற்சாகம்'
    ],
    phrases: [
      'feel good', 'good vibes', 'happy song', 'love song', 'celebration song',
      'wedding song', 'party song', 'dance song', 'romantic song', 'positive vibes',
      'feel happy', 'makes me smile', 'காதல் பாடல்', 'திருமண பாடல்', 'மகிழ்ச்சி பாடல்'
    ],
    negations: ['not happy', 'fake smile'],
    weight: 1.5,
    phraseWeight: 2.5
  },
  
  'Vibe': {
    keywords: [
      'chill', 'relax', 'vibe', 'mood', 'aesthetic', 'lofi', 'calm', 'peaceful',
      'ambient', 'smooth', 'mellow', 'groove', 'cool', 'laid back', 'night',
      'drive', 'sunset', 'coffee', 'rain', 'study', 'sleep', 'meditation',
      'tranquil', 'serene', 'soothing', 'dreamy', 'atmospheric',
      // Tamil keywords
      'நிம்மதி', 'அமைதி', 'இரவு', 'மனம் அமைதி'
    ],
    phrases: [
      'chill vibes', 'relax music', 'lofi beats', 'study music', 'sleep music',
      'calm music', 'peaceful song', 'night drive', 'coffee shop', 'rainy day',
      'mood song', 'vibe song', 'aesthetic music', 'அமைதி பாடல்'
    ],
    negations: ['not chill', 'intense'],
    weight: 1.8,
    phraseWeight: 2.8
  },
  
  'Motivation': {
    keywords: [
      'motivation', 'inspire', 'power', 'strong', 'fight', 'warrior', 'victory',
      'success', 'achieve', 'determination', 'courage', 'brave', 'hero', 'rise',
      'overcome', 'struggle', 'hustle', 'grind', 'workout', 'gym', 'energy',
      'champion', 'winner', 'conquer', 'unstoppable', 'fearless', 'powerful',
      'beast mode', 'never give up', 'push harder',
      // Tamil keywords
      'வெற்றி', 'சக்தி', 'போராட்டம்', 'தைரியம்', 'உத்வேகம்', 'வீரம்'
    ],
    phrases: [
      'motivational song', 'workout music', 'gym music', 'never give up',
      'rise up', 'fight back', 'be strong', 'you can do it', 'believe yourself',
      'success song', 'victory song', 'inspirational music', 'power song',
      'உத்வேக பாடல்', 'வெற்றி பாடல்', 'சக்தி பாடல்'
    ],
    negations: ['give up', 'quit', 'surrender'],
    weight: 2.0,
    phraseWeight: 3.0
  }
};

/**
 * Advanced emotion detection with phrase matching and context analysis
 */
function detectEmotionAdvanced(text) {
  if (!text) return { emotion: 'Feel Good', confidence: 0.5, scores: {} };
  
  const lowerText = text.toLowerCase();
  const scores = {};
  const details = {};
  
  // Initialize scores
  Object.keys(emotionPatterns).forEach(emotion => {
    scores[emotion] = 0;
    details[emotion] = { keywords: 0, phrases: 0, negations: 0 };
  });
  
  // Analyze each emotion category
  Object.entries(emotionPatterns).forEach(([emotion, config]) => {
    let emotionScore = 0;
    
    // 1. Check for phrase matches (higher priority)
    config.phrases.forEach(phrase => {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        const phraseScore = matches.length * config.phraseWeight;
        emotionScore += phraseScore;
        details[emotion].phrases += matches.length;
      }
    });
    
    // 2. Check for keyword matches
    config.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        const keywordScore = matches.length * config.weight;
        emotionScore += keywordScore;
        details[emotion].keywords += matches.length;
      }
    });
    
    // 3. Check for negations (reduce score)
    config.negations.forEach(negation => {
      if (lowerText.includes(negation)) {
        emotionScore *= 0.5; // Reduce score by 50%
        details[emotion].negations += 1;
      }
    });
    
    scores[emotion] = emotionScore;
  });
  
  // Find emotion with highest score
  let maxScore = 0;
  let detectedEmotion = 'Feel Good';
  
  Object.entries(scores).forEach(([emotion, score]) => {
    if (score > maxScore) {
      maxScore = score;
      detectedEmotion = emotion;
    }
  });
  
  // Calculate confidence based on score strength and text analysis
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const scoreRatio = totalScore > 0 ? maxScore / totalScore : 0;
  const wordCount = lowerText.split(/\s+/).length;
  
  // Confidence factors:
  // - Score dominance (how much higher is the top score)
  // - Text length (more text = more confident)
  // - Absolute score (higher scores = more matches)
  let confidence = 0.5; // Base confidence
  
  if (scoreRatio > 0.7) confidence += 0.2; // Strong dominance
  if (scoreRatio > 0.5) confidence += 0.1; // Moderate dominance
  if (wordCount > 50) confidence += 0.15; // Long text
  if (wordCount > 20) confidence += 0.05; // Medium text
  if (maxScore > 5) confidence += 0.1; // Many matches
  
  confidence = Math.min(confidence, 0.95); // Cap at 95%
  
  // If no clear winner, check for special cases
  if (maxScore === 0) {
    // Fallback heuristics
    if (lowerText.includes('love') || lowerText.includes('காதல்')) {
      return { emotion: 'Feel Good', confidence: 0.6, scores, details };
    }
    if (lowerText.includes('music') || lowerText.includes('song')) {
      return { emotion: 'Vibe', confidence: 0.5, scores, details };
    }
  }
  
  return {
    emotion: detectedEmotion,
    confidence: parseFloat(confidence.toFixed(2)),
    scores,
    details,
    analysis: {
      totalMatches: Object.values(details[detectedEmotion]).reduce((a, b) => a + b, 0),
      phraseMatches: details[detectedEmotion].phrases,
      keywordMatches: details[detectedEmotion].keywords,
      scoreRatio: parseFloat(scoreRatio.toFixed(2))
    }
  };
}

/**
 * Analyze YouTube metadata with enhanced multi-factor analysis
 */
function analyzeMetadata(metadata) {
  const { title = '', description = '', tags = [], viewCount = 0 } = metadata;
  
  // Weight different sources differently
  const titleWeight = 3.0;  // Title is most important
  const descWeight = 1.5;   // Description is secondary
  const tagWeight = 2.0;    // Tags are important
  
  // Analyze each source separately
  const titleAnalysis = detectEmotionAdvanced(title);
  const descAnalysis = detectEmotionAdvanced(description);
  const tagsText = Array.isArray(tags) ? tags.join(' ') : '';
  const tagsAnalysis = detectEmotionAdvanced(tagsText);
  
  // Combine scores with weights
  const combinedScores = {};
  Object.keys(emotionPatterns).forEach(emotion => {
    combinedScores[emotion] = 
      (titleAnalysis.scores[emotion] || 0) * titleWeight +
      (descAnalysis.scores[emotion] || 0) * descWeight +
      (tagsAnalysis.scores[emotion] || 0) * tagWeight;
  });
  
  // Find winning emotion
  let maxScore = 0;
  let finalEmotion = 'Feel Good';
  Object.entries(combinedScores).forEach(([emotion, score]) => {
    if (score > maxScore) {
      maxScore = score;
      finalEmotion = emotion;
    }
  });
  
  // Calculate combined confidence
  const avgConfidence = (
    titleAnalysis.confidence * 0.5 +
    descAnalysis.confidence * 0.3 +
    tagsAnalysis.confidence * 0.2
  );
  
  return {
    emotion: finalEmotion,
    confidence: parseFloat(avgConfidence.toFixed(2)),
    analyzedText: {
      title,
      descriptionLength: description.length,
      tagCount: Array.isArray(tags) ? tags.length : 0
    },
    breakdown: {
      title: { emotion: titleAnalysis.emotion, confidence: titleAnalysis.confidence },
      description: { emotion: descAnalysis.emotion, confidence: descAnalysis.confidence },
      tags: { emotion: tagsAnalysis.emotion, confidence: tagsAnalysis.confidence }
    },
    scores: combinedScores
  };
}

/**
 * Get suggested category based on emotion
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
  detectEmotion: detectEmotionAdvanced,
  analyzeMetadata,
  getSuggestedCategory,
  emotionPatterns
};
