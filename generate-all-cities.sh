#!/bin/bash

echo "===================================================="
echo "  Antique Appraiser Directory - Full Generation"
echo "===================================================="
echo
echo "This script will generate a directory of antique appraisers"
echo "for ALL cities in the cities.json file."
echo
echo "Using Perplexity API key: pplx-8kRGV...VtRB2"
echo
echo "WARNING: This will take a significant amount of time!"
echo "There are over 100 cities to process, and each request takes"
echo "several seconds. The entire process could take 5-6 hours."
echo
echo "===================================================="
echo

# Confirm with the user
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p output
mkdir -p output/cities

# Run the generation script
echo "Starting directory generation for all cities..."
echo "Output will be saved to the output/ directory"
echo
echo "You can monitor progress in the console."
echo "Press Ctrl+C at any time to stop the process."
echo "(Progress will be saved for cities already processed)"
echo

node src/scripts/generate-all-cities.js

# Check exit status
if [ $? -eq 0 ]; then
  echo -e "\nDirectory generation completed successfully!"
  echo "Output files:"
  echo "  - output/antique-appraisers-directory.json (complete directory)"
  echo "  - output/directory-summary.json (summary data)"
  echo "  - output/cities/ (individual city files)"
  
  # Show a summary
  echo -e "\nSummary:"
  grep -E "totalCities|successCount|errorCount" output/directory-summary.json
else
  echo "Error: Directory generation failed or was interrupted!"
  echo "Partial results may be available in the output/ directory."
  exit 1
fi