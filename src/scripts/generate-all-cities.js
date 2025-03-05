const fs = require('fs').promises;
const path = require('path');
const perplexityService = require('../services/perplexity.service');
const citiesData = require('../services/art-appraiser/cities.json');

/**
 * Generate directory of antique appraisers for all cities in the list
 * This script uses the Perplexity API directly and saves results to local files
 * without depending on Google Cloud Storage
 */
async function generateFullDirectory() {
  console.log('Generating antique appraiser directory for all cities...');
  
  // Use hardcoded Perplexity API key
  const apiKey = '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';
  perplexityService.apiKey = apiKey;
  
  // Get all cities from the list
  const allCities = citiesData.cities;
  console.log(`Will process ${allCities.length} cities`);
  
  // Create output directory structure
  const outputDir = path.join(__dirname, '../../output');
  const citiesDir = path.join(outputDir, 'cities');
  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(citiesDir, { recursive: true });
    console.log(`Created output directories: ${outputDir} and ${citiesDir}`);
  } catch (error) {
    console.log(`Output directories already exist`);
  }
  
  // Prepare directory data structure
  const directory = {
    generated: new Date().toISOString(),
    totalCities: allCities.length,
    cities: []
  };
  
  // Process each city
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < allCities.length; i++) {
    const city = allCities[i];
    try {
      console.log(`[${i+1}/${allCities.length}] Processing ${city.name}, ${city.state}...`);
      
      // Get data from Perplexity
      console.log(`- Querying Perplexity API...`);
      const rawResponse = await perplexityService.getAntiqueAppraiserData(city.name, city.state);
      
      console.log(`- Received response (${rawResponse.length} characters)`);
      
      // Process the data
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
      
      // Save to individual city file
      const cityFilePath = path.join(citiesDir, `${city.slug}.json`);
      await fs.writeFile(cityFilePath, JSON.stringify(processedData, null, 2));
      console.log(`- Saved data to ${cityFilePath}`);
      
      // Add to directory
      directory.cities.push({
        name: city.name,
        state: city.state,
        slug: city.slug,
        data: processedData
      });
      
      successCount++;
      
      // Add a delay to avoid rate limiting (3 seconds between requests)
      if (i < allCities.length - 1) {
        console.log(`- Waiting 3 seconds before next request...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error) {
      console.error(`ERROR processing ${city.name}, ${city.state}: ${error.message}`);
      directory.cities.push({
        name: city.name,
        state: city.state,
        slug: city.slug,
        error: error.message
      });
      errorCount++;
    }
  }
  
  // Save the complete directory
  const directoryFilePath = path.join(outputDir, 'antique-appraisers-directory.json');
  await fs.writeFile(directoryFilePath, JSON.stringify(directory, null, 2));
  console.log(`\nSaved complete directory to ${directoryFilePath}`);
  
  // Create a summary file
  const summaryFilePath = path.join(outputDir, 'directory-summary.json');
  const summary = {
    generated: directory.generated,
    totalCities: allCities.length,
    successCount,
    errorCount,
    citiesList: directory.cities.map(city => ({
      name: city.name,
      state: city.state,
      hasData: !city.error
    }))
  };
  
  await fs.writeFile(summaryFilePath, JSON.stringify(summary, null, 2));
  console.log(`Saved summary to ${summaryFilePath}`);
  
  console.log(`\nDirectory generation completed!`);
  console.log(`- Total cities: ${allCities.length}`);
  console.log(`- Successful: ${successCount}`);
  console.log(`- Failed: ${errorCount}`);
  
  return directory;
}

// Run the generator
console.log('Starting directory generation process...');
generateFullDirectory().catch(error => {
  console.error('Error generating directory:', error);
  process.exit(1);
});