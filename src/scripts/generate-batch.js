const fs = require('fs').promises;
const path = require('path');
const perplexityService = require('../services/perplexity.service');
const citiesData = require('../services/art-appraiser/cities.json');

/**
 * Generate directory of antique appraisers for a batch of cities in the list
 * This script uses the Perplexity API directly and saves results to local files
 * without depending on Google Cloud Storage
 */
async function generateBatchDirectory() {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  
  // Default batch size is 10
  let batchSize = 10;
  // Default start index is 0
  let startIndex = 0;
  
  // Parse batch size argument (--batch=N)
  const batchArg = args.find(arg => arg.startsWith('--batch='));
  if (batchArg) {
    batchSize = parseInt(batchArg.split('=')[1], 10);
    if (isNaN(batchSize) || batchSize < 1) {
      console.error('Invalid batch size. Using default: 10');
      batchSize = 10;
    }
  }
  
  // Parse start index argument (--start=N)
  const startArg = args.find(arg => arg.startsWith('--start='));
  if (startArg) {
    startIndex = parseInt(startArg.split('=')[1], 10);
    if (isNaN(startIndex) || startIndex < 0) {
      console.error('Invalid start index. Using default: 0');
      startIndex = 0;
    }
  }
  
  console.log(`Generating antique appraiser directory for batch of cities...`);
  console.log(`Batch size: ${batchSize}, Start index: ${startIndex}`);
  
  // Use hardcoded Perplexity API key
  const apiKey = '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';
  perplexityService.apiKey = apiKey;
  
  // Get all cities from the list
  const allCities = citiesData.cities;
  
  // Calculate end index and validate range
  const endIndex = Math.min(startIndex + batchSize, allCities.length);
  if (startIndex >= allCities.length) {
    console.error(`Start index (${startIndex}) exceeds the number of cities (${allCities.length})`);
    process.exit(1);
  }
  
  // Get the batch of cities to process
  const batchCities = allCities.slice(startIndex, endIndex);
  console.log(`Will process ${batchCities.length} cities (${startIndex} to ${endIndex - 1})`);
  
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
    batchInfo: {
      batchSize,
      startIndex,
      endIndex: endIndex - 1
    },
    totalCities: batchCities.length,
    cities: []
  };
  
  // Process each city
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < batchCities.length; i++) {
    const city = batchCities[i];
    try {
      console.log(`[${i+1}/${batchCities.length}] Processing ${city.name}, ${city.state}...`);
      
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
      if (i < batchCities.length - 1) {
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
  
  // Save the batch directory
  const batchFilePath = path.join(outputDir, `batch-${startIndex}-${endIndex-1}.json`);
  await fs.writeFile(batchFilePath, JSON.stringify(directory, null, 2));
  console.log(`\nSaved batch data to ${batchFilePath}`);
  
  console.log(`\nBatch processing completed!`);
  console.log(`- Total cities in batch: ${batchCities.length}`);
  console.log(`- Successful: ${successCount}`);
  console.log(`- Failed: ${errorCount}`);
  
  // Check if we've reached the end of the list
  if (endIndex >= allCities.length) {
    console.log(`\nAll cities have been processed!`);
  } else {
    console.log(`\nTo process the next batch, run:`);
    console.log(`node src/scripts/generate-batch.js --start=${endIndex} --batch=${batchSize}`);
  }
  
  return directory;
}

// Run the generator
console.log('Starting batch directory generation process...');
generateBatchDirectory().catch(error => {
  console.error('Error generating directory:', error);
  process.exit(1);
});