let visualizerStarted = false;

let audioCtx = null;
let analyser = null;
let dataArray = null;
let source = null;
let effect = 1;

const waves = [];

let horizontal = false;

let lastKick = 0;
let bassEnergy = 0;

const MAX_WAVES = 5;
const POINTS = 96;

function detectKick(){

    analyser.getByteFrequencyData(dataArray);

    let bass = 0;

    for(let i=0;i<20;i++)
        bass += dataArray[i];

    bass /= 20;

    bassEnergy = bassEnergy * 0.93 + bass * 0.07;

    if(
        bass > bassEnergy + 18 &&
        performance.now() - lastKick > 140
    ){

        lastKick = performance.now();

        if(waves.length >= MAX_WAVES)
            waves.shift();

        waves.push({

            radius:10,

            alpha:1,

            strength:20 + bass/8,

            speed:2.2 + bass/70,

            seed:Math.random()*1000

        });

    }

}

async function initVisualizer() {

    if (audioCtx)
        return;

    audioCtx = new AudioContext();

    await audioCtx.resume();

    source = audioCtx.createMediaElementSource(audio);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.9;

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function startVisualizer() {

    if (visualizerStarted)
        return;

    visualizerStarted = true;

    function draw() {
        requestAnimationFrame(draw);

        ctx.fillStyle = "black";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        // Não desenha em modo retrato
        if(!horizontal)
            return;

        if(!playing){

            ctx.fillStyle = "white";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(
                "Clique em Play para ouvir a rádio",
                canvas.width/2,
                canvas.height/2
            );

            return;
        }

        if(!analyser || !dataArray)
            return;
        if(effect == 1){
            analyser.getByteFrequencyData(dataArray);

            const barWidth = canvas.width / dataArray.length;

            ctx.fillStyle = "#8f49da";
            for(let i=0;i<dataArray.length;i++){

                const h = (dataArray[i]/255)*canvas.height;


                ctx.fillRect(
                    i*barWidth,
                    canvas.height-h,
                    barWidth-1,
                    h
                );
            }
        } else if(effect == 2){

            analyser.getByteTimeDomainData(dataArray);

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#8f49da";

            ctx.beginPath();

            const sliceWidth = canvas.width / (dataArray.length - 1);

            let x = 0;

            for(let i = 0; i < dataArray.length; i++){

                // Converte 0-255 para 0-1
                const v = dataArray[i] / 255;

                // Centraliza no canvas
                const y = v * canvas.height;

                if(i === 0){
                    ctx.moveTo(x, y);
                }else{
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.stroke();
        }
    }

    draw();
}
