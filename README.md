# Antique Appraiser Directory Service

## Overview
This service creates and maintains a comprehensive directory of antique appraisers across major US cities. It uses Perplexity AI for data collection and OpenAI for structured data processing.

## Core Features

### 1. Data Collection
- Gathers detailed antique appraiser information using Perplexity AI
- Generates a comprehensive directory of appraisers for each city
- Supports both single-city and batch processing
- Includes details like specialties, contact information, and certifications

### 2. Directory Generation
- Complete directory of all cities in the list
- Individual city files for easy access
- Structured data for integration with other systems
- Local file storage without cloud dependencies

### 3. API Endpoints

#### Data Processing
```bash
# Process a single city
POST /api/antique-appraiser/process-structured-data/:city/:state

# Process all cities
POST /api/antique-appraiser/process-structured-data

# Process raw city data
POST /api/antique-appraiser/process-cities

# Generate complete directory for all cities
POST /api/antique-appraiser/generate-directory

# Generate structured directory from existing data
POST /api/antique-appraiser/generate-structured-directory
```

#### Data Retrieval
```bash
# Get city data
GET /api/antique-appraiser/:state/:city

# List cities in state
GET /api/antique-appraiser/state/:state

# Search cities
GET /api/antique-appraiser/search
```

### 4. Directory Generation Options

#### Using the All-Cities Script
```bash
# Generate directory for ALL cities (will take several hours)
./generate-all-cities.sh
```

#### Using the Batch Script (Recommended)
```bash
# Generate directory for a batch of 10 cities starting at index 0
./generate-batch.sh

# Specify batch size and start index
./generate-batch.sh --batch=20 --start=30

# Continue with the next batch (shown at the end of each batch)
./generate-batch.sh --batch=10 --start=50
```

#### Using the Test Script
```bash
# Generate directory for the first 3 cities (quick test)
node src/scripts/test-direct.js
```

#### Output Files
- `output/antique-appraisers-directory.json`: Contains the full directory (all-cities mode)
- `output/batch-X-Y.json`: Contains data for batch of cities (batch mode)
- `output/cities/*.json`: Individual JSON files for each city
- `output/directory-summary.json`: Summary of the directory generation (all-cities mode)

### 5. Data Structure
Each appraiser entry typically includes:
- Name and business details
- Specialties and expertise
- Contact information
- Years in business
- Certifications
- Service areas
- Pricing information

## Services Integration

### 1. Perplexity API
- Used for initial data gathering
- Provides comprehensive city-specific information
- Real-time data updates and verification
- API Key: `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` (hardcoded)

### 2. Local File Storage
- No cloud dependencies required
- Stores JSON files in the output directory
- Simple file structure for easy access and sharing
- Includes both raw and processed data

## Development

### Prerequisites
- Node.js 18+
- Perplexity API key (already hardcoded: `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`)

### Local Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Run one of the directory generation scripts

### Directory Generation Tips
1. For testing, use the test script to process just a few cities
2. For production, use the batch script to process cities in manageable chunks
3. For a complete run, use the all-cities script (but be prepared to wait several hours)
4. All scripts save results to the `output/` directory

## Response Format

### Single City Data
```json
{
  "city": "Chicago",
  "state": "Illinois",
  "content": "Detailed information about antique appraisers in Chicago...",
  "timestamp": "2023-06-21T12:34:56.789Z",
  "metadata": {
    "type": "antique_appraiser_data",
    "source": "perplexity",
    "processedAt": "2023-06-21T12:34:56.789Z"
  }
}
```

### Directory Data
```json
{
  "generated": "2023-06-21T12:34:56.789Z",
  "totalCities": 100,
  "cities": [
    {
      "name": "Chicago",
      "state": "Illinois",
      "slug": "chicago",
      "data": {
        // Single city data object (see above)
      }
    },
    // More cities...
  ]
}
```