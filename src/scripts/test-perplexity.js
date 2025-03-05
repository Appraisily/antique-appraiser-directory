const perplexityService = require('../services/perplexity.service');

// Test the Perplexity API with a simple query
async function testPerplexityAPI() {
  // API key from command line or environment
  const apiKey = process.argv[2] || process.env.PERPLEXITY_API_KEY || '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';
  
  console.log('Testing Perplexity API...');
  console.log(`Using API key: ${apiKey.substring(0, 5)}...`);
  
  try {
    // Initialize the service
    perplexityService.apiKey = apiKey;
    
    // Test prompt
    const cityName = 'Chicago';
    const stateName = 'Illinois';
    
    console.log(`\nQuerying for antique appraisers in ${cityName}, ${stateName}...`);
    const result = await perplexityService.getAntiqueAppraiserData(cityName, stateName);
    
    console.log('\nAPI Response (truncated):');
    console.log('---------------------------------------------');
    console.log(result.substring(0, 500) + '...');
    console.log('---------------------------------------------');
    
    console.log('\nTest completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing Perplexity API:', error);
    process.exit(1);
  }
}

// Run the test
testPerplexityAPI();