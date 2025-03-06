const fs = require('fs').promises;
const path = require('path');

class ContentStorage {
  constructor() {
    this.basePath = path.join(__dirname, '../../output');
    this.isInitialized = false;
    console.log('[STORAGE] Initializing local storage service at:', this.basePath);
  }

  async initialize() {
    try {
      // Create the base directory if it doesn't exist
      await fs.mkdir(this.basePath, { recursive: true });
      this.isInitialized = true;
      
      console.log('[STORAGE] Successfully initialized local storage at:', this.basePath);
      return true;
    } catch (error) {
      console.error('[STORAGE] Initialization failed for local storage:', error);
      throw error;
    }
  }

  async storeContent(filePath, content, metadata = {}) {
    console.log('[STORAGE] Starting content storage process:', {
      filePath,
      contentSize: JSON.stringify(content).length,
      metadata
    });

    // Auto-initialize if needed
    if (!this.isInitialized) {
      await this.initialize();
    }

    const fullPath = path.join(this.basePath, filePath);
    const dirPath = path.dirname(fullPath);
    
    // Create directory structure if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true });
    
    const fileMetadata = {
      contentType: 'application/json',
      metadata: {
        timestamp: new Date().toISOString(),
        contentLength: JSON.stringify(content).length,
        storagePath: filePath,
        ...metadata
      }
    };

    try {
      console.log('[STORAGE] Attempting to save file to:', fullPath);
      
      // Store content
      await fs.writeFile(
        fullPath, 
        JSON.stringify({
          content,
          metadata: fileMetadata.metadata
        }, null, 2)
      );
      
      console.log('[STORAGE] Successfully stored content to local file:', {
        filePath: fullPath,
        timestamp: fileMetadata.metadata.timestamp
      });

      return filePath;
    } catch (error) {
      console.error('[STORAGE] Failed to store content:', {
        filePath,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack
        }
      });
      throw error;
    }
  }

  async getContent(filePath) {
    const fullPath = path.join(this.basePath, filePath);
    console.log('[STORAGE] Attempting to retrieve content from:', fullPath);
    
    try {
      // Check if file exists before attempting to read
      try {
        await fs.access(fullPath);
      } catch (error) {
        throw new Error(`File not found: ${filePath}`);
      }

      console.log('[STORAGE] File found, retrieving content...');
      const contentRaw = await fs.readFile(fullPath, 'utf-8');
      
      const contentObj = JSON.parse(contentRaw);
      console.log('[STORAGE] Content retrieved successfully:', {
        filePath,
        contentSize: contentRaw.length
      });

      return contentObj.content;
    } catch (error) {
      console.error('[STORAGE] Error retrieving content:', {
        filePath,
        error: {
          message: error.message,
          stack: error.stack
        }
      });
      throw error;
    }
  }

  isValidJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Implement a compatible API with the bucket operations used
  get bucket() {
    return {
      // Mock the getFiles method used in storage.js
      getFiles: async ({ prefix }) => {
        const directory = path.join(this.basePath, prefix || '');
        
        try {
          // Recursively get all files in the directory structure
          const allFiles = await this.getAllFiles(directory);
          
          // Convert to format similar to Google Cloud Storage
          const files = allFiles.map(file => {
            const relativePath = file.replace(this.basePath + path.sep, '');
            return {
              name: relativePath.replace(/\\/g, '/'), // Normalize path separators
              getMetadata: async () => [{
                size: (await fs.stat(file)).size
              }]
            };
          });
          
          return [files];
        } catch (error) {
          console.error('[STORAGE] Error listing files:', error);
          return [[]];
        }
      },
      
      // Mock the file method
      file: (filePath) => {
        const fullPath = path.join(this.basePath, filePath);
        
        return {
          save: async (content, options) => {
            const dirPath = path.dirname(fullPath);
            await fs.mkdir(dirPath, { recursive: true });
            await fs.writeFile(fullPath, content);
            return [true];
          },
          exists: async () => {
            try {
              await fs.access(fullPath);
              return [true];
            } catch {
              return [false];
            }
          },
          download: async () => {
            const content = await fs.readFile(fullPath, 'utf-8');
            return [content];
          },
          getMetadata: async () => {
            const stats = await fs.stat(fullPath);
            return [{
              size: stats.size,
              metadata: {}
            }];
          }
        };
      }
    };
  }

  // Helper to recursively get all files in a directory
  async getAllFiles(directory) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(directory, entry.name);
        return entry.isDirectory() 
          ? await this.getAllFiles(fullPath) 
          : [fullPath];
      }));
      
      return files.flat();
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}

module.exports = new ContentStorage();