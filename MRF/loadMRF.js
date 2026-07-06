/**
 * MRF (Metadata Recording Format) File Reader
 * Reads .mrf files and extracts metadata and audio data
 */

/**
 * Reads an MRF file and extracts metadata and audio blob
 * @param {File|Blob} mrfFile - The MRF file to read
 * @returns {Promise<Object>} - Object containing metadata and audioBlob
 */
function readMrfFile(mrfFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function() {
            try {
                const arrayBuffer = reader.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                
                // Read metadata length (first 4 bytes, big-endian)
                const view = new DataView(uint8Array.buffer);
                const metadataLength = view.getUint32(0, false);
                
                // Extract metadata JSON
                const metadataBytes = uint8Array.slice(4, 4 + metadataLength);
                const metadataJson = new TextDecoder().decode(metadataBytes);
                const metadata = JSON.parse(metadataJson);
                
                // Extract audio data
                const audioData = uint8Array.slice(4 + metadataLength);
                const audioBlob = new Blob([audioData], { type: getMimeTypeFromFormat(metadata.audioFormat) });
                
                resolve({
                    metadata: metadata,
                    audioBlob: audioBlob
                });
            } catch (error) {
                reject(new Error('Failed to parse MRF file: ' + error.message));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read MRF file'));
        };
        
        reader.readAsArrayBuffer(mrfFile);
    });
}

/**
 * Gets MIME type from audio format string
 * @param {string} format - Audio format (mp3, wav, ogg)
 * @returns {string} - MIME type
 */
function getMimeTypeFromFormat(format) {
    const mimeTypes = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'mpeg': 'audio/mpeg'
    };
    return mimeTypes[format.toLowerCase()] || 'audio/mpeg';
}

/**
 * Validates if a file is a valid MRF file
 * @param {File|Blob} file - File to validate
 * @returns {Promise<boolean>} - True if valid MRF file
 */
function isValidMrfFile(file) {
    return new Promise((resolve) => {
        if (!file.name.toLowerCase().endsWith('.mrf')) {
            resolve(false);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function() {
            try {
                const uint8Array = new Uint8Array(reader.result);
                const view = new DataView(uint8Array.buffer);
                const metadataLength = view.getUint32(0, false);
                
                // Check if we have enough data for header
                if (uint8Array.length < 4 + metadataLength) {
                    resolve(false);
                    return;
                }
                
                // Try to parse metadata
                const metadataBytes = uint8Array.slice(4, 4 + metadataLength);
                const metadataJson = new TextDecoder().decode(metadataBytes);
                const metadata = JSON.parse(metadataJson);
                
                // Check required fields
                const hasRequiredFields = 
                    metadata.deviceName !== undefined &&
                    metadata.recordName !== undefined &&
                    metadata.recordDescription !== undefined &&
                    metadata.audioFormat !== undefined;
                
                resolve(hasRequiredFields);
            } catch (error) {
                resolve(false);
            }
        };
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(file.slice(0, 1024)); // Only read first 1KB for validation
    });
}

/**
 * Gets metadata from MRF file without loading full audio data
 * @param {File|Blob} mrfFile - The MRF file
 * @returns {Promise<Object>} - Metadata object
 */
function getMrfMetadata(mrfFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function() {
            try {
                const uint8Array = new Uint8Array(reader.result);
                const view = new DataView(uint8Array.buffer);
                const metadataLength = view.getUint32(0, false);
                
                const metadataBytes = uint8Array.slice(4, 4 + metadataLength);
                const metadataJson = new TextDecoder().decode(metadataBytes);
                const metadata = JSON.parse(metadataJson);
                
                resolve(metadata);
            } catch (error) {
                reject(new Error('Failed to read MRF metadata: ' + error.message));
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read MRF file'));
        reader.readAsArrayBuffer(mrfFile.slice(0, 10240)); // Read up to 10KB for metadata
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { readMrfFile, isValidMrfFile, getMrfMetadata };
}