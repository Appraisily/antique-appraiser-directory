#!/bin/bash

echo "===================================================="
echo "  Antique Appraiser Directory - Batch Generation"
echo "===================================================="
echo

# Default values
BATCH_SIZE=10
START_INDEX=0

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --batch=*)
      BATCH_SIZE="${1#*=}"
      shift
      ;;
    --start=*)
      START_INDEX="${1#*=}"
      shift
      ;;
    *)
      # Unknown option
      echo "Unknown option: $1"
      echo "Usage: $0 [--batch=N] [--start=N]"
      echo "  --batch=N  : Number of cities to process in this batch (default: 10)"
      echo "  --start=N  : Starting index in the cities list (default: 0)"
      exit 1
      ;;
  esac
done

echo "This script will generate a directory of antique appraisers"
echo "for a batch of cities in the cities.json file."
echo
echo "Using Perplexity API key: pplx-8kRG...tRB2"
echo "Batch size: $BATCH_SIZE"
echo "Start index: $START_INDEX"
echo
echo "===================================================="
echo

# Create output directory if it doesn't exist
mkdir -p output
mkdir -p output/cities

# Run the generation script
echo "Starting batch directory generation..."
echo "Output will be saved to the output/ directory"
echo
echo "You can monitor progress in the console."
echo "Press Ctrl+C at any time to stop the process."
echo

node src/scripts/generate-batch.js --batch=$BATCH_SIZE --start=$START_INDEX

# Check exit status
if [ $? -eq 0 ]; then
  echo -e "\nBatch directory generation completed successfully!"
  echo "Output files:"
  echo "  - output/batch-*.json (batch data)"
  echo "  - output/cities/ (individual city files)"
else
  echo "Error: Batch generation failed or was interrupted!"
  echo "Partial results may be available in the output/ directory."
  exit 1
fi