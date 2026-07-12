if(window.localStorage.getItem("jaLeuIntroducao") != 1){
    window.location.href = "guideTour.html";
}

let playing = false;

const audio = document.getElementById("radio-audio");
audio.crossOrigin = "anonymous";

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let lastMusicPlayed = "";
const albumArtCache = new Map();
const POLL_INTERVAL = 15000;
let activeRequest = false;
const FETCH_TIMEOUT = 10000;
var playingRadio = true;

async function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function getSongPlaying() {
    if (activeRequest) return;
    activeRequest = true;
    
    try {
        const url = "https://antom.tailf176e0.ts.net/api/nowplaying";
        
        const response = await fetchWithTimeout(url);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);

        const result = await response.json();
        const song = result[0].now_playing.song;

        if (song.title != lastMusicPlayed && playingRadio) {
            lastMusicPlayed = song.title;
            
            const displayArtist = song.artist === "Cássia Eller" ? "Cassia Eller" : song.artist;
            const displayAlbum = song.album === "Cássia Eller" ? "Cassia Eller" : song.album;
            const cacheKey = `${displayArtist}|${displayAlbum}`;
            
            let artUrl = albumArtCache.get(cacheKey);
            
            if (!artUrl) {
                try {
                    const artResponse = await fetchWithTimeout(
                        `https://www.theaudiodb.com/api/v1/json/123/searchalbum.php?s=${encodeURIComponent(displayArtist)}&a=${encodeURIComponent(displayAlbum)}`
                    );
                    
                    if (artResponse.ok) {
                        const artResult = await artResponse.json();
                        if (artResult.album && artResult.album[0] && artResult.album[0].strAlbumThumb) {
                            artUrl = artResult.album[0].strAlbumThumb;
                            albumArtCache.set(cacheKey, artUrl);
                        }
                    }
                } catch (err) {
                    console.warn(err);
                }
            }
            
            song.art = artUrl || "https://placehold.co/400?text=Sem+Arte";
            
            document.getElementById("song-name").textContent = song.title;
            document.getElementById("song-artist").textContent = displayArtist;
            document.getElementById("song-name-horizontal").textContent = song.title;
            document.getElementById("song-artist-horizontal").textContent = displayArtist;
            
            const cover = document.getElementById("music-cover");
            if (cover.src !== song.art) cover.src = song.art;
            
            const coverH = document.getElementById("music-cover-horizontal");
            if (coverH.src !== song.art) coverH.src = song.art;
        }
    } catch (error) {
        let msg1, msg2;
        try {
            await fetchWithTimeout("https://example.com");
            msg1 = "Erro de conexão";
            msg2 = "Infelizmente nosso transmissor web foi danificado ou desligado.<i>#RF_NET_02</i>";
        } catch {
            msg1 = "Erro de conexão";
            msg2 = "Verifique sua internet ou contate o suporte. Pode ser nossa culpa isso tambem... <i>#RF_NET_01</i>";
        }
        document.getElementById("music-cover").src = "https://placehold.co/400?text=Erro!!!";
        document.getElementById("song-name").textContent = msg1;
        document.getElementById("song-artist").innerHTML = msg2;
        console.error(error.message);
    } finally {
        activeRequest = false;
    }
}

function changeDisplay() {
    horizontal = window.innerWidth > window.innerHeight;

    document.getElementById("horizontal-mode").style.display =
        horizontal ? "block" : "none";

    document.getElementById("portait-mode").style.display =
        horizontal ? "none" : "block";

    canvas.width = 640;
    canvas.height = window.innerHeight - 84;
}

async function startPlayer() {
    hidePopUp();
    document.getElementById("button-play-live").style.display = "none";
    document.getElementById("button-play-live-side").style.display = "none";
    document.getElementById("loading-live").style.display = "block";
    document.getElementById("loading-live-side").style.display = "block";
    await initVisualizer();

    audio.removeAttribute("src");
    audio.load();
    audio.crossOrigin = "anonymous";
    audio.src = "https://antom.tailf176e0.ts.net/listen/radio_fantasma/radio.mp3?date=" + Date.now();

    await audio.play();
    
    playing = true;
    playingRadio = true;

    document.getElementById("loading-live").style.display = "none";
    document.getElementById("loading-live-side").style.display = "none";
    getSongPlaying();
}

changeDisplay();
startVisualizer();

window.addEventListener("resize", changeDisplay);

document.addEventListener('swiped-left', e => {
    if (e.target == document.getElementById("visualizer") && effect < 2) effect += 1;
});

window.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' && effect < 1) {
        effect += 1;
        event.preventDefault();
    } else if (event.key === 'ArrowLeft' && effect > 1) {
        effect -= 1;
        event.preventDefault();
    }
});

document.addEventListener('swiped-right', e => {
    if (e.target == document.getElementById("visualizer") && effect > 1) effect -= 1;
});

function errorForTemplate() {
    document.getElementById("pop-up").style.display = "block";
    document.getElementById("pop-up-title").innerHTML = "Ei! Parece que isso ainda não ta pronto...";
    document.getElementById("pop-up-content").innerHTML = "<center><p>Poise, o programador é um preguiçoso e ainda não fez isso...</p><br><img src='https://images.steamusercontent.com/ugc/2480995803949848059/D50BF0F0ECAFDC4E113781EEB008F374C67BAA0F/?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true' style='height: 150px;'><br><p>aborgue</p></center>";
}

function popUpOpen(title, content) {
    document.getElementById("pop-up").style.display = "block";
    document.getElementById("pop-up-title").innerHTML = title;
    document.getElementById("pop-up-content").innerHTML = content;
}

function showSchedule() {
    document.getElementById("pop-up").style.display = "block";
    document.getElementById("pop-up-title").innerHTML = "Programação";
    document.getElementById("pop-up-content").innerHTML = `
        <table style="width:100%">
            <tr>
                <th>Programa 1</th><th>12:00 - 18:30</th>
            </tr>
        </table>
    `;
}

let deferredPrompt = null;

function hidePopUp() {
    document.getElementById('pop-up').style.display = 'none';
}

window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;

    document.getElementById("pop-up").style.display = "block";
    document.getElementById("pop-up-title").innerHTML = "Instalar o App";
    document.getElementById("pop-up-content").innerHTML = "Você pode instalar o app da rádio em seu celular para aproveitar o máximo. <br><br><button class='btn btn-primary' style='width: 45%; margin-right: 30px;' onclick='callInstallPrompt()'>Instalar</button><button class='btn btn-secondary' style='width: 45%;' onclick='hidePopUp()'>Nem ferrando!!!</button>";
});

function openRecordContainer() {
    document.getElementById("pop-up-recorder").style.display = "block";
    if (typeof renderRecordingsList === 'function') {
        renderRecordingsList();
    }
}

async function callInstallPrompt() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
        console.log("Usuário aceitou instalar.");
    } else {
        console.log("Usuário cancelou.");
    }
    
    deferredPrompt = null;
    document.getElementById("installButton").style.display = "none";
};

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js", {
        updateViaCache: "none"
    });
}

getSongPlaying();
setInterval(getSongPlaying, POLL_INTERVAL);
