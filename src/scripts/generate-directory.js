const antiqueDirectoryService = require('../services/art-appraiser/antique-directory.service');
const perplexityService = require('../services/perplexity.service');

// Hardcoded API key
const apiKey = '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';
// Use test mode flag
const testMode = process.argv.includes('--test');

async function generateDirectory() {
  console.log('Initializing directory generation process...');
  
  try {
    // Initialize the Perplexity service first
    await perplexityService.initialize();
    
    // Override the API key with the one provided
    perplexityService.apiKey = apiKey;
    console.log('Perplexity service initialized with provided API key');
    
    // Initialize our directory service
    await antiqueDirectoryService.initialize(apiKey, testMode);
    
    // Generate the full directory
    const skipExisting = process.argv.includes('--force') ? false : true;
    console.log(`Generating directory (skipExisting=${skipExisting})...`);
    
    // Start the generation process
    const results = await antiqueDirectoryService.generateFullDirectory(skipExisting);
    console.log(`Directory generated with ${results.cities.length} cities`);
    
    // Generate structured data if requested
    if (process.argv.includes('--structured')) {
      console.log('Generating structured directory...');
      const structuredResults = await antiqueDirectoryService.generateStructuredDirectory();
      console.log(`Structured directory generated with ${structuredResults.cities.length} cities`);
    }
    
    console.log('Directory generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating directory:', error);
    process.exit(1);
  }
}

// Run the generator
generateDirectory();