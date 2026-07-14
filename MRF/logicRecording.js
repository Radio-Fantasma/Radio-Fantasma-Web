// Main application logic
let mediaRecorder;
let audioChunks = [];
let recordedBlob;
let mrfDB = null;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('RadioFantasmaDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('recordings')) {
                const store = db.createObjectStore('recordings', { keyPath: 'id', autoIncrement: true });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
    });
}

async function saveMrfToIndexedDB(mrfBlob, metadata) {
    if (!mrfDB) mrfDB = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = mrfDB.transaction(['recordings'], 'readwrite');
        const store = transaction.objectStore('recordings');
        const request = store.add({
            blob: mrfBlob,
            metadata: metadata,
            createdAt: metadata.createdAt
        });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function startRecording() {
    document.getElementById('pop-up-recorder').style.display = 'none';
    document.getElementById('recordWarning').style.display = 'block';
    if (mediaRecorder && mediaRecorder.state === 'recording') return;

    const stream = audio.captureStream();
    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = async () => {
        recordedBlob = new Blob(audioChunks, {
            type: mediaRecorder.mimeType
        });
        await saveAsMrf();
        const recordBtn = document.getElementById('button-record');
        const stopBtn = document.getElementById('button-stop');
        if (recordBtn) recordBtn.style.display = 'block';
        if (stopBtn) stopBtn.style.display = 'none';
    };

    audio.play();
    mediaRecorder.start();

    const recordBtn = document.getElementById('button-record');
    const stopBtn = document.getElementById('button-stop');
    if (recordBtn) recordBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'block';
}

function stopRecording() {
    document.getElementById('recordWarning').style.display = 'none';
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

async function saveAsMrf() {
    if (!recordedBlob) {
        showStatus('Nenhuma gravacao encontrada para salvar.', 'error');
        return;
    }

    const recordNameInput = document.getElementById('record-name');
    const recordDescriptionInput = document.getElementById('record-description');
    const deviceName = navigator.userAgent;
    const recordName = recordNameInput ? recordNameInput.value : 'Programa inominado';
    const recordDescription = recordDescriptionInput ? recordDescriptionInput.value : '';
    const format = "mp3";

    try {
        const mrfBlob = await createMrfFile(recordedBlob, deviceName, recordName, recordDescription, format);
        const metadata = {
            deviceName: deviceName || 'Unknown Device',
            recordName: recordName || "Programa inominado",
            recordDescription: recordDescription || "",
            audioFormat: format || 'mp3',
            createdAt: new Date().toISOString(),
            audioSize: recordedBlob.size
        };

        await saveMrfToIndexedDB(mrfBlob, metadata);

        //const url = URL.createObjectURL(mrfBlob);
        //const a = document.createElement('a');
        //a.href = url;
        //const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        //a.download = `gravacao-da-radio-${timestamp}.mrf`;
        //document.body.appendChild(a);
        //a.click();
        //document.body.removeChild(a);
        //URL.revokeObjectURL(url);

        showStatus('Gravação salva com sucesso!', 'success');
    } catch (error) {
        showStatus('Error creating MRF file: ' + error.message, 'error');
    }
}

function showStatus(message, type) {
    const status = document.createElement('div');
    status.className = `status ${type}`;
    status.textContent = message;
    document.querySelector('.container').appendChild(status);

    setTimeout(() => {
        status.remove();
    }, 5000);
}

async function getAllRecordings() {
    if (!mrfDB) mrfDB = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = mrfDB.transaction(['recordings'], 'readonly');
        const store = transaction.objectStore('recordings');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadRecordingToAudio(recordingId, recordingName, recordingDesc) {
    if (!mrfDB) mrfDB = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = mrfDB.transaction(['recordings'], 'readonly');
        const store = transaction.objectStore('recordings');
        const request = store.get(recordingId);
        request.onsuccess = async () => {
            const record = request.result;
            if (!record || !record.blob) {
                reject(new Error('Recording not found'));
                return;
            }
            try {
                const mrfData = await readMrfFile(record.blob);
                const audioUrl = URL.createObjectURL(mrfData.audioBlob);
                audio.src = audioUrl;
                audio.play();
                resolve({ id: recordingId, metadata: record.metadata });
            } catch (err) {
                reject(err);
            }
            document.getElementById("song-name").innerText = recordingName;
            document.getElementById("song-artist").innerText = recordingDesc;
            document.getElementById("song-name-horizontal").innerText = recordingName;
            document.getElementById("song-artist-horizontal").innerText = recordingDesc;
            playingRadio = false;
            document.getElementById("button-play-live").style.display = "none";
            document.getElementById("button-play-live-side").style.display = "none";
        };
        request.onerror = () => reject(request.error);
    });
}

async function deleteRecording(recordingId) {
    if (!mrfDB) mrfDB = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = mrfDB.transaction(['recordings'], 'readwrite');
        const store = transaction.objectStore('recordings');
        const request = store.delete(recordingId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function renderRecordingsList() {
    const popup = document.getElementById('pop-up-recorder');
    let listContainer = document.getElementById('recordings-list');
    
    if (!listContainer) {
        const listDiv = document.createElement('div');
        listDiv.id = 'recordings-list';
        popup.querySelector('.pop-up').appendChild(listDiv);
        listContainer = listDiv;
    }
    
    try {
        const recordings = await getAllRecordings();
        if (recordings.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; color:#888;">Nenhuma gravação salva</p>';
            return;
        }
        
        listContainer.innerHTML = '';
        recordings.forEach(rec => {
            const item = document.createElement('div');
            item.classList.add("record-option");
            item.innerHTML = `
                <strong>${rec.metadata.recordName}</strong>
                <br><small>${new Date(rec.metadata.createdAt).toLocaleString()}</small>
                <br><small>${rec.metadata.recordDescription || ''}</small>
            `;
            item.onclick = async () => {
                try {
                    const result = await loadRecordingToAudio(
                        rec.id,
                        rec.metadata.recordName,
                        rec.metadata.recordDescription
                    );
                    document.getElementById('pop-up-recorder').style.display = 'none';
                } catch (err) {
                    showStatus('Erro ao carregar gravação: ' + err.message, 'error');
                }
            };
            listContainer.appendChild(item);
        });
        
    } catch (err) {
        listContainer.innerHTML = '<p style="color:red;">Erro ao carregar gravações</p>';
    }
}

function replayRecord(){
    hidePopUp();
    audio.play();
}

audio.addEventListener('ended', (event) => {
    if(audio.src == "audio.mp3"){
        document.getElementById("song-name").textContent = "Transmissor quebrado ou desligado T-T";
        document.getElementById("song-artist").innerHTML = "";
    }
    else{
        popUpOpen("Fim da Gravação", "A gravação acabou, deseja ouvir novamente ou voltar para a radio?<br><br><button class='btn btn-primary' style='width: 100%;' onclick='startPlayer()'>Voltar para a Radio</button><br><br><button class='btn btn-secondary' onclick='replayRecord()' style='width: 100%;'>Ouvir Novamente</button>");
    }
});