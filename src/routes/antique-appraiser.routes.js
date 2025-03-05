const express = require('express');
const router = express.Router();
const dataService = require('../services/art-appraiser/data.service');
const storageService = require('../services/art-appraiser/storage.service');
const structuredDataService = require('../services/art-appraiser/structured-data.service');
const antiqueDirectoryService = require('../services/art-appraiser/antique-directory.service');
const citiesData = require('../services/art-appraiser/cities.json');

// Process structured data for a single city
router.post('/process-structured-data/:city/:state', async (req, res) => {
  try {
    const { city, state } = req.params;
    
    // Check if structured data already exists
    const exists = await storageService.hasStructuredData(city, state);
    if (exists) {
      return res.json({
        success: true,
        message: `Structured data already exists for ${city}, ${state}`,
        skipped: true
      });
    }

    console.log('[ANTIQUE-APPRAISER] Processing structured data for:', { city, state });
    const data = await structuredDataService.processCity(city, state);
    
    res.json({
      success: true,
      message: `Processed structured data for ${city}, ${state}`,
      data
    });
  } catch (error) {
    console.error('[ANTIQUE-APPRAISER] Error processing structured data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Process structured data for all cities
router.post('/process-structured-data', async (req, res) => {
  try {
    const citiesToProcess = citiesData.cities;
    console.log(`[ANTIQUE-APPRAISER] Processing structured data for ${citiesToProcess.length} cities`);

    const skipped = [];
    const results = [];
    const errors = [];

    for (const city of citiesToProcess) {
      console.log('[ANTIQUE-APPRAISER] Processing structured data for:', city.name);
      try {
        // Check if structured data already exists
        const exists = await storageService.hasStructuredData(city.name, city.state);
        if (exists) {
          skipped.push({
            city: city.name,
            state: city.state,
            reason: 'Data already exists'
          });
          continue;
        }

        // Process new data
        const data = await structuredDataService.processCity(city.name, city.state);
        results.push({
          city: city.name,
          state: city.state,
          success: true,
          data
        });
      } catch (error) {
        console.error(`[ANTIQUE-APPRAISER] Error processing structured data for ${city.name}:`, error);
        errors.push({
          city: city.name,
          state: city.state,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed structured data for ${citiesToProcess.length} cities`,
      processed: results.length,
      skipped: skipped.length,
      errors: errors.length,
      details: {
        processed: results,
        skipped,
        errors
      }
    });
  } catch (error) {
    console.error('[ANTIQUE-APPRAISER] Error processing structured data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Process all cities
router.post('/process-cities', async (req, res) => {
  try {
    const citiesToProcess = citiesData.cities;
    console.log(`[ANTIQUE-APPRAISER] Processing all ${citiesToProcess.length} cities`);

    const results = [];
    for (const city of citiesToProcess) {
      console.log('[ANTIQUE-APPRAISER] Processing city:', city.name);
      try {
        const data = await dataService.getCityData(city.name, city.state);
        results.push({
          city: city.name,
          state: city.state,
          success: true,
          data: data
        });
      } catch (error) {
        console.error(`[ANTIQUE-APPRAISER] Error processing ${city.name}:`, error);
        results.push({
          city: city.name,
          state: city.state,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${citiesToProcess.length} cities`,
      results
    });
  } catch (error) {
    console.error('[ANTIQUE-APPRAISER] Error processing cities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get data for a specific city
router.get('/:state/:city', async (req, res) => {
  try {
    const { city, state } = req.params;
    const data = await dataService.getCityData(city, state);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[ANTIQUE-APPRAISER] Error getting city data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all cities in a state
router.get('/state/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const cities = await storageService.listCities(state);
    res.json({ success: true, cities });
  } catch (error) {
    console.error('[ANTIQUE-APPRAISER] Error listing cities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search cities by criteria
router.get('/search', async (req, res) => {
  try {
    const { state, region, population, specialty } = req.query;
    const results = await storageService.searchCities({
      state,
      region,
      population: population ? parseInt(population) : undefined,
      specialty
    });
    res.json({ success: true, results });
  } catch (error) {
    console.error('[ANTIQUE-APPRAISER] Error searching cities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate directory of antique appraisers for all cities
router.post('/generate-directory', async (req, res) => {
  try {
    // Initialize the directory service with the API key
    const apiKey = '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';
    const testMode = req.body.testMode === true; // Default to false
    await antiqueDirectoryService.initialize(apiKey, testMode);
    
    // Generate the full directory
    const skipExisting = req.body.skipExisting !== false; // Default to true
    console.log(`[ANTIQUE-APPRAISER] Generating directory (skipExisting=${skipExisting}, testMode=${testMode})`);
    
    // Start the process in the background
    const generationPromise = antiqueDirectoryService.generateFullDirectory(skipExisting);
    
    // Respond immediately
    res.json({
      success: true,
      message: 'Directory generation started',
      details: {
        skipExisting,
        testMode,
        totalCities: testMode ? 10 : citiesData.cities.length
      }
    });
    
    // Continue processing without waiting for response
    await generationPromise;
    console.log('[ANTIQUE-APPRAISER] Directory generation completed');
  } catch (error) {
    console.error('[ANTIQUE-APPRAISER] Error generating directory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate structured directory from existing data
router.post('/generate-structured-directory', async (req, res) => {
  try {
    // Initialize the directory service with the API key
    const apiKey = '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';
    const testMode = req.body.testMode === true; // Default to false
    await antiqueDirectoryService.initialize(apiKey, testMode);
    
    console.log(`[ANTIQUE-APPRAISER] Generating structured directory (testMode=${testMode})`);
    
    // Start the process in the background
    const generationPromise = antiqueDirectoryService.generateStructuredDirectory();
    
    // Respond immediately
    res.json({
      success: true,
      message: 'Structured directory generation started',
      details: {
        testMode,
        totalCities: testMode ? 10 : citiesData.cities.length
      }
    });
    
    // Continue processing without waiting for response
    await generationPromise;
    console.log('[ANTIQUE-APPRAISER] Structured directory generation completed');
  } catch (error) {
    console.error('[ANTIQUE-APPRAISER] Error generating structured directory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;