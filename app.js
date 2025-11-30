// app.js - Main application logic for RNA-seq Analysis Platform

// ============================================================================
// CONFIGURATION
// ============================================================================

// This will be loaded from config.js
// const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// ============================================================================
// FILE UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload files to Google Drive via Apps Script
 * @param {FileList} files - Files to upload
 * @param {string} email - User email for notifications
 * @param {function} progressCallback - Progress update callback
 * @returns {Promise<string>} Job ID
 */
async function uploadFiles(files, email, progressCallback) {
    // Generate job ID
    const jobId = generateJobId();
    
    progressCallback(0, 'Creating job...');
    
    try {
        // Create job manifest first
        const fileNames = Array.from(files).map(f => f.name);
        await createJobManifest(jobId, email, fileNames);
        
        progressCallback(10, 'Uploading files...');
        
        // Upload each file
        const totalFiles = files.length;
        
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const fileProgress = ((i + 1) / totalFiles) * 80; // 10-90% for file uploads
            
            progressCallback(
                10 + fileProgress,
                `Uploading file ${i + 1} of ${totalFiles}...`,
                file.name
            );
            
            await uploadSingleFile(jobId, file);
        }
        
        progressCallback(95, 'Finalizing upload...');
        
        // Mark job as ready
        await markJobReady(jobId);
        
        progressCallback(100, 'Upload complete!');
        
        return jobId;
        
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error('Upload failed: ' + error.message);
    }
}

/**
 * Generate unique job ID
 */
function generateJobId() {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .substring(0, 15);
    return `job_${timestamp}`;
}

/**
 * Create job manifest in Google Drive
 */
async function createJobManifest(jobId, email, fileNames) {
    const manifest = {
        job_id: jobId,
        user_email: email,
        timestamp: new Date().toISOString(),
        files: fileNames,
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Apps Script
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'create_job',
            data: manifest
        })
    });
    
    // Note: no-cors mode doesn't allow reading response
    // Apps Script will throw error if failed
    return true;
}

/**
 * Upload single file
 */
async function uploadSingleFile(jobId, file) {
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks
    
    if (file.size <= chunkSize) {
        // Small file - upload directly
        return await uploadFileChunk(jobId, file, file.name, 0, 1);
    } else {
        // Large file - upload in chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            
            await uploadFileChunk(jobId, chunk, file.name, i, totalChunks);
        }
    }
}

/**
 * Upload file chunk to Apps Script
 */
async function uploadFileChunk(jobId, fileOrChunk, fileName, chunkIndex, totalChunks) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            const base64Data = e.target.result.split(',')[1];
            
            try {
                const response = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'upload_file',
                        data: {
                            job_id: jobId,
                            file_name: fileName,
                            file_data: base64Data,
                            chunk_index: chunkIndex,
                            total_chunks: totalChunks
                        }
                    })
                });
                
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(fileOrChunk);
    });
}

/**
 * Mark job as ready for processing
 */
async function markJobReady(jobId) {
    await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'mark_ready',
            data: {
                job_id: jobId
            }
        })
    });
}

// ============================================================================
// STATUS FUNCTIONS
// ============================================================================

/**
 * Get job status from Apps Script
 * @param {string} jobId - Job ID to check
 * @returns {Promise<object>} Status object
 */
async function getJobStatus(jobId) {
    try {
        const url = `${APPS_SCRIPT_URL}?action=get_status&job_id=${jobId}`;
        
        // Simple GET request - no custom headers to avoid CORS preflight
        const response = await fetch(url, {
            method: 'GET'
            // NO headers - they trigger CORS preflight
        });
        
        if (!response.ok) {
            throw new Error('Failed to get status');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data;
        
    } catch (error) {
        console.error('Status check error:', error);
        throw new Error('Could not retrieve job status: ' + error.message);
    }
}

// ============================================================================
// RESULTS FUNCTIONS
// ============================================================================

/**
 * Get job results from Apps Script
 * @param {string} jobId - Job ID
 * @returns {Promise<object>} Results object
 */
async function getJobResults(jobId) {
    try {
        const url = `${APPS_SCRIPT_URL}?action=get_results&job_id=${jobId}`;
        
        // Simple GET request - no custom headers to avoid CORS preflight
        const response = await fetch(url, {
            method: 'GET'
            // NO headers - they trigger CORS preflight
        });
        
        if (!response.ok) {
            throw new Error('Failed to get results');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data;
        
    } catch (error) {
        console.error('Results retrieval error:', error);
        throw new Error('Could not retrieve results: ' + error.message);
    }
}

/**
 * Get download URL for a specific file
 * @param {string} jobId - Job ID
 * @param {string} fileId - File ID from Google Drive
 * @returns {Promise<string>} Download URL
 */
async function getDownloadUrl(jobId, fileId) {
    try {
        const url = `${APPS_SCRIPT_URL}?action=get_download_url&job_id=${jobId}&file_id=${fileId}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to get download URL');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data.url;
        
    } catch (error) {
        console.error('Download URL error:', error);
        throw new Error('Could not get download URL: ' + error.message);
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate file is FASTQ format
 */
function isValidFastqFile(file) {
    const validExtensions = ['.fq.gz', '.fastq.gz'];
    return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Sleep function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// EXPORTS (if using modules)
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        uploadFiles,
        getJobStatus,
        getJobResults,
        getDownloadUrl
    };
}
