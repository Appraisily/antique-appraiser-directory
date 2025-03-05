#!/bin/bash

echo "Running antique directory test (first 10 cities only)..."

# Run with test mode and structured data
./generate-antique-directory.sh --test --structured

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