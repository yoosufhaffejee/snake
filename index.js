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
    return mySnakeIndices.length + (networkMode === 'host' ? Object.keys(hostConnections).length : 0);
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
        let sIndex = getAvailableSnakeIndex();
        if(sIndex === -1) {
            conn.on('open', () => {
                conn.send({ type: 'error', message: 'Room full' });
                setTimeout(() => conn.close(), 1000);
            });
            return;
        }
        
        let remoteSnake = clonedSnakes[sIndex];
        // Clean up ghost state
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
        
        if(getActivePlayerCount() <= 1) WinningScore = 999;
        else WinningScore = parseInt(document.getElementById('inptWinScore').value);
        
        hostConnections[conn.peer] = { conn: conn, snakeIndex: sIndex, snake: remoteSnake, isWaiting: waiting };
        
        conn.on('open', () => {
            conn.send({ type: 'welcome', snakeIndex: sIndex });
            // Instantly send current state in case game is paused or on Game Over screen
            conn.send({
                type: 'state',
                aliveSnakes: aliveSnakes,
                playerSnakes: playerSnakes,
                apples: apples,
                gameOver: gameOver,
                GameOverText: GameOverText
            });
        });
        
        conn.on('data', data => {
            if(data.type === 'input') {
                let hc = hostConnections[conn.peer];
                if(hc && !hc.isWaiting) {
                    let targetSnake = hc.snake;
                    if(targetSnake && aliveSnakes.includes(targetSnake)) {
                    if(data.key == 38) moveUp(targetSnake);
                    if(data.key == 40) moveDown(targetSnake);
                    if(data.key == 37) moveLeft(targetSnake);
                    if(data.key == 39) moveRight(targetSnake);
                    }
                }
            }
        });

        conn.on('close', () => {
            if(hostConnections[conn.peer]) {
                let s = hostConnections[conn.peer].snake;
                let idx = aliveSnakes.indexOf(s);
                if(idx > -1) {
                    s.parts.forEach((part, i) => {
                        if(i % 2 === 0) apples.push(new food("regular", "red", part.x, part.y));
                    });
                    aliveSnakes.splice(idx, 1);
                }
                let pIdx = playerSnakes.indexOf(s);
                if(pIdx > -1) playerSnakes.splice(pIdx, 1);
                delete hostConnections[conn.peer];
            }
        });
    });
}

window.joinGame = function() {
    let roomId = document.getElementById('joinInput').value.trim().toUpperCase();
    if(!roomId) return;
    networkMode = 'client';
    
    requestMobileFullscreen(); // Must be called synchronously with user click
    
    if (peer) {
        peer.destroy();
    }
    
    peer = new Peer();
    peer.on('open', () => {
        clientConn = peer.connect('SNAKE-' + roomId);
        clientConn.on('open', () => {
            roomIDDisplay.style.display = 'block';
            roomIDDisplay.innerText = "Connected to: " + roomId;
            lobbyModal.style.display = 'none';
            document.getElementById('btnAdd').style.display = 'none';
        });
        clientConn.on('data', data => {
            if (data.type === 'welcome') {
                mySnakeIndices = [data.snakeIndex];
            } else if (data.type === 'state') {
                renderNetworkState(data);
            } else if (data.type === 'error') {
                alert(data.message);
                location.reload();
            }
        });
        clientConn.on('close', () => {
            alert("Host disconnected. Please refresh to start a new game.");
            location.reload();
        });
    });
    peer.on('error', err => {
        if (err.type === 'peer-unavailable') {
            alert("Room not found! Please check the code and try again.");
        } else {
            alert("Connection error: " + err.type);
        }
        if (peer) {
            peer.destroy();
            peer = null;
        }
        networkMode = 'offline';
    });
}


// UI Functions
window.openSettings = function() {
    settingsModal.style.display = "block";
    if(networkMode !== 'client') isPaused = true;
    
    if (networkMode === 'client') {
        document.getElementById('rowSpeed').style.display = 'none';
        document.getElementById('rowWalls').style.display = 'none';
        document.getElementById('rowWinScore').style.display = 'none';
        document.getElementById('rowMidGame').style.display = 'none';
    } else {
        document.getElementById('rowSpeed').style.display = 'flex';
        document.getElementById('rowWalls').style.display = 'flex';
        document.getElementById('rowWinScore').style.display = 'flex';
        
        if (networkMode === 'offline') {
            document.getElementById('rowMidGame').style.display = 'none';
        } else {
            document.getElementById('rowMidGame').style.display = 'flex';
        }
        
        let disableHostSettings = (networkMode === 'host' && started && !gameOver);
        document.getElementById('inptSpeed').disabled = disableHostSettings;
        document.getElementById('inptWalls').disabled = disableHostSettings;
        document.getElementById('inptWinScore').disabled = disableHostSettings;
        document.getElementById('inptMidGame').disabled = disableHostSettings;
    }
}

window.closeSettings = function() {
    settingsModal.style.display = "none";
    if(networkMode !== 'client') isPaused = false;
}

window.updateSettings = function() {
    speed = parseInt(document.getElementById('inptSpeed').value);
    solidWalls = document.getElementById('inptWalls').checked;
    WinningScore = parseInt(document.getElementById('inptWinScore').value);
    let showDpad = document.getElementById('inptDpad').checked;
    allowMidGameJoin = document.getElementById('inptMidGame').checked;
    document.getElementById('dpad').style.display = showDpad ? 'flex' : 'none';
}

window.simKey = function(keyCode) {
    if(isPaused || (gameOver && networkMode !== 'client')) return;
    
    if(networkMode === 'client') {
        if(clientConn && clientConn.open) clientConn.send({ type: 'input', key: keyCode });
        return;
    }
    
    let p1 = playerSnakes[0];
    if(p1 && aliveSnakes.includes(p1)) {
        if(keyCode==38) moveUp(p1);
        if(keyCode==40) moveDown(p1);
        if(keyCode==37) moveLeft(p1);
        if(keyCode==39) moveRight(p1);
    }
}


window.handleRestart = function() {
    if (networkMode === 'client') return; 
    if (window.touchRestartTimeout) { clearTimeout(window.touchRestartTimeout); window.touchRestartTimeout = null; }
    reset();
    drawGame();
}

function reset()
{
    apples = [];
    keys = [];
    started = false;
    AppleInitialized = false;
    GameOverText = false;
    document.getElementById('gameOverModal').style.display = 'none';
    clonedSnakes = structuredClone(allSnakes);

    // Restore Player 1 controls
    clonedSnakes[0].controls = [38, 40, 37, 39];
    clonedSnakes[0].controls2 = [87, 83, 65, 68];

    // Restore local co-op controls
    for (let i = 0; i < buttonMappings.length; i++) {
        if (mySnakeIndices[i+1] !== undefined) {
            clonedSnakes[mySnakeIndices[i+1]].controls = buttonMappings[i]; 
        }
    }
    
    let activeIndices = [];
    if (networkMode === 'host' || networkMode === 'offline') {
        mySnakeIndices.forEach(idx => activeIndices.push(idx));
        for(let peerId in hostConnections) {
            activeIndices.push(hostConnections[peerId].snakeIndex);
        }
    } else {
        // Clients don't construct the logic list, but we can just use the previous length to avoid errors
        for (let i = 0; i < playerSnakes.length; i++) activeIndices.push(i);
    }
    
    activeIndices.sort((a, b) => a - b);
    
    playerSnakes = [];
    activeIndices.forEach(idx => {
        playerSnakes.push(clonedSnakes[idx]);
    });
    aliveSnakes = playerSnakes.slice();
    
    if (networkMode === 'host') {
        for(let peerId in hostConnections) {
            hostConnections[peerId].isWaiting = false;
            let sIndex = hostConnections[peerId].snakeIndex;
            hostConnections[peerId].snake = clonedSnakes[sIndex];
        }
    }
}

function generateScoreHTML(snakeList, myIndices) {
    let html = "";
    snakeList.forEach((snake) => {
        let isMe = myIndices.includes(snake.id);
        let style = `background-color: ${snake.headCol};`;
        if (isMe) {
            style += ` border: 2px solid white; box-shadow: 0 0 10px rgba(255,255,255,0.5); transform: scale(1.05);`;
        }
        let label = '';
        if (isMe) {
            label = (networkMode === 'host' || networkMode === 'offline') ? ' (Local)' : ' (You)';
        } else if (networkMode === 'client' && snake.id === 0) {
            label = ' (Host)';
        }
        html += `<div class="score-badge" style="${style}">${snake.name}${label}: ${snake.score}</div>`;
    });
    return html;
}

// Client specific render
function renderNetworkState(state) {
    clearScreen();
    
    state.apples.forEach(apple => {
        ctx.fillStyle= apple.col;
        ctx.fillRect(apple.x*gridSpacing, apple.y*gridSpacing, tileSize, tileSize);
    });
    
    state.aliveSnakes.forEach(snake => {
        ctx.fillStyle=snake.BodyCol;
        for(let i=0;i<snake.parts.length;i++){
            let part=snake.parts[i];
            ctx.fillRect(part.x *gridSpacing, part.y *gridSpacing, tileSize,tileSize);
        }
        ctx.fillStyle=snake.headCol;
        ctx.fillRect(snake.headX* gridSpacing,snake.headY* gridSpacing, tileSize,tileSize);
    });

    document.getElementById('scoreboard').innerHTML = generateScoreHTML(state.playerSnakes, mySnakeIndices);

    if (state.gameOver && state.GameOverText) {
        displayGameOverText(state.aliveSnakes, state.playerSnakes);
    } else {
        document.getElementById('gameOverModal').style.display = 'none';
    }
}

function drawGame(){
    if (networkMode === 'client') return; // Client does not run the loop
    
    if(isPaused) {
        pause();
    } else {
        txtPause.hidden = true;
    }

    clearScreen();
    drawSnakes();
    drawApple();
    checkCollision();
    drawScore();

    let stop = isGameOver();
    
    if (stop) {
        clearScreen();
        drawSnakes();
        drawApple();
        drawScore();
    }
    
    if (networkMode === 'host') {
        let waitingIndices = [];
        for(let peerId in hostConnections) {
            if(hostConnections[peerId].isWaiting) waitingIndices.push(hostConnections[peerId].snakeIndex);
        }
        let state = {
            type: 'state',
            aliveSnakes: aliveSnakes,
            playerSnakes: playerSnakes,
            apples: apples,
            gameOver: gameOver,
            GameOverText: GameOverText,
            waitingIndices: waitingIndices,
            isPaused: isPaused,
            started: started
        };
        for(let peerId in hostConnections) {
            hostConnections[peerId].conn.send(state);
        }
    }

    if(stop === true) return;

    if (window.drawGameTimeout) clearTimeout(window.drawGameTimeout);
    window.drawGameTimeout = setTimeout(drawGame, 1000/speed);
}

function pause()
{
    aliveSnakes.forEach(snake => {
        snake.xVelocity = 0;
        snake.yVelocity = 0;
    });
    started = false;
    txtPause.innerText = "Game paused! Press 'Esc' to continue...";
    txtPause.hidden = false;
}

function isGameOver(){
    gameOver = false;
    let toRemove = [];

    aliveSnakes.forEach(snake => {
        if (snake.yVelocity === 0 && snake.xVelocity === 0) {
            return false;
        }

        if(started === false) {
            var countMovingPlayers = 0;
            aliveSnakes.forEach(snake => {
                if (snake.yVelocity !== 0 || snake.xVelocity !== 0) countMovingPlayers++;
            });
            if(countMovingPlayers === aliveSnakes.length && aliveSnakes.length > 0) started = true;
        }

        let otherSnakes = aliveSnakes.slice();
        let snakeIndex = aliveSnakes.indexOf(snake);
        otherSnakes.splice(snakeIndex, 1);

        otherSnakes.forEach(otherSnake => {
            let neck = snake.parts[snake.parts.length - 1];
            let otherNeck = otherSnake.parts[otherSnake.parts.length - 1];
            let headCollision = (snake.headX === otherSnake.headX && snake.headY === otherSnake.headY);
            let passedThrough = false;
            if (neck && otherNeck) {
                passedThrough = (snake.headX === otherNeck.x && snake.headY === otherNeck.y &&
                                 otherSnake.headX === neck.x && otherSnake.headY === neck.y);
            }

            if((headCollision || passedThrough) && started) {
                if(aliveSnakes.length <= 2) displayGameOverText(aliveSnakes, playerSnakes);

                if (snake.score > otherSnake.score) toRemove.push(otherSnake);
                else if(snake.score < otherSnake.score) toRemove.push(snake);
                else { toRemove.push(otherSnake); toRemove.push(snake); }
            }
        });

        if(snake.score >= WinningScore && getActivePlayerCount() > 1) {
            gameOver=true;
            if(isTouchDevice() && !window.touchRestartTimeout) {
                window.touchRestartTimeout = setTimeout(x => { window.touchRestartTimeout=null; reset(); drawGame(); }, 5000);
            }
        }

        if(solidWalls==true && started) wallCollision(snake, toRemove);

        CheckBodyColission(snake);
    });

    toRemove.forEach(s => {
        let idx = aliveSnakes.indexOf(s);
        if (idx > -1) {
            s.parts.forEach((part, i) => {
                if (i % 2 === 0) apples.push(new food("regular", "red", part.x, part.y));
            });
            aliveSnakes.splice(idx, 1);
        }
    });
    
    if (getActivePlayerCount() > 1 && started && aliveSnakes.length <= 1) {
        gameOver = true;
        if(isTouchDevice() && !window.touchRestartTimeout) {
            window.touchRestartTimeout = setTimeout(x => { window.touchRestartTimeout=null; reset(); drawGame(); }, 5000);
        }
    }

    if(gameOver && !GameOverText) displayGameOverText(aliveSnakes, playerSnakes);

    return gameOver;
}

function CheckBodyColission(snake)
{
    if (!started) return;
    for(let i=0; i<snake.parts.length;i++){
        let part=snake.parts[i];
        if(part.x===snake.headX && part.y===snake.headY){
            if(getActivePlayerCount() <= 1) {
                gameOver=true;
                if(isTouchDevice() && !window.touchRestartTimeout) {
                    window.touchRestartTimeout = setTimeout(x => { window.touchRestartTimeout=null; reset(); drawGame(); }, 5000);
                }
                return;
            }
            let penalty = i + 1;
            snake.parts.splice(0, penalty);
            snake.tailLength-=penalty;
            snake.score-= penalty;
            break; 
        }
    } 
}

window.addSnake = function()
{
    if(getAvailableSnakeIndex() === -1) {
        alert("Max players allowed is 8");
    } else if(started === false && GameOverText === false) {
        isPaused = true;
        modalText.textContent = clonedSnakes[getAvailableSnakeIndex()].name + ": Tap key to bind 'Move Up'";
        modal.style.display = "block";
    }
}

document.addEventListener('keyup', setControls);

function setControls(e)
{
    if(modal.style.display == "block")
    {
        if(e.keyCode == 13 || e.keyCode == 32) return;
        if(e.keyCode == 27) {
            keys = [];
            modal.style.display = "none";
            isPaused = false;
            txtPause.hidden = true;
            return;
        }

        let keyAlreadyBound = false;
        clonedSnakes.forEach(snake => {
            if(snake.controls) snake.controls.forEach(key => { if(key === e.keyCode) keyAlreadyBound = true; });
            if(snake.controls2) snake.controls2.forEach(key => { if(key === e.keyCode) keyAlreadyBound = true; });
        });
        if (keyAlreadyBound) return;

        keys.push(e.keyCode);

        if(keys.length === 1) modalText.textContent = clonedSnakes[playerCount].name + ": Tap key to bind 'Move Down'";
        if(keys.length === 2) modalText.textContent = clonedSnakes[playerCount].name + ": Tap key to bind 'Move Left'";
        if(keys.length === 3) modalText.textContent = clonedSnakes[playerCount].name + ": Tap key to bind 'Move Right'";

        if(keys.length === 4) {
            clonedSnakes[playerCount].controls = keys;
            playerSnakes.push(clonedSnakes[playerCount]);
            aliveSnakes.push(clonedSnakes[playerCount]);
            if (networkMode !== 'client') mySnakeIndices.push(playerCount);
            playerCount++;
            buttonMappings.push(keys);
            keys = [];
            modal.style.display = "none";
            isPaused = false;
            txtPause.hidden = true;
        }

        if(playerCount === 1) WinningScore = 999;
        else WinningScore = parseInt(document.getElementById('inptWinScore').value);
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

function handleTouchMove(evt) {
    if (evt.target.tagName === 'BUTTON' || evt.target.tagName === 'INPUT') return;
    evt.preventDefault();
    if (!xDown || !yDown) return;

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (networkMode === 'client') {
            if (clientConn && clientConn.open) clientConn.send({ type: 'input', key: xDiff > 0 ? 37 : 39 });
        } else {
            if (xDiff > 0) moveLeft(playerSnakes[0]); else moveRight(playerSnakes[0]);
        }
    } else {
        if (networkMode === 'client') {
            if (clientConn && clientConn.open) clientConn.send({ type: 'input', key: yDiff > 0 ? 38 : 40 });
        } else {
            if (yDiff > 0) moveUp(playerSnakes[0]); else moveDown(playerSnakes[0]);
        }
    }
    xDown = null;
    yDown = null;
}

// Initial Settings sync
window.updateSettings();


// Hide the 'Add Local Snake' button on touch devices since they lack keyboards for local co-op
if (isTouchDevice()) {
    let btnAdd = document.getElementById('btnAdd');
    if(btnAdd) btnAdd.style.display = 'none';
}
