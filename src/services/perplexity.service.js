const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const contentStorage = require('../utils/storage');
const { secretNames } = require('../config');

class PerplexityService {
  constructor() {
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
    // Hardcoded API key - no need to load from secrets
    this.apiKey = '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';
  }

  async initialize() {
    try {
      // Simply use the hardcoded API key instead of loading from secrets
      console.log('[PERPLEXITY] Service initialized successfully with hardcoded API key');
      return true;
    } catch (error) {
      console.error('[PERPLEXITY] Service initialization failed:', error);
      throw error;
    }
  }

  async makeRequest(prompt, type, options = {}) {
    const {
      model = 'sonar',
      temperature = 0.2,
      top_p = 0.9,
      presence_penalty = 0,
      frequency_penalty = 1
    } = options;

    try {
      console.log(`[PERPLEXITY] Making ${type} request for prompt:`, prompt.substring(0, 100) + '...');

      const body = {
        model,
        messages: [
          { role: 'system', content: 'Be precise and concise.' },
          { role: 'user', content: prompt }
        ],
        temperature,
        top_p,
        search_domain_filter: null,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "year",
        top_k: 0,
        stream: false,
        presence_penalty,
        frequency_penalty,
        response_format: null
      };

      console.log('[PERPLEXITY] Request body:', JSON.stringify(body, null, 2));

      const response = await axios({
        method: 'POST',
        url: this.apiUrl,
        data: body,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[PERPLEXITY] Response status:', response.status);
      console.log('[PERPLEXITY] Response data:', JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response structure from Perplexity API');
      }

      const result = response.data.choices[0].message.content;

      if (!result) {
        throw new Error('No content in Perplexity response');
      }

      console.log('[PERPLEXITY] Raw response:', result.substring(0, 100) + '...');

      // Cache the result
      try {
        await this.cacheResult(prompt, result, type);
      } catch (cacheError) {
        console.warn('[PERPLEXITY] Failed to cache result:', cacheError.message);
      }

      return result;

    } catch (error) {
      // Log detailed error information
      console.error('[PERPLEXITY] API request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message
      });

      // Throw specific error based on response
      if (error.response?.status === 401) {
        throw new Error('Invalid Perplexity API key');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded for Perplexity API');
      } else if (error.response?.data?.error) {
        throw new Error(`Perplexity API error: ${error.response.data.error.message || error.response.data.error}`);
      }

      throw error;
    }
  }

  async getAntiqueAppraiserData(city, state) {
    const prompt = `Create a detailed directory of antique appraisers in ${city}, ${state}. Include:

1. Overview of antique appraisal services in ${city}
2. List as many antique appraisers as possible with their:
   - Name and business details
   - Specialties and expertise
   - Contact information
   - Years in business
   - Notable certifications
3. Service areas and typical pricing
4. Contact information and business hours

Keep the response concise and factual.`;

    return this.makeRequest(prompt, 'antique_appraiser', {
      model: 'sonar-reasoning-pro',
      temperature: 0.2,
      top_p: 0.9,
      presence_penalty: 0,
      frequency_penalty: 1
    });
  }

  async cacheResult(prompt, result, type) {
    const cacheData = {
      prompt,
      result,
      type,
      timestamp: new Date().toISOString()
    };

    try {
      // Make sure storage is initialized
      if (!contentStorage.isInitialized) {
        await contentStorage.initialize();
      }
      
      const hash = Buffer.from(prompt).toString('base64').substring(0, 32);
      const filePath = `perplexity/${type}/${hash}.json`;

      await contentStorage.storeContent(
        filePath,
        cacheData,
        { type: 'perplexity_result', resultType: type }
      );
      
      console.log('[PERPLEXITY] Successfully cached result to local storage');
    } catch (error) {
      console.warn('[PERPLEXITY] Failed to cache result:', error.message);
      // Continue even if caching fails - this is non-critical
    }
  }
}

module.exports = new PerplexityService();