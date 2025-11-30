// config.js - Configuration for RNA-seq Analysis Platform

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Deploy your Google Apps Script as a web app
 * 2. Copy the web app URL
 * 3. Replace YOUR_SCRIPT_ID_HERE with your actual script ID
 * 4. The URL format is: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
 * 
 * Example:
 * const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec';
 */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfSjbhX4dqAtptYecF-9zpAtKYSswn2cJQT0n28ndeZzwZRsBM0X_gaNH3f3AHmIbu4w/exec';

/**
 * Other configuration options
 */
const CONFIG = {
    // Maximum file size (5GB)
    MAX_FILE_SIZE: 5 * 1024 * 1024 * 1024,
    
    // Maximum number of files per job
    MAX_FILES_PER_JOB: 20,
    
    // Chunk size for large file uploads (10MB)
    UPLOAD_CHUNK_SIZE: 10 * 1024 * 1024,
    
    // Auto-refresh interval for status page (milliseconds)
    STATUS_REFRESH_INTERVAL: 10000,
    
    // Allowed file extensions
    ALLOWED_EXTENSIONS: ['.fq.gz', '.fastq.gz'],
    
    // App metadata
    APP_NAME: 'RNA-seq Analysis Platform',
    APP_VERSION: '1.0.0',
    GITHUB_REPO: 'https://github.com/yourusername/rnaseq-analysis'
};

// Validate configuration
if (APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID_HERE')) {
    console.warn('⚠️ Google Apps Script URL not configured!');
    console.warn('Please update config.js with your deployed Apps Script URL');
}
