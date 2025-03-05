#!/bin/bash

echo "Running offline test to generate mock antique appraiser directory..."
echo "This test does not require Google Cloud credentials or API access."

# Run the offline test script
node src/scripts/test-offline.js

# Check exit status
if [ $? -eq 0 ]; then
  echo "Test completed successfully!"
  echo "Output files:"
  echo "  - antique-appraisers-directory.json (test mode - 10 cities)"
  echo "  - antique-appraisers-structured-directory.json (test mode - 10 cities)"
  
  # Show a sample of the output
  echo -e "\nSample from antique-appraisers-directory.json:"
  head -n 30 antique-appraisers-directory.json
else
  echo "Error: Test failed!"
  exit 1
fi