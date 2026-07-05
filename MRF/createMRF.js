function createMrfFile(audioBlob, deviceName, recordName, audioFormat) {
    // Create metadata object
    const metadata = {
        deviceName: deviceName || 'Unknown Device',
        recordName: recordName || "Programa inominado",
        audioFormat: audioFormat || 'mp3',
        createdAt: new Date().toISOString(),
        audioSize: audioArrayBuffer.byteLength
    };
    
    // Convert metadata to JSON string
    const metadataJson = JSON.stringify(metadata);
    
    // Create header with length prefix (4 bytes for metadata length)
    const metadataBytes = new TextEncoder().encode(metadataJson);
    const header = new Uint8Array(4 + metadataBytes.length);
    
    // Write metadata length as 4-byte big-endian integer
    const view = new DataView(header.buffer);
    view.setUint32(0, metadataBytes.length, false); // false = big-endian
    
    // Copy metadata bytes after the length
    header.set(metadataBytes, 4);
    
    // Read audio blob as array buffer
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function() {
            const audioArrayBuffer = reader.result;
            
            // Combine header and audio data
            const mrfData = new Uint8Array(
                header.length + audioArrayBuffer.byteLength
            );
            mrfData.set(header, 0);
            mrfData.set(new Uint8Array(audioArrayBuffer), header.length);
            
            // Create blob with MRF type
            const mrfBlob = new Blob([mrfData], { type: 'application/x-mrf' });
            resolve(mrfBlob);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(audioBlob);
    });
}

/**
 * Synchronous version for use with already converted array buffers
 * @param {ArrayBuffer} audioArrayBuffer - The audio data as ArrayBuffer
 * @param {string} deviceName - Name of the device
 * @param {string} deviceLocation - Location of the device
 * @param {string} audioFormat - Audio format
 * @returns {Blob} - MRF format blob
 */
function createMrfFileFromArrayBuffer(audioArrayBuffer, deviceName, recordName, audioFormat) {
    const metadata = {
        deviceName: deviceName || 'Unknown Device',
        recordName: recordName || "Programa inominado",
        audioFormat: audioFormat || 'mp3',
        createdAt: new Date().toISOString(),
        audioSize: audioArrayBuffer.byteLength
    };
    
    const metadataJson = JSON.stringify(metadata);
    const metadataBytes = new TextEncoder().encode(metadataJson);
    
    const header = new Uint8Array(4 + metadataBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, metadataBytes.length, false);
    header.set(metadataBytes, 4);
    
    const mrfData = new Uint8Array(
        header.length + audioArrayBuffer.byteLength
    );
    mrfData.set(header, 0);
    mrfData.set(new Uint8Array(audioArrayBuffer), header.length);
    
    return new Blob([mrfData], { type: 'application/x-mrf' });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createMrfFile, createMrfFileFromArrayBuffer };
}