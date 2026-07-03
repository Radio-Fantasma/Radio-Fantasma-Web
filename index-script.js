if(window.localStorage.getItem("jaLeuIntroducao") != 1){
    window.location.href = "guideTour.html";
}

let playing = false;

const audio = document.getElementById("radio-audio");
audio.crossOrigin = "anonymous";

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let lastMusicPlayed = "";

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js", {
        updateViaCache: "none"
    });
}

async function getSongPlaying(){
    const url = "https://antom.tailf176e0.ts.net/api/nowplaying";
    lastMusicPlayed = "";
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        
        const song = result[0].now_playing.song;

        if(song.title != lastMusicPlayed) {
            try{
                const response = await fetch(`https://www.theaudiodb.com/api/v1/json/123/searchalbum.php?s=${song.artist}&a=${song.album}`);

                if(!response.ok){
                    throw new Error(`Response status: bad`);
                }

                const result = await response.json();

                if(result.album[0].strAlbumThumb != null){
                    song.art = result.album[0].strAlbumThumb;
                }
            } catch (err){
                console.log(err);
            }
            
            document.getElementById("music-cover").src = song.art;
            document.getElementById("song-name").innerHTML = song.title;
            document.getElementById("song-artist").innerHTML = song.artist;
        
            document.getElementById("music-cover-horizontal").src = song.art;
            document.getElementById("song-name-horizontal").innerHTML = song.title;
            document.getElementById("song-artist-horizontal").innerHTML = song.artist; 
        }
    } catch (error) {
        try {
            const response = await fetch("https://example.com");
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            document.getElementById("music-cover").src = "https://placehold.co/400?text=Erro!!!";
            document.getElementById("song-name").innerHTML = "Erro de conexão";
            document.getElementById("song-artist").innerHTML = "Infelizmente nosso transmissor web foi danificado <i>#RF_NET_02</i>";
        } catch (error) {
            document.getElementById("music-cover").src = "https://placehold.co/400?text=Erro!!!";
            document.getElementById("song-name").innerHTML = "Erro de conexão";
            document.getElementById("song-artist").innerHTML = "Verifique sua internet ou contate o suporte. Pode ser nossa culpa isso tambem... <i>#RF_NET_01</i>";
        }
        console.error(error.message);
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

async function startPlayer(){
    await initVisualizer();

    audio.removeAttribute("src");

    audio.load();
    
    audio.crossOrigin = "anonymous";
    audio.src = "https://antom.tailf176e0.ts.net/listen/radio_fantasma/radio.mp3?date=" + Date.now();

    await audio.play();
    
    playing = true;

    document.getElementById("button-play-live").style.display = "none";
    document.getElementById("button-play-live-side").style.display = "none";
}

changeDisplay();

startVisualizer();

window.addEventListener("resize", changeDisplay);

document.addEventListener('swiped-left', function(e) {
    if(e.target == document.getElementById("visualizer") && effect < 2){
        effect += 1;
    };
});

window.addEventListener('keydown', (event) => {
    // Check for arrow key strings
    if (['ArrowRight'].includes(event.key) && effect < 1) {
        effect += 1;
        event.preventDefault();
    } else if (['ArrowLeft'].includes(event.key) && effect > 1) {
        effect -= 1;
        event.preventDefault();
    }
});

document.addEventListener('swiped-right', function(e) {
    if(e.target == document.getElementById("visualizer") && effect > 1){
        effect -= 1;
    };
});

function errorForTemplate(){
    document.getElementById("pop-up").style.display = "block";
    document.getElementById("pop-up-title").innerHTML = "Ei! Parece que isso ainda não ta pronto...";
    document.getElementById("pop-up-content").innerHTML = "<center><p>Poise, o programador é um preguiçoso e ainda não fez isso...</p><br><img src='https://images.steamusercontent.com/ugc/2480995803949848059/D50BF0F0ECAFDC4E113781EEB008F374C67BAA0F/?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true' style='height: 150px;'><br><p>aborgue</p></center>";
}

getSongPlaying();

setInterval(getSongPlaying, 6000);