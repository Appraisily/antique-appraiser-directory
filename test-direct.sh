#!/bin/bash

echo "Testing direct Perplexity API connection (bypassing storage service)..."
echo "This test will query 3 cities and save results to the output/ directory"

# Create output directory if it doesn't exist
mkdir -p output

# Run the direct test script
node src/scripts/test-direct.js

# Check exit status
if [ $? -eq 0 ]; then
  echo -e "\nTest completed successfully!"
  echo "Output files:"
  ls -l output/
  
  # Show a sample of the first file
  echo -e "\nSample from first city file:"
  head -n 30 output/*.json | head -n 30
else
  echo "Error: Test failed!"
  exit 1
fi