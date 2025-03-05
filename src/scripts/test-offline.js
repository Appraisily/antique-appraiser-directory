const fs = require('fs').promises;
const path = require('path');

/**
 * Test script that generates a mock directory of antique appraisers
 * This works completely offline without any API calls or Google Cloud dependencies
 */
async function generateMockDirectory() {
  console.log('Generating mock antique appraiser directory...');
  
  // Get the first 10 cities from the cities.json file
  const citiesJsonPath = path.join(__dirname, '../services/art-appraiser/cities.json');
  const citiesData = JSON.parse(await fs.readFile(citiesJsonPath, 'utf8'));
  const testCities = citiesData.cities.slice(0, 10);
  
  console.log(`Generating directory for ${testCities.length} cities in test mode`);
  
  // Create the directory structure
  const directory = {
    generated: new Date().toISOString(),
    testMode: true,
    cities: []
  };
  
  // Generate mock data for each city
  for (const city of testCities) {
    console.log(`Processing ${city.name}, ${city.state}`);
    
    // Create mock raw data
    const rawData = {
      city: city.name,
      state: city.state,
      content: `
# Antique Appraisers in ${city.name}, ${city.state}

## Overview
${city.name} has a rich community of antique appraisers specializing in various types of collectibles, artwork, and historical artifacts.

## Directory of Antique Appraisers

1. **${city.name} Antique Appraisals**
   - Specializes in European and American antiques
   - Over 15 years of experience
   - Certified by the American Society of Appraisers
   - Contact: (555) 123-4567, www.${city.slug}-antiques.com
   - Pricing: $300-500 per hour

2. **${city.name} Heritage Appraisers**
   - Focus on Asian art, porcelain, and vintage jewelry
   - USPAP compliant
   - Contact: (555) 987-6543, www.${city.slug}heritage.com
   - Pricing: $250 per hour
      `,
      timestamp: new Date().toISOString(),
      metadata: {
        type: 'antique_appraiser_data',
        source: 'test_mode',
        processedAt: new Date().toISOString()
      }
    };
    
    // Create mock structured data
    const structuredData = {
      appraisers: [
        {
          name: `${city.name} Antique Appraisals`,
          specialties: ["European Art", "American Antiques", "Furniture"],
          pricing: "$300-$500 per hour",
          services_offered: ["Insurance Appraisals", "Estate Valuations"],
          certifications: ["ASA", "USPAP"],
          years_in_business: 15,
          city: city.name,
          state: city.state,
          phone: "555-123-4567",
          website: `www.${city.slug}-antiques.com`,
          notes: "This is test data generated in test mode."
        },
        {
          name: `${city.name} Heritage Appraisers`,
          specialties: ["Asian Art", "Porcelain", "Jewelry"],
          pricing: "$250 per hour",
          services_offered: ["Authentication", "Valuation"],
          certifications: ["ISA"],
          years_in_business: 8,
          city: city.name,
          state: city.state,
          phone: "555-987-6543",
          website: `www.${city.slug}heritage.com`,
          notes: "This is test data generated in test mode."
        }
      ]
    };
    
    // Add to directory
    directory.cities.push({
      name: city.name,
      state: city.state,
      slug: city.slug,
      data: rawData
    });
  }
  
  // Create structured directory
  const structuredDirectory = {
    generated: new Date().toISOString(),
    testMode: true,
    cities: directory.cities.map(city => ({
      name: city.name,
      state: city.state,
      slug: city.slug,
      data: {
        appraisers: [
          {
            name: `${city.name} Antique Appraisals`,
            specialties: ["European Art", "American Antiques", "Furniture"],
            pricing: "$300-$500 per hour",
            services_offered: ["Insurance Appraisals", "Estate Valuations"],
            certifications: ["ASA", "USPAP"],
            years_in_business: 15,
            city: city.name,
            state: city.state,
            phone: "555-123-4567",
            website: `www.${city.slug}-antiques.com`,
            notes: "This is test data generated in test mode."
          },
          {
            name: `${city.name} Heritage Appraisers`,
            specialties: ["Asian Art", "Porcelain", "Jewelry"],
            pricing: "$250 per hour",
            services_offered: ["Authentication", "Valuation"],
            certifications: ["ISA"],
            years_in_business: 8,
            city: city.name,
            state: city.state,
            phone: "555-987-6543",
            website: `www.${city.slug}heritage.com`,
            notes: "This is test data generated in test mode."
          }
        ]
      }
    }))
  };
  
  // Save the directories to JSON files
  const outputDir = path.join(__dirname, '../../');
  await fs.writeFile(path.join(outputDir, 'antique-appraisers-directory.json'), JSON.stringify(directory, null, 2));
  await fs.writeFile(path.join(outputDir, 'antique-appraisers-structured-directory.json'), JSON.stringify(structuredDirectory, null, 2));
  
  console.log('Mock directories generated successfully:');
  console.log('  - antique-appraisers-directory.json');
  console.log('  - antique-appraisers-structured-directory.json');
}

// Run the mock generator
generateMockDirectory().catch(error => {
  console.error('Error generating mock directory:', error);
  process.exit(1);
});