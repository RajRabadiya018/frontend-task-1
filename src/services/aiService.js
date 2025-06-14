// AI Service for Auto Glossary Highlighting using Google Gemini (AI Only)

class AIService {
  constructor() {
    this.cache = new Map(); // Cache for API responses
    this.apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
    this.isProcessing = false;
    
    console.log('AIService initialized (AI Only Mode)');
    console.log('API Key configured:', this.isConfigured());
  }

  // Main method to extract and define terms from text using AI only
  async extractAndDefineTerms(text) {
    console.log('AI extractAndDefineTerms called with text length:', text?.length);
    
    if (!text || text.length < 20) {
      console.log('Text too short for AI analysis');
      return {};
    }

    if (!this.isConfigured()) {
      console.error('Google Gemini API key not configured');
      return {};
    }

    // Prevent multiple simultaneous requests
    if (this.isProcessing) {
      console.log('AI already processing, skipping');
      return {};
    }

    // Check cache first
    const cacheKey = this.hashText(text);
    if (this.cache.has(cacheKey)) {
      console.log('Returning cached AI result');
      return this.cache.get(cacheKey);
    }

    this.isProcessing = true;

    try {
      console.log('Starting AI processing with Gemini...');
      const aiTerms = await this.useGemini(text);
      console.log('AI processing complete. Terms found:', Object.keys(aiTerms).length);
      
      // Cache the result
      this.cache.set(cacheKey, aiTerms);
      
      return aiTerms;

    } catch (error) {
      console.error('Gemini API failed:', error.message);
      return {};
    } finally {
      this.isProcessing = false;
    }
  }

  // Google Gemini API implementation with correct model
  async useGemini(text) {
    if (!this.isConfigured()) {
      throw new Error('Google Gemini API key not configured');
    }

    console.log('Making Gemini API request...');

    const prompt = `Analyze the following text and identify important terms, concepts, technical words, acronyms, and specialized vocabulary that would benefit from definitions. 

For each identified term, provide a clear, concise definition (maximum 50 words). Focus on:
- Technical terms and jargon
- Business concepts and acronyms  
- Specialized vocabulary
- Important concepts that may not be familiar to all readers

Return ONLY a valid JSON object where keys are the identified terms (exactly as they appear in the text) and values are brief, clear definitions.

Text to analyze: "${text}"

Response format: {"term1": "definition1", "term2": "definition2"}`;

    // Updated API endpoint with correct model name
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1500,
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      
      // Try alternative model if the first one fails
      if (response.status === 404) {
        console.log('Trying alternative model...');
        return await this.useGeminiAlternative(text);
      }
      
      throw new Error(`Gemini API failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content received from Gemini API');
    }

    console.log('Raw Gemini response:', content);

    return this.parseGeminiResponse(content);
  }

  // Alternative model fallback
  async useGeminiAlternative(text) {
    console.log('Using alternative Gemini model...');
    
    const prompt = `Analyze this text and identify key terms with definitions. Return JSON format: {"term": "definition"}

Text: "${text}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alternative Gemini API error:', errorText);
      throw new Error(`Alternative Gemini API failed with status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content received from alternative Gemini API');
    }

    return this.parseGeminiResponse(content);
  }

  // Parse Gemini response
  parseGeminiResponse(content) {
    try {
      // Clean the response to extract JSON
      let cleanContent = content.trim();
      
      // Remove markdown code blocks if present
      cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      cleanContent = cleanContent.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      
      // Find JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No JSON found in Gemini response');
        return {};
      }

      const definitions = JSON.parse(jsonMatch[0]);
      
      // Validate the response
      if (typeof definitions !== 'object' || definitions === null) {
        throw new Error('Invalid response format from Gemini');
      }

      // Filter and clean definitions
      const validDefinitions = {};
      Object.entries(definitions).forEach(([term, definition]) => {
        if (typeof term === 'string' && typeof definition === 'string' && 
            term.length > 1 && term.length < 50 &&
            definition.length > 10 && definition.length < 300) {
          // Clean the term and definition
          const cleanTerm = term.trim().replace(/["""]/g, '');
          const cleanDefinition = definition.trim().replace(/["""]/g, '');
          validDefinitions[cleanTerm] = cleanDefinition;
        }
      });

      console.log('Valid AI definitions extracted:', Object.keys(validDefinitions));
      return validDefinitions;
      
    } catch (parseError) {
      console.warn('Failed to parse Gemini response:', parseError.message);
      console.log('Content that failed to parse:', content);
      return {};
    }
  }

  // Helper methods
  hashText(text) {
    let hash = 0;
    if (text.length === 0) return hash;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('AI cache cleared');
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }

  // Check if API is configured
  isConfigured() {
    return this.apiKey && 
           this.apiKey !== 'your_google_gemini_api_key_here' && 
           this.apiKey.length > 10;
  }

  // Get processing status
  isCurrentlyProcessing() {
    return this.isProcessing;
  }
}

export default new AIService();