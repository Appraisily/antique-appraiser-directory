const perplexityService = require('../perplexity.service');
const storageService = require('./storage.service');
const structuredDataService = require('./structured-data.service');
const dataService = require('./data.service');
const citiesData = require('./cities.json');
const fs = require('fs').promises;
const path = require('path');

class AntiqueDirectoryService {
  constructor() {
    // Hardcoded Perplexity API key
    this.apiKey = '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';
    this.outputFile = path.join(__dirname, '../../../antique-appraisers-directory.json');
    this.testMode = false;
  }

  /**
   * Initialize the service with the Perplexity API key
   * @param {string} apiKey - The Perplexity API key (optional, will use hardcoded key if not provided)
   * @param {boolean} testMode - If true, will only process first 10 cities
   */
  async initialize(apiKey, testMode = false) {
    try {
      // Use hardcoded key by default, but allow override
      this.apiKey = apiKey || this.apiKey;
      this.testMode = testMode;
      
      // Set the API key for the Perplexity service
      perplexityService.apiKey = this.apiKey;
      
      console.log('[ANTIQUE-DIRECTORY] Service initialized successfully');
      if (this.testMode) {
        console.log('[ANTIQUE-DIRECTORY] Running in TEST MODE - will only process first 10 cities');
      }
      
      return true;
    } catch (error) {
      console.error('[ANTIQUE-DIRECTORY] Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate antique appraiser data for all cities in the list
   * @param {boolean} skipExisting - Whether to skip cities that already have data
   * @returns {Promise<Object>} - The directory with all antique appraisers by city
   */
  async generateFullDirectory(skipExisting = true) {
    // If in test mode, only use the first 10 cities
    const citiesToProcess = this.testMode ? citiesData.cities.slice(0, 10) : citiesData.cities;
    console.log(`[ANTIQUE-DIRECTORY] Generating directory for ${citiesToProcess.length} cities ${this.testMode ? '(TEST MODE)' : ''}`);
    
    const directory = {
      generated: new Date().toISOString(),
      testMode: this.testMode,
      cities: []
    };
    
    for (const city of citiesToProcess) {
      try {
        console.log(`[ANTIQUE-DIRECTORY] Processing ${city.name}, ${city.state}`);
        
        // Check if data already exists
        if (skipExisting) {
          try {
            const existingData = await storageService.getData(city.name, city.state);
            if (existingData) {
              console.log(`[ANTIQUE-DIRECTORY] Data already exists for ${city.name}, ${city.state}`);
              
              const cityData = {
                name: city.name,
                state: city.state,
                slug: city.slug,
                data: existingData.data
              };
              
              directory.cities.push(cityData);
              continue;
            }
          } catch (storageError) {
            console.log(`[ANTIQUE-DIRECTORY] No existing data found or storage error: ${storageError.message}`);
          }
        }
        
        // Generate new data using Perplexity API
        console.log(`[ANTIQUE-DIRECTORY] Generating data for ${city.name}, ${city.state} using Perplexity API`);
        const data = await dataService.generateCityData(city.name, city.state);
        
        // Try to store in cloud storage
        try {
          await storageService.storeData(city.name, city.state, data);
        } catch (storageError) {
          console.warn(`[ANTIQUE-DIRECTORY] Failed to store data in cloud: ${storageError.message}`);
        }
        
        const cityData = {
          name: city.name,
          state: city.state,
          slug: city.slug,
          data: data
        };
        
        directory.cities.push(cityData);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`[ANTIQUE-DIRECTORY] Error processing ${city.name}, ${city.state}:`, error.message);
        directory.cities.push({
          name: city.name,
          state: city.state,
          slug: city.slug,
          error: error.message
        });
      }
    }
    
    // Save the complete directory to a file
    await this.saveDirectory(directory);
    
    return directory;
  }
  
  /**
   * Generate structured data for cities that already have raw data
   * @returns {Promise<Object>} - The structured directory
   */
  async generateStructuredDirectory() {
    // If in test mode, only use the first 10 cities
    const citiesToProcess = this.testMode ? citiesData.cities.slice(0, 10) : citiesData.cities;
    console.log(`[ANTIQUE-DIRECTORY] Generating structured directory for ${citiesToProcess.length} cities ${this.testMode ? '(TEST MODE)' : ''}`);
    
    const directory = {
      generated: new Date().toISOString(),
      testMode: this.testMode,
      cities: []
    };
    
    for (const city of citiesToProcess) {
      try {
        // Try to get raw data from storage
        let existingData;
        try {
          existingData = await storageService.getData(city.name, city.state);
          if (!existingData) {
            console.log(`[ANTIQUE-DIRECTORY] No raw data for ${city.name}, ${city.state}`);
            continue;
          }
        } catch (storageError) {
          console.log(`[ANTIQUE-DIRECTORY] Storage error: ${storageError.message}`);
          continue;
        }
        
        // Check if structured data already exists
        try {
          const hasStructured = await storageService.hasStructuredData(city.name, city.state);
          if (hasStructured) {
            console.log(`[ANTIQUE-DIRECTORY] Structured data exists for ${city.name}, ${city.state}`);
            const structuredData = await storageService.getGlobalData(city.name, city.state);
            
            directory.cities.push({
              name: city.name,
              state: city.state,
              slug: city.slug,
              data: structuredData
            });
            
            continue;
          }
        } catch (structureError) {
          console.log(`[ANTIQUE-DIRECTORY] Error checking structured data: ${structureError.message}`);
        }
        
        // Process structured data using the real service
        console.log(`[ANTIQUE-DIRECTORY] Processing structured data for ${city.name}, ${city.state}`);
        
        try {
          const structuredData = await structuredDataService.processCity(city.name, city.state);
          
          directory.cities.push({
            name: city.name,
            state: city.state,
            slug: city.slug,
            data: structuredData
          });
        } catch (processError) {
          console.error(`[ANTIQUE-DIRECTORY] Error processing data: ${processError.message}`);
          directory.cities.push({
            name: city.name,
            state: city.state,
            slug: city.slug,
            error: processError.message
          });
        }
        
      } catch (error) {
        console.error(`[ANTIQUE-DIRECTORY] Error processing structured data for ${city.name}, ${city.state}:`, error.message);
        directory.cities.push({
          name: city.name,
          state: city.state,
          slug: city.slug,
          error: error.message
        });
      }
    }
    
    // Save the structured directory
    await this.saveStructuredDirectory(directory);
    
    return directory;
  }
  
  /**
   * Save the directory to a JSON file
   * @param {Object} directory - The directory data
   */
  async saveDirectory(directory) {
    try {
      await fs.writeFile(this.outputFile, JSON.stringify(directory, null, 2));
      console.log(`[ANTIQUE-DIRECTORY] Directory saved to ${this.outputFile}`);
    } catch (error) {
      console.error('[ANTIQUE-DIRECTORY] Error saving directory:', error);
      throw error;
    }
  }
  
  /**
   * Save the structured directory to a JSON file
   * @param {Object} directory - The structured directory data
   */
  async saveStructuredDirectory(directory) {
    try {
      const outputFile = path.join(__dirname, '../../../antique-appraisers-structured-directory.json');
      await fs.writeFile(outputFile, JSON.stringify(directory, null, 2));
      console.log(`[ANTIQUE-DIRECTORY] Structured directory saved to ${outputFile}`);
    } catch (error) {
      console.error('[ANTIQUE-DIRECTORY] Error saving structured directory:', error);
      throw error;
    }
  }
}

module.exports = new AntiqueDirectoryService();