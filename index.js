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

let keys = [];

// Settings
let isPaused = false;
let speed = 12;
let canvasSize = 600;
let solidWalls = false;
let WinningScore = 25;

let lives = 1;
let gameOver=false;
let playerCount = 0;
let buttonMappings = [];

canvas.width = canvasSize;
canvas.height = canvasSize;
let tileCount = 24; // Actual number of grid squares (0 to 23)
let gridSpacing = canvasSize / tileCount; // 25 pixels per grid square
let tileSize = gridSpacing - 3; // 22 pixels for the snake body

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

let clonedSnakes = structuredClone(allSnakes);
let playerSnakes = [];
let aliveSnakes = [];
let apples = [];

let started = false;
let AppleInitialized = false;
let GameOverText = false;

// UI Functions
window.openSettings = function() {
    settingsModal.style.display = "block";
    isPaused = true;
}

window.closeSettings = function() {
    settingsModal.style.display = "none";
    isPaused = false;
}

window.updateSettings = function() {
    speed = parseInt(document.getElementById('inptSpeed').value);
    solidWalls = document.getElementById('inptWalls').checked;
    WinningScore = parseInt(document.getElementById('inptWinScore').value);
    let showDpad = document.getElementById('inptDpad').checked;
    document.getElementById('dpad').style.display = showDpad ? 'flex' : 'none';
}

window.simKey = function(keyCode) {
    if(isPaused || gameOver) return;
    let p1 = playerSnakes[0];
    if(p1 && aliveSnakes.includes(p1)) {
        if(keyCode==38) moveUp(p1);
        if(keyCode==40) moveDown(p1);
        if(keyCode==37) moveLeft(p1);
        if(keyCode==39) moveRight(p1);
    }
}

function reset()
{
    apples = [];
    keys = [];
    started = false;
    AppleInitialized = false;
    GameOverText = false;
    clonedSnakes = structuredClone(allSnakes);

    for (let i = 0; i < buttonMappings.length; i++) {
        clonedSnakes[i].controls = buttonMappings[i];
    }
    
    let lobbyPlayerCount = playerSnakes.length;
    playerSnakes = [];
    for (let index = 0; index < lobbyPlayerCount; index++) {
        playerSnakes.push(clonedSnakes[index]);
    }
    aliveSnakes = playerSnakes.slice();
}

function drawGame(){
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
    if(stop === true){
        return;
    }

    if (window.drawGameTimeout) clearTimeout(window.drawGameTimeout);
    window.drawGameTimeout = setTimeout(drawGame, 1000/speed);
}

function pause()
{
    aliveSnakes.forEach(snake => {
        snake.xVelocity = 0;
        snake.yVelocity = 0;
    });
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
            if(countMovingPlayers === aliveSnakes.length) started = true;
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
                if(aliveSnakes.length <= 2) displayGameOverText(aliveSnakes);

                if (snake.score > otherSnake.score) toRemove.push(otherSnake);
                else if(snake.score < otherSnake.score) toRemove.push(snake);
                else { toRemove.push(otherSnake); toRemove.push(snake); }
            }
        });

        if(snake.score >= WinningScore && playerCount > 1) {
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
            // Death Drops: turn every 2nd body part into an apple
            s.parts.forEach((part, i) => {
                if (i % 2 === 0) apples.push(new food("regular", "red", part.x, part.y));
            });
            aliveSnakes.splice(idx, 1);
        }
    });
    
    if (playerCount > 1 && started && aliveSnakes.length <= 1) {
        gameOver = true;
        if(isTouchDevice() && !window.touchRestartTimeout) {
            window.touchRestartTimeout = setTimeout(x => { window.touchRestartTimeout=null; reset(); drawGame(); }, 5000);
        }
    }

    if(gameOver && !GameOverText) displayGameOverText(aliveSnakes);

    return gameOver;
}

function CheckBodyColission(snake)
{
    for(let i=0; i<snake.parts.length;i++){
        let part=snake.parts[i];
        if(part.x===snake.headX && part.y===snake.headY){
            if(playerCount === 1) {
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
    if(playerCount >= 8) {
        alert("Max players allowed is 8");
    } else if(started === false && GameOverText === false) {
        isPaused = true;
        modalText.textContent = clonedSnakes[playerCount].name + ": Tap key to bind 'Move Up'";
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
            snake.controls.forEach(key => {
                if(key === e.keyCode) keyAlreadyBound = true;
            });
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

function displayGameOverText(aliveSnakes)
{
    GameOverText = true;
    ctx.fillStyle="white";
    ctx.font="50px verdana";
    ctx.fillText("Game Over!", canvas.width/6.5, canvas.height/2);

    if(playerSnakes.length === 1) {
        ctx.fillStyle=aliveSnakes[0] ? aliveSnakes[0].headCol : "white";
    	ctx.font="36px verdana";
    	ctx.fillText("Score: " + (aliveSnakes[0] ? aliveSnakes[0].score : 0), canvas.width/5.5, canvas.height/2 + 50);
        return;
    }

    if(aliveSnakes.length === 1) {
        ctx.fillStyle=aliveSnakes[0].headCol;
    	ctx.font="36px verdana";
    	ctx.fillText(aliveSnakes[0].name + " Wins!", canvas.width/5.5, canvas.height/2 + 50);
        return;
    }

    let winner;
    let highestScore = -Infinity;
    let count = 0;
    
    aliveSnakes.forEach(snake => {
        if(snake.score !== count) count++;
    });

    if(count < 1) {
        ctx.fillStyle="white";
    	ctx.font="36px verdana";
    	ctx.fillText("Draw!", canvas.width/2.5, canvas.height/2 + 50);
        gameOver = true;
    } else {
        aliveSnakes.forEach(snake => {
            if(snake.score >= highestScore) {
                highestScore = snake.score;
                winner = snake;
            }
        });
        ctx.fillStyle=winner ? winner.headCol : "white";
    	ctx.font="36px verdana";
    	ctx.fillText((winner ? winner.name : "Nobody") + " Wins", canvas.width/5.5, canvas.height/2 + 50);
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
        if(playerCount === 1) {
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
    let html = "";
    playerSnakes.forEach(snake => {
        html += `<div class="score-badge" style="background-color: ${snake.headCol}">
                    ${snake.name}: ${snake.score}
                 </div>`;
    });
    document.getElementById('scoreboard').innerHTML = html;
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
            ctx.fillRect(part.x * gridSpacing, part.y * gridSpacing, tileSize,tileSize);
        }
        
        snake.parts.push(new snakePart(snake.headX,snake.headY));
        if(snake.parts.length>snake.tailLength){
            snake.parts.shift();
        }
    
        ctx.fillStyle=snake.headCol;
        ctx.fillRect(snake.headX * gridSpacing, snake.headY * gridSpacing, tileSize,tileSize);
        moveSnake(snake);
    });
}
 
function moveSnake(snake){
    snake.lastXVelocity = snake.xVelocity;
    snake.lastYVelocity = snake.yVelocity;
    snake.headX += snake.xVelocity;
    snake.headY += snake.yVelocity;
    if(solidWalls==false) {
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
        ctx.fillRect(apple.x * gridSpacing, apple.y * gridSpacing, tileSize, tileSize);
    });
}
 
function randomPosition() {
    return Math.floor(Math.random() * tileCount);
}

function checkCollision(){
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
        if (window.touchRestartTimeout) { clearTimeout(window.touchRestartTimeout); window.touchRestartTimeout = null; }
        reset();
        if(gameOver === true) drawGame();
    }
    if(event.keyCode==27) {
        if(modal.style.display !== "block" && settingsModal.style.display !== "block") {
            isPaused = !isPaused;
        }
    }
    if(event.keyCode==32) window.addSnake();
    if(isPaused) return;
   
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

function InitP1Controls() {
    buttonMappings.push([87, 83, 65, 68]);
    clonedSnakes[playerCount].controls.push([87, 83, 65, 68]);
    playerSnakes.push(clonedSnakes[playerCount]);
    aliveSnakes.push(clonedSnakes[playerCount]);
    playerCount++;
    if(playerCount === 1) WinningScore = 999;
}

if(isTouchDevice() === true) {
    let text = "Touchscreen Detected!\nEnable default touch (swipe) controls?";
    if (confirm(text) == true) {
        InitP1Controls();
    }
}

var xDown = null;                                                        
var yDown = null;

function getTouches(evt) {
  return evt.touches || evt.originalEvent.touches;
}

function handleTouchStart(evt) {
    if (evt.target.tagName === 'BUTTON' || evt.target.tagName === 'INPUT') return;
    const firstTouch = getTouches(evt)[0];                                      
    xDown = firstTouch.clientX;                                      
    yDown = firstTouch.clientY;                                      
}

function handleTouchMove(evt) {
    if (evt.target.tagName === 'BUTTON' || evt.target.tagName === 'INPUT') return;
    if (!xDown || !yDown) return;

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) moveLeft(playerSnakes[0]);
        else moveRight(playerSnakes[0]);
    } else {
        if (yDiff > 0) moveUp(playerSnakes[0]);
        else moveDown(playerSnakes[0]);
    }
    xDown = null;
    yDown = null;
}

// Initial Settings sync
window.updateSettings();
drawGame();