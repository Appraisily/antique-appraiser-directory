#!/bin/bash

echo "Testing Perplexity API with hardcoded API key..."
echo "API Key: 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"

# Run the test script
node src/scripts/test-perplexity.js

# Check exit status
if [ $? -eq 0 ]; then
  echo "Perplexity API test completed successfully!"
else
  echo "Error: Perplexity API test failed!"
  exit 1
fi