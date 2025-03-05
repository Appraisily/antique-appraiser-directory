# Antique Appraiser Directory - Development Guide

## Commands
- Run server: `npm start` or `node src/server.js`
- Install dependencies: `npm install`
- Deploy: Check cloudbuild.yaml for deployment settings

## Code Style Guidelines
- **Modules**: Use CommonJS (require/exports) pattern
- **Architecture**: Service-based with dependency injection
- **Error Handling**: Use try/catch with proper error propagation
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Async**: Use async/await pattern for asynchronous operations
- **Types**: Use JSDoc comments for documenting types
- **Imports**: Group imports by external/internal/relative paths
- **Documentation**: Document service methods, API routes, and configuration
- **Response Format**: Standard structure with status, message, and data fields
- **Security**: Secrets managed via utils/secrets.js, never hardcode

## Project Structure
- `/src` - Main application code
  - `/config` - Configuration parameters
  - `/routes` - API endpoints
  - `/services` - Core business logic
  - `/utils` - Shared utilities