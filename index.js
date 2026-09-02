class snake{
    constructor(name, headCol, BodyCol, headX, headY, parts, tailLength, xVelocity, yVelocity, score){
        this.name=name;
        this.headCol=headCol;
        this.BodyCol=BodyCol;
        this.headX=headX;
        this.headY=headY;
        this.parts=parts;
        this.tailLength=tailLength;
        this.xVelocity=xVelocity;
        this.yVelocity=yVelocity;
        this.score=score;
        this.controls = [];
        this.controls2 = [];
        this.lastXVelocity = 0;
        this.lastYVelocity = 0;
    }
}

class snakePart{
    constructor(x, y){
        this.x=x;
        this.y=y;
    }
}

class food{
    constructor(type, col, x, y){
        this.type = type;
        this.col = col;
        this.x=x;
        this.y=y;
    }
}

const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

function applyRetinaFix() {
    let ratio = window.devicePixelRatio || 1;
    canvas.width = 600 * ratio;
    canvas.height = 600 * ratio;
    ctx.scale(ratio, ratio);
}
applyRetinaFix();

let audioCtx = null;
let frameAudio = [];

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, type, duration, vol=0.1) {}

function playEat() {
    if (!document.getElementById('inptSfx') || !document.getElementById('inptSfx').checked) return;
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; // Super soft sine wave
    osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6
    osc.frequency.exponentialRampToValueAtTime(1318.51, audioCtx.currentTime + 0.1); // E6
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playCrash() {
    if (!document.getElementById('inptSfx') || !document.getElementById('inptSfx').checked) return;
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle'; // Less harsh than sawtooth
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

function playGameOver() {
    if (!document.getElementById('inptSfx') || !document.getElementById('inptSfx').checked) return;
    if (!audioCtx) return;
    [60, 56, 53, 48].forEach((note, i) => {
        setTimeout(() => {
            if(!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440 * Math.pow(2, (note - 69) / 12), audioCtx.currentTime);
            
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        }, i * 250);
    });
}

const _ = 0;
const tracks = [
    // Track 1: Bouncy & Cheerful (C Major Pentatonic)
    [60, _, 64, 67, _, 64, 69, _, 67, _, 64, 62, 60, _, _, _],
    // Track 2: Relaxed & Dreamy (Ambient)
    [65, _, 64, _, 60, _, _, _, 65, _, 64, _, 67, _, _, _],
    // Track 3: Driving Arpeggios
    [69, 72, 76, 72, 67, 71, 74, 71, 65, 69, 72, 69, 64, 68, 71, 68]
];
let currentTrack = tracks[Math.floor(Math.random() * tracks.length)];
let noteIdx = 0;

setInterval(() => {
    let musicInpt = document.getElementById('inptMusic');
    if (musicInpt && musicInpt.checked && started && !isPaused && !gameOver && audioCtx && audioCtx.state === 'running') {
        let note = currentTrack[noteIdx % currentTrack.length];
        if (note !== 0) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            
            osc.type = 'triangle'; // Soft instrument
            osc.frequency.setValueAtTime(440 * Math.pow(2, (note - 69) / 12), audioCtx.currentTime);
            
            filter.type = 'lowpass';
            filter.frequency.value = 1200; // Roll off high frequencies
            
            // Soft ADSR envelope
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.03); // gentle attack
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25); // long pleasant decay
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
        noteIdx++;
    }
}, 160); // slightly slower tempo (160ms) for a more relaxed feel

document.addEventListener('click', () => { initAudio(); }, {once:true});
document.addEventListener('touchstart', () => { initAudio(); }, {once:true});

const modal = document.getElementById("myModal");
const modalText = document.getElementById("modalText");
const btn = document.getElementById("btnAdd");
const txtPause = document.getElementById("txtPause");
const settingsModal = document.getElementById("settingsModal");
const lobbyModal = document.getElementById("lobbyModal");
const roomIDDisplay = document.getElementById("roomIdDisplay");

let keys = [];

// Settings
let isPaused = false;
let speed = 12;
let canvasSize = 600;
let solidWalls = false;
let WinningScore = 25;
let allowMidGameJoin = false;

let lives = 1;
let gameOver=false;
let buttonMappings = [];

function getActivePlayerCount() {
    let remoteCount = 0;
    if (networkMode === 'host') {
        for (let p in hostConnections) {
            if (hostConnections[p].snakeIndex !== -1) remoteCount++;
        }
    }
    return mySnakeIndices.length + remoteCount;
}

function getAvailableSnakeIndex() {
    for (let i = 0; i < 8; i++) {
        if (mySnakeIndices.includes(i)) continue;
        let connected = false;
        for (let p in hostConnections) {
            if (hostConnections[p].snakeIndex === i) { connected = true; break; }
        }
        if (!connected) return i;
    }
    return -1;
}

canvas.width = canvasSize;
canvas.height = canvasSize;
let tileCount = 24; 
let gridSpacing = canvasSize / tileCount; 
let tileSize = gridSpacing - 3; 

const allSnakes = [
    new snake("Player1", "orange", "green", 5, 10, [new snakePart(-5, -5)], 1, 0, 0, 0),
    new snake("Player2", "yellow", "blue", 15, 10, [new snakePart(-5, -5)], 1, 0, 0, 0),
    new snake("Player3", "purple", "lime", 5, 5, [new snakePart(-5, -5)], 1, 0, 0, 0),
    new snake("Player4", "pink", "cyan", 15, 5, [new snakePart(-5, -5)], 1, 0, 0, 0),
    new snake("Player5", "tan", "lavender", 10, 5, [new snakePart(-5, -5)], 1, 0, 0, 0),
    new snake("Player6", "#FF7F50", "#36454F", 10, 15, [new snakePart(-5, -5)], 1, 0, 0, 0),
    new snake("Player7", "#FFFDD0", "navy", 5, 15, [new snakePart(-5, -5)], 1, 0, 0, 0),
    new snake("Player8", "teal", "silver", 15, 15, [new snakePart(-5, -5)], 1, 0, 0, 0)
];
allSnakes.forEach((s, i) => s.id = i);
let clonedSnakes = structuredClone(allSnakes);
let playerSnakes = [];
let aliveSnakes = [];
let apples = [];

let started = false;
let AppleInitialized = false;
let GameOverText = false;

// Network State
let networkMode = 'offline'; 
let peer = null;
let clientConn = null;
let hostConnections = {}; // peerId -> { conn, snakeIndex }
let mySnakeIndices = [];

function requestMobileFullscreen() {
    if (isTouchDevice()) {
        let elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {});
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen().catch(err => {});
        }
    }
}

function initPlayer1() {
    if(getActivePlayerCount() > 0) return;
    let p1 = clonedSnakes[0];
    p1.controls = [38, 40, 37, 39]; // Arrows
    p1.controls2 = [87, 83, 65, 68]; // WASD
    if (!playerSnakes.includes(p1)) playerSnakes.push(p1);
    if (!aliveSnakes.includes(p1)) aliveSnakes.push(p1);
    if (!mySnakeIndices.includes(0)) mySnakeIndices.push(0);
    if(getActivePlayerCount() <= 1) WinningScore = 999;
}

// Multiplayer Lobby Functions
window.startOffline = function() {
    networkMode = 'offline';
    requestMobileFullscreen();
    lobbyModal.style.display = 'none';
    initPlayer1();
    drawGame();
}

window.startHost = function() {
    networkMode = 'host';
    requestMobileFullscreen();
    // (btnAdd remains visible for Host to add local players)
    
    let shortId = Math.random().toString(36).substring(2, 6).toUpperCase();
    peer = new Peer('SNAKE-' + shortId); 
    
    peer.on('open', id => {
        roomIDDisplay.style.display = 'block';
        roomIDDisplay.innerText = "Room ID: " + shortId;
        lobbyModal.style.display = 'none';
        initPlayer1();
        drawGame();
    });
    
    peer.on('connection', conn => {
        conn.on('open', () => {
            let sIndex = getAvailableSnakeIndex();
            if(sIndex === -1) {
                hostConnections[conn.peer] = { conn: conn, snakeIndex: -1, isWaiting: false, isSpectator: true };
                conn.send({ type: 'welcome', snakeIndex: -1, isSpectator: true });
                return;
            }
            
            let remoteSnake = clonedSnakes[sIndex];
            remoteSnake.parts = [new snakePart(remoteSnake.headX, remoteSnake.headY)];
            remoteSnake.tailLength = 1;
            remoteSnake.score = 0;
            remoteSnake.controls = [-1, -1, -1, -1]; 
            remoteSnake.xVelocity = 0;
            remoteSnake.yVelocity = 0;
            
            let waiting = false;
            if (started && !allowMidGameJoin && !GameOverText) {
                waiting = true;
            } else {
                if (!playerSnakes.includes(remoteSnake)) playerSnakes.push(remoteSnake);
                if (!aliveSnakes.includes(remoteSnake)) aliveSnakes.push(remoteSnake);
            }
            
            hostConnections[conn.peer] = { conn: conn, snakeIndex: sIndex, snake: remoteSnake, isWaiting: waiting };
            
            if (!started) {
                if(getActivePlayerCount() <= 1) WinningScore = 999;
                else WinningScore = parseInt(document.getElementById('inptWinScore').value);
            }
            
            conn.send({ type: 'welcome', snakeIndex: sIndex });
            conn.send({
                type: 'state',
                aliveSnakes: aliveSnakes,
                playerSnakes: playerSnakes,
                apples: apples,
                gameOver: gameOver,
                GameOverText: GameOverText,
                waitingIndices: waitingIndices,
                isPaused: isPaused,
                started: started,
                solidWalls: solidWalls,
                showGrid: document.getElementById('inptGrid') ? document.getElementById('inptGrid').checked : false,
                audioEvents: typeof frameAudio !== 'undefined' ? frameAudio : []
            });
        });
        if (keyAlreadyBound) return;

        keys.push(e.keyCode);
        
        let sIndex = getAvailableSnakeIndex();
        if (sIndex === -1) {
            keys = [];
            modal.style.display = "none";
            isPaused = false;
            txtPause.hidden = true;
            return;
        }

        if(keys.length === 1) modalText.textContent = clonedSnakes[sIndex].name + ": Tap key to bind 'Move Down'";
        if(keys.length === 2) modalText.textContent = clonedSnakes[sIndex].name + ": Tap key to bind 'Move Left'";
        if(keys.length === 3) modalText.textContent = clonedSnakes[sIndex].name + ": Tap key to bind 'Move Right'";

        if(keys.length === 4) {
            clonedSnakes[sIndex].controls = keys;
            clonedSnakes[sIndex].parts = [new snakePart(clonedSnakes[sIndex].headX, clonedSnakes[sIndex].headY)];
            clonedSnakes[sIndex].tailLength = 1;
            clonedSnakes[sIndex].score = 0;
            clonedSnakes[sIndex].xVelocity = 0;
            clonedSnakes[sIndex].yVelocity = 0;
            
            if (!playerSnakes.includes(clonedSnakes[sIndex])) playerSnakes.push(clonedSnakes[sIndex]);
            if (!aliveSnakes.includes(clonedSnakes[sIndex])) aliveSnakes.push(clonedSnakes[sIndex]);
            if (networkMode !== 'client') mySnakeIndices.push(sIndex);
            buttonMappings.push(keys);
            
            keys = [];
            modal.style.display = "none";
            isPaused = false;
            txtPause.hidden = true;
        }

        if (!started) {
            if(getActivePlayerCount() <= 1) WinningScore = 999;
            else WinningScore = parseInt(document.getElementById('inptWinScore').value);
        }
    }
}

function displayGameOverText(liveSnks, allSnks)
{
    GameOverText = true;
    let msg = "";

    if(allSnks.length === 1) {
        msg = "Score: " + (liveSnks[0] ? liveSnks[0].score : 0);
    } else if(liveSnks.length === 1) {
        msg = liveSnks[0].name + " Wins!";
    } else {
        let winner;
        let highestScore = -Infinity;
        let count = 0;
        
        liveSnks.forEach(snake => {
            if(snake.score !== count) count++;
        });

        if(count < 1) {
            msg = "Draw!";
        } else {
            liveSnks.forEach(snake => {
                if(snake.score >= highestScore) {
                    highestScore = snake.score;
                    winner = snake;
                }
            });
            msg = (winner ? winner.name : "Nobody") + " Wins!";
        }
    }
    
    document.getElementById('gameOverTitle').innerText = 'Game Over!';
    document.getElementById('gameOverMessage').innerText = msg;
    document.getElementById('gameOverModal').style.display = 'block';
    
    if (networkMode === 'client') {
        document.getElementById('btnRestart').style.display = 'none';
        document.getElementById('gameOverMessage').innerText += "\n\n(Waiting for Host to Restart)";
    } else {
        document.getElementById('btnRestart').style.display = 'block';
    }
}

function wallCollision(snake, toRemove)
{
    let dead = false;
    if(snake.headX<0) dead = true;
    else if(snake.headX===tileCount) dead = true;
    else if(snake.headY<0) dead = true;
    else if(snake.headY===tileCount) dead = true;

    if (dead) {
        if (typeof frameAudio !== 'undefined') frameAudio.push('crash'); if(networkMode !== 'client') playCrash();
        if(getActivePlayerCount() <= 1) {
            gameOver=true;
            if(isTouchDevice() && !window.touchRestartTimeout) {
                window.touchRestartTimeout = setTimeout(x => { window.touchRestartTimeout=null; reset(); drawGame(); }, 5000);
            }
        } else {
            if (!toRemove.includes(snake)) toRemove.push(snake);
        }
    }
}

function wallTeleport(snake)
{
    if(snake.headX<0) snake.headX=tileCount-1;
    else if(snake.headX===tileCount) snake.headX=0;
    else if(snake.headY<0) snake.headY=tileCount-1;
    else if(snake.headY===tileCount) snake.headY=0;
}

function drawScore(){
    document.getElementById('scoreboard').innerHTML = generateScoreHTML(playerSnakes, mySnakeIndices);
}

function clearScreen(){
    ctx.fillStyle= 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
 
function drawSnakes(){
    aliveSnakes.forEach(snake => {
        ctx.fillStyle=snake.BodyCol;
        for(let i=0;i<snake.parts.length;i++){
            let part=snake.parts[i];
            ctx.fillRect(part.x *gridSpacing, part.y *gridSpacing, tileSize,tileSize);
        }
        
        snake.parts.push(new snakePart(snake.headX,snake.headY));
        if(snake.parts.length>snake.tailLength){
            snake.parts.shift();
        }
    
        ctx.fillStyle=snake.headCol;
        ctx.fillRect(snake.headX* gridSpacing,snake.headY* gridSpacing, tileSize,tileSize);
        
        let eyesInpt = document.getElementById('inptEyes');
        if (eyesInpt && eyesInpt.checked) {
            ctx.fillStyle = 'white';
            let ex1, ey1, ex2, ey2;
            let hx = snake.headX * gridSpacing;
            let hy = snake.headY * gridSpacing;
            let ts = tileSize;
            if (snake.lastXVelocity === -1) { ex1 = hx+4; ey1 = hy+4; ex2 = hx+4; ey2 = hy+ts-8; }
            else if (snake.lastYVelocity === -1) { ex1 = hx+4; ey1 = hy+4; ex2 = hx+ts-8; ey2 = hy+4; }
            else if (snake.lastYVelocity === 1) { ex1 = hx+4; ey1 = hy+ts-8; ex2 = hx+ts-8; ey2 = hy+ts-8; }
            else { ex1 = hx+ts-8; ey1 = hy+4; ex2 = hx+ts-8; ey2 = hy+ts-8; } 
            ctx.fillRect(ex1, ey1, 4, 4);
            ctx.fillRect(ex2, ey2, 4, 4);
        }
        
        moveSnake(snake);
    });
}
 
function moveSnake(snake){
    snake.lastXVelocity = snake.xVelocity;
    snake.lastYVelocity = snake.yVelocity;
    snake.headX += snake.xVelocity;
    snake.headY += snake.yVelocity;
    if(solidWalls==false || !started) {
        wallTeleport(snake);
    }
}

function spawnApple() {
    let newX, newY;
    let onSnake = true;
    while(onSnake) {
        newX = randomPosition();
        newY = randomPosition();
        onSnake = false;
        aliveSnakes.forEach(snake => {
            if (snake.headX === newX && snake.headY === newY) onSnake = true;
            snake.parts.forEach(part => {
                if (part.x === newX && part.y === newY) onSnake = true;
            });
        });
    }
    
    let type = "regular";
    let col = "red";
    if (Math.random() < 0.15) {
        type = "golden";
        col = "gold";
    }
    apples.push(new food(type, col, newX, newY));
}
 
function drawApple(){
    if(started === true && AppleInitialized === false) {
        spawnApple();
    	AppleInitialized = true;
    }
    apples.forEach(apple => {
        ctx.fillStyle= apple.col;
        ctx.fillRect(apple.x*gridSpacing, apple.y*gridSpacing, tileSize, tileSize);
    });
}
 
function randomPosition() {
    return Math.floor(Math.random() * tileCount);
}

function checkCollision(){
    if (!started) return;
    aliveSnakes.forEach(snake => {
        for(let i = apples.length - 1; i >= 0; i--) {
            let apple = apples[i];
            if(apple.x==snake.headX && apple.y==snake.headY){
                if (typeof frameAudio !== 'undefined') frameAudio.push('eat'); if(networkMode !== 'client') playEat();
                apples.splice(i, 1);
                
                if (apple.type === "golden") {
                    snake.tailLength += 3;
                    snake.score += 3;
                } else {
                    snake.tailLength++;
                    snake.score++;
                }
                
                if (apples.length === 0) {
                    spawnApple();
                }
            }
        }
    });
}
 
document.body.addEventListener('keydown', keyDown);

function keyDown(event) {
    if(event.keyCode==13) {
        event.preventDefault();
        if (networkMode === 'client') return; 
        if (window.touchRestartTimeout) { clearTimeout(window.touchRestartTimeout); window.touchRestartTimeout = null; }
        reset();
        if(gameOver === true) drawGame();
    }
    if(event.keyCode==27) {
        if(modal.style.display !== "block" && settingsModal.style.display !== "block" && networkMode !== 'client') {
            isPaused = !isPaused;
        }
    }
    if(event.keyCode==32) {
        if (networkMode === 'offline') window.addSnake();
    }
    
    if(isPaused) return;
    
    if(networkMode === 'client') {
        let key = event.keyCode;
        if (key == 87 || key == 38) clientConn.send({ type: 'input', key: 38 });
        if (key == 83 || key == 40) clientConn.send({ type: 'input', key: 40 });
        if (key == 65 || key == 37) clientConn.send({ type: 'input', key: 37 });
        if (key == 68 || key == 39) clientConn.send({ type: 'input', key: 39 });
        return;
    }
   
    for (let i = 0; i < aliveSnakes.length; i++) {
        customMovement(aliveSnakes[i], aliveSnakes[i].controls, event);        
    }
}

function customMovement(snake, controls, event)
{
    if(controls != null) {
        if(event.keyCode==controls[0]) moveUp(snake);
        if(event.keyCode==controls[1]) moveDown(snake);
        if(event.keyCode==controls[2]) moveLeft(snake);
        if(event.keyCode==controls[3]) moveRight(snake);
    }
    if(snake.controls2 != null) {
        if(event.keyCode==snake.controls2[0]) moveUp(snake);
        if(event.keyCode==snake.controls2[1]) moveDown(snake);
        if(event.keyCode==snake.controls2[2]) moveLeft(snake);
        if(event.keyCode==snake.controls2[3]) moveRight(snake);
    }
}

function moveUp(snake) {
	if(snake.lastYVelocity==1) return;
    snake.yVelocity=-1; snake.xVelocity=0;
}
function moveDown(snake) {
	if(snake.lastYVelocity==-1) return;
    snake.yVelocity=1; snake.xVelocity=0;
}
function moveRight(snake) {
	if(snake.lastXVelocity==-1) return;
    snake.yVelocity=0; snake.xVelocity=1;
}
function moveLeft(snake) {
	if(snake.lastXVelocity==1) return;
    snake.yVelocity=0; snake.xVelocity=-1;
}

document.addEventListener('touchstart', handleTouchStart, {passive: false});        
document.addEventListener('touchmove', handleTouchMove, {passive: false});

function isTouchDevice() {
    return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
}

var xDown = null;                                                        
var yDown = null;

function getTouches(evt) {
  return evt.touches || evt.originalEvent.touches;
}

function handleTouchStart(evt) {
    if (evt.target.tagName === 'BUTTON' || evt.target.tagName === 'INPUT') return;
    evt.preventDefault();
    const firstTouch = getTouches(evt)[0];                                      
    xDown = firstTouch.clientX;                                      
    yDown = firstTouch.clientY;                                      
}

let lastTouchKey = -1;
function handleTouchMove(evt) {
    if (evt.target.tagName === 'BUTTON' || evt.target.tagName === 'INPUT') return;
    evt.preventDefault();
    if (!xDown || !yDown) return;

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;
    
    if (Math.abs(xDiff) < 30 && Math.abs(yDiff) < 30) return;
    
    let key = -1;
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        key = xDiff > 0 ? 37 : 39;
        if (networkMode !== 'client') {
            if (key===37) moveLeft(playerSnakes[0]); else moveRight(playerSnakes[0]);
        }
    } else {
        key = yDiff > 0 ? 38 : 40;
        if (networkMode !== 'client') {
            if (key===38) moveUp(playerSnakes[0]); else moveDown(playerSnakes[0]);
        }
    }
    
    if (networkMode === 'client' && key !== lastTouchKey) {
        if (clientConn && clientConn.open) clientConn.send({ type: 'input', key: key });
        lastTouchKey = key;
    }
    
    let contSwipe = document.getElementById('inptContSwipe');
    if (contSwipe && contSwipe.checked) {
        xDown = xUp;
        yDown = yUp;
    } else {
        xDown = null;
        yDown = null;
        lastTouchKey = -1; // reset on new swipe gesture
    }
}

// Initial Settings sync
window.updateSettings();


// Hide the 'Add Local Snake' button on touch devices since they lack keyboards for local co-op
if (isTouchDevice()) {
    let btnAdd = document.getElementById('btnAdd');
    if(btnAdd) btnAdd.style.display = 'none';
}
