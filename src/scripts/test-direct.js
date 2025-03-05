const fs = require('fs').promises;
const path = require('path');
const perplexityService = require('../services/perplexity.service');

/**
 * Test script that directly fetches data from Perplexity and saves it locally
 * This bypasses the storage service which requires Google Cloud credentials
 */
async function directPerplexityTest() {
  console.log('Starting direct Perplexity API test...');
  
  // Get the first 3 cities from the cities.json file as a test
  const citiesJsonPath = path.join(__dirname, '../services/art-appraiser/cities.json');
  const citiesData = JSON.parse(await fs.readFile(citiesJsonPath, 'utf8'));
  const testCities = citiesData.cities.slice(0, 3);
  
  console.log(`Testing with ${testCities.length} cities: ${testCities.map(c => c.name).join(', ')}`);
  
  // Initialize the Perplexity service with hardcoded API key
  perplexityService.apiKey = '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';
  
  // Create the directory structure
  const directory = {
    generated: new Date().toISOString(),
    testMode: true,
    cities: []
  };
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, '../../output');
  try {
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
  } catch (error) {
    console.log(`Output directory already exists: ${outputDir}`);
  }
  
  // Process each city
  for (const city of testCities) {
    try {
      console.log(`Processing ${city.name}, ${city.state}...`);
      
      // Get raw data from Perplexity
      console.log(`Querying Perplexity API for ${city.name}, ${city.state}...`);
      const rawResponse = await perplexityService.getAntiqueAppraiserData(city.name, city.state);
      
      console.log(`Received response for ${city.name} (${rawResponse.length} characters)`);
      
      // Process the raw data
      const processedData = {
        city: city.name,
        state: city.state,
        content: rawResponse,
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'antique_appraiser_data',
          source: 'perplexity',
          processedAt: new Date().toISOString()
        }
      };
      
      // Add to directory
      directory.cities.push({
        name: city.name,
        state: city.state,
        slug: city.slug,
        data: processedData
      });
      
      // Save the individual city data
      const cityFilePath = path.join(outputDir, `${city.slug}.json`);
      await fs.writeFile(cityFilePath, JSON.stringify(processedData, null, 2));
      console.log(`Saved data for ${city.name} to ${cityFilePath}`);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error processing ${city.name}, ${city.state}:`, error.message);
      directory.cities.push({
        name: city.name,
        state: city.state,
        slug: city.slug,
        error: error.message
      });
    }
  }
  
  // Save the complete directory to a file
  const directoryFilePath = path.join(outputDir, 'antique-appraisers-directory.json');
  await fs.writeFile(directoryFilePath, JSON.stringify(directory, null, 2));
  console.log(`Saved directory to ${directoryFilePath}`);
  
  console.log('\nDirect Perplexity API test completed successfully!');
  console.log(`Processed ${testCities.length} cities and saved results to ${outputDir}`);
}

// Run the test
directPerplexityTest().catch(error => {
  console.error('Error running direct Perplexity API test:', error);
  process.exit(1);
});