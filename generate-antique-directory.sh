#!/bin/bash

# Hardcoded API key
API_KEY="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"

echo "Starting antique appraiser directory generation..."
echo "Using Perplexity API key: ${API_KEY:0:5}..."

# Set options based on arguments
OPTIONS=""
if [[ "$*" == *"--force"* ]]; then
  OPTIONS="$OPTIONS --force"
  echo "Force mode: ON (will regenerate all cities)"
fi

if [[ "$*" == *"--structured"* ]]; then
  OPTIONS="$OPTIONS --structured"
  echo "Structured mode: ON (will generate structured JSON directory)"
fi

if [[ "$*" == *"--test"* ]]; then
  OPTIONS="$OPTIONS --test"
  echo "Test mode: ON (will only process first 10 cities)"
fi

# Run the script
echo "Running with options: $OPTIONS"
node src/scripts/generate-directory.js "$API_KEY" $OPTIONS

# Check exit status
if [ $? -eq 0 ]; then
  echo "Directory generation completed successfully!"
  echo "Output files:"
  echo "  - antique-appraisers-directory.json"
  if [[ "$*" == *"--structured"* ]]; then
    echo "  - antique-appraisers-structured-directory.json"
  fi
else
  echo "Error: Directory generation failed!"
  exit 1
fi