// AI Video Scene Generator
// Transforms user text descriptions into creative video scenes

/**
 * Generate creative video scenes from a text description
 * @param {string} description - User's text description
 * @param {string} composition - Composition type (TextScene, ImageScene, MultiSceneVideo)
 * @returns {Object} Enhanced input props with creative elements
 */
async function generateCreativeScenes(description, composition) {
  console.log(`🎨 Generating creative content from: "${description}"`);

  // For now, use a rule-based approach to transform descriptions into scenes
  // TODO: Integrate with OpenAI/Anthropic for true AI generation
  
  if (composition === 'TextScene') {
    return generateTextScene(description);
  } else if (composition === 'ImageScene') {
    return generateImageScene(description);
  } else if (composition === 'MultiSceneVideo') {
    return generateMultiScene(description);
  }
  
  return null;
}

function generateTextScene(description) {
  // Extract key themes and generate styled text
  const themes = analyzeThemes(description);
  const keywords = extractKeywords(description);
  
  // Create a summary/title from the description
  const words = description.split(' ');
  const title = words.length > 8 ? words.slice(0, 8).join(' ') + '...' : description;
  
  return {
    text: title,
    backgroundColor: themes.backgroundColor,
    textColor: themes.textColor,
  };
}

function generateImageScene(description) {
  // Generate image scenes with relevant visuals based on description
  const keywords = extractKeywords(description);
  
  // Use Lorem Picsum for reliable image loading in Remotion
  // Generate a seed based on description for consistent images
  const seed = Math.abs(description.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000;
  const imageUrl = `https://picsum.photos/seed/${seed}/1920/1080`;
  
  // Create a short caption from description or keywords
  const caption = keywords.length > 0
    ? keywords.slice(0, 3).join(' • ')
    : description.slice(0, 50) + (description.length > 50 ? '...' : '');
  
  return {
    imageUrl,
    overlayText: caption,
  };
}

function generateMultiScene(description) {
  // Transform description into creative visual narrative
  const keywords = extractKeywords(description);
  const theme = analyzeThemes(description);
  const scenes = [];
  
  // Create cinematic opening title
  const openingTitle = generateCinematicOpening(description, keywords, theme);
  scenes.push({
    type: 'text',
    duration: 300, // 10s opening
    props: {
      text: openingTitle,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
    }
  });
  
  // Generate 4-6 creative visual interpretations
  const visualStory = interpretDescriptionCreatively(description, keywords, theme);
  
  visualStory.forEach((scene, index) => {
    scenes.push({
      type: 'image',
      duration: getDynamicDuration(index, visualStory.length),
      props: {
        imageUrl: getThematicImage(scene.concept, theme.theme, index),
      }
    });
  });
  
  // Powerful closing scene
  scenes.push({
    type: 'text',
    duration: 300, // 10s outro
    props: {
      text: generatePowerfulClosing(description, keywords, theme),
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
    }
  });
  
  return { scenes };
}

// Generate cinematic opening title
function generateCinematicOpening(description, keywords, theme) {
  const mainConcepts = keywords.slice(0, 2);
  
  // Create evocative combinations
  const templates = [
    `${capitalize(mainConcepts[0])} Awaits`,
    `Journey to ${capitalize(mainConcepts[0])}`,
    `The Art of ${capitalize(mainConcepts[0])}`,
    `Discovering ${capitalize(mainConcepts[0])}`,
    `${capitalize(mainConcepts[0])}: A Story`,
    `Beyond ${capitalize(mainConcepts[0])}`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate powerful closing
function generatePowerfulClosing(description, keywords, theme) {
  const mainKeyword = keywords[0];
  
  const closings = [
    `Embrace the Journey`,
    `Where ${capitalize(mainKeyword)} Begins`,
    `Your Story Unfolds`,
    `The Adventure Continues`,
    `Endless Possibilities`,
    `Create Your Vision`,
  ];
  
  return closings[Math.floor(Math.random() * closings.length)];
}

// Creatively interpret the description into visual concepts
function interpretDescriptionCreatively(description, keywords, theme) {
  const visualConcepts = [];
  
  // Analyze the emotional tone and meaning
  const mood = detectMood(description);
  const setting = detectSetting(description);
  const action = detectAction(description);
  
  // Create 5-6 distinct visual concepts based on interpretation
  const concepts = [
    // Concept 1: Establish setting/environment
    {
      concept: setting || keywords[0],
      intent: 'environment',
      variation: 0
    },
    // Concept 2: Introduce mood/atmosphere
    {
      concept: mood || keywords[1] || 'atmosphere',
      intent: 'mood',
      variation: 1
    },
    // Concept 3: Show action/movement
    {
      concept: action || keywords[2] || 'dynamic',
      intent: 'action',
      variation: 2
    },
    // Concept 4: Detail/close-up element
    {
      concept: keywords[3] || keywords[0],
      intent: 'detail',
      variation: 3
    },
    // Concept 5: Perspective shift
    {
      concept: keywords[4] || keywords[1] || keywords[0],
      intent: 'perspective',
      variation: 4
    },
    // Concept 6: Resolution/completion
    {
      concept: keywords[0],
      intent: 'resolution',
      variation: 5
    }
  ];
  
  return concepts;
}

// Detect mood from description
function detectMood(text) {
  const lowerText = text.toLowerCase();
  
  const moodPatterns = {
    'serene': ['peaceful', 'calm', 'serene', 'tranquil', 'quiet'],
    'energetic': ['energetic', 'dynamic', 'vibrant', 'exciting', 'lively'],
    'mysterious': ['mysterious', 'hidden', 'secret', 'unknown', 'enigmatic'],
    'inspiring': ['inspiring', 'uplifting', 'motivating', 'empowering'],
    'dramatic': ['dramatic', 'intense', 'powerful', 'striking', 'bold'],
  };
  
  for (const [mood, patterns] of Object.entries(moodPatterns)) {
    if (patterns.some(p => lowerText.includes(p))) {
      return mood;
    }
  }
  
  return null;
}

// Detect setting from description
function detectSetting(text) {
  const lowerText = text.toLowerCase();
  
  const settingPatterns = {
    'wilderness': ['mountain', 'forest', 'nature', 'wilderness', 'outdoors'],
    'urban': ['city', 'urban', 'street', 'building', 'metropolitan'],
    'coastal': ['ocean', 'beach', 'sea', 'coast', 'water'],
    'celestial': ['sky', 'stars', 'sunset', 'clouds', 'horizon'],
    'abstract': ['abstract', 'concept', 'idea', 'minimal'],
  };
  
  for (const [setting, patterns] of Object.entries(settingPatterns)) {
    if (patterns.some(p => lowerText.includes(p))) {
      return setting;
    }
  }
  
  return null;
}

// Detect action from description
function detectAction(text) {
  const lowerText = text.toLowerCase();
  
  const actionPatterns = {
    'movement': ['moving', 'flowing', 'running', 'walking', 'dancing'],
    'transformation': ['changing', 'transforming', 'becoming', 'evolving'],
    'creation': ['creating', 'building', 'making', 'designing', 'crafting'],
    'discovery': ['discovering', 'exploring', 'finding', 'revealing'],
    'growth': ['growing', 'rising', 'emerging', 'ascending'],
  };
  
  for (const [action, patterns] of Object.entries(actionPatterns)) {
    if (patterns.some(p => lowerText.includes(p))) {
      return action;
    }
  }
  
  return null;
}

// Capitalize first letter
function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Get dynamic duration based on scene position
function getDynamicDuration(index, total) {
  // Create rhythm with 10s, 20s, 30s durations
  // 30fps: 10s=300f, 20s=600f, 30s=900f
  const position = index / Math.max(total - 1, 1);
  
  if (position < 0.33) {
    return 300; // 10 seconds for opening scenes
  } else if (position < 0.66) {
    return 900; // 30 seconds for middle emphasis scenes
  } else {
    return 600; // 20 seconds for closing scenes
  }
}

// Get thematic image URL with better variety
function getThematicImage(keyword, theme, index) {
  // Use only Picsum for reliable rendering - Unsplash has CORS/503 issues
  // Generate seed from keyword for consistent but varied images
  const seed = Math.abs(keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) + (index * 137);
  
  // Use different seed variations for variety
  const seedVariation = index % 5;
  const finalSeed = seed + (seedVariation * 1000);
  
  return `https://picsum.photos/seed/${finalSeed}/1920/1080`;
}

function extractKeywords(text) {
  // Remove common words and extract meaningful keywords
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 
    'should', 'could', 'can', 'may', 'might', 'must', 'that', 'this', 'these',
    'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
  ]);
  
  // Extract nouns, adjectives, and meaningful words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !commonWords.has(w));
  
  // Remove duplicates and return top keywords
  return [...new Set(words)].slice(0, 6);
}

function analyzeThemes(text) {
  const lowerText = text.toLowerCase();
  
  // Emotional theme detection
  const themes = {
    nature: ['nature', 'forest', 'ocean', 'mountain', 'tree', 'flower', 'sky', 'sun', 'moon'],
    tech: ['technology', 'digital', 'code', 'computer', 'software', 'ai', 'robot', 'cyber'],
    business: ['business', 'corporate', 'professional', 'company', 'startup', 'entrepreneur'],
    creative: ['art', 'creative', 'design', 'music', 'paint', 'dance', 'theater'],
    energy: ['energy', 'power', 'electric', 'dynamic', 'fast', 'speed', 'motion'],
    calm: ['calm', 'peaceful', 'relax', 'meditation', 'zen', 'quiet', 'serene'],
    luxury: ['luxury', 'premium', 'elegant', 'sophisticated', 'exclusive', 'gold'],
  };
  
  // Color palettes for different themes
  const colorSchemes = {
    nature: { bg: '#1e3a1e', text: '#a8e6a3' },
    tech: { bg: '#0a0e27', text: '#00d4ff' },
    business: { bg: '#1a1a2e', text: '#e0e0e0' },
    creative: { bg: '#2d1b3d', text: '#ff6ec7' },
    energy: { bg: '#1a0f0f', text: '#ff4444' },
    calm: { bg: '#1a2332', text: '#b8d4e8' },
    luxury: { bg: '#1a1610', text: '#ffd700' },
    default: { bg: '#0a0a0a', text: '#ffffff' }
  };
  
  // Detect theme
  for (const [theme, keywords] of Object.entries(themes)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return {
        mainMessage: text.slice(0, 100),
        backgroundColor: colorSchemes[theme].bg,
        textColor: colorSchemes[theme].text,
        theme: theme
      };
    }
  }
  
  return {
    mainMessage: text.slice(0, 100),
    backgroundColor: colorSchemes.default.bg,
    textColor: colorSchemes.default.text,
    theme: 'default'
  };
}

module.exports = {
  generateCreativeScenes,
  extractKeywords,
  analyzeThemes
};
