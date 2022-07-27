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
    }
}

class snakePart{
    constructor(x, y){
        this.x=x;
        this.y=y;
    }
}

const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

// Settings
//General
let sameTeam = false;
let TouchControls = false;
let speed = 12;
let canvasSize = 600;
//GameOver
let lives = 1;
let solidWalls = false;
let WinningScore = 25;
//Players
//Color
let snake1HeadColor = "orange";
let snake1BodyColor = "green";
let snake2HeadColor = "yellow";
let snake2BodyColor = "blue";

let custom1 = [];
let custom2 = [];
canvas.width = canvasSize;
canvas.height = canvasSize;
let tileCount = canvasSize/24;

let tileSize=canvasSize/tileCount;

let snake1 = new snake("Player1", snake1HeadColor, snake1BodyColor, 5, 10, [], 1, 0, 0, 0);
let snake2 = new snake("Player2", snake2HeadColor, snake2BodyColor, 15, 10, [], 1, 0, 0, 0);
let snake3 = new snake("Player3", "purple", "lime", 5, 5, [], 1, 0, 0, 0);
let snake4 = new snake("Player4", "pink", "cyan", 15, 5, [], 1, 0, 0, 0);

let snakes = [snake1, snake2];

//draw apple
let appleX;
let appleY;

//scores
let score=0;
let score2=0;

let started = false;
let AppleInitialized = false;

// create game loop-to continously update screen
function drawGame(){

    snakes.forEach(snake => {
        moveSnake(snake);
    });
    
    if(started && !AppleInitialized)
    {
    	appleX = 10;
    	appleY = 10;
    	AppleInitialized = true;
    }
    
    clearScreen();

    snakes.forEach(snake => {
        drawSnake(snake);
    });

    // game over logic
    let stop = isGameOver();
    if(stop === true){
        return;
    }

    drawApple();
    
    snakes.forEach(snake => {
        checkCollision(snake);
        drawScore(snake);
    });
    setTimeout(drawGame, 1000/speed);// Faster speed, less timeout
}

//Game Over function
function isGameOver(){

    let gameOver=false;

    snakes.forEach(snake => {

        //check whether game has started
        if (snake.yVelocity === 0 && snake.xVelocity === 0) {
            return false;
        }

        let otherSnakes = [];
        otherSnakes.push(snakes);
        console.log("before", otherSnakes);
        let snakeIndex = snakes.indexOf(snake);
        otherSnakes.splice(snakeIndex, 1);
        console.log("after", otherSnakes);
        debugger;

        otherSnakes.forEach(otherSnake => {
            // Game ends if snakes' heads clash
            if((snake.headX === otherSnake.headX && snake.headY === otherSnake.headY) && started)
            {
                gameOver = true;
            }
        });

        // only draw apple once game has started and both players moving
        if (snake.yVelocity !== 0 || snake.xVelocity !== 0) {
            started = true;
        }

        if(snake.score >= WinningScore)
        {
            gameOver=true;
        }

        if(solidWalls==true)
        {
            wallCollision(snake, gameOver);
        }
        else
        {
            wallTeleport(snake);
        }
    
        //stop game when snake crush to its own body
         for(let i=0; i<snake.parts.length;i++){
             let part=snake.parts[i];
             if(part.x===snake.headX && part.y===snake.headY){//check whether any part of snake is occupying the same space
                 //gameOver=true;
                 let penalty = snake.parts.length - i - 1;
                 snake.parts.splice(snake.parts[i], penalty);
                 snake.tailLength-=penalty;
                 snake.score-= penalty;
                 break; // to break out of for loop
             }
         }
    });

    //display text Game Over
    if(gameOver){
        displayGameOverText(snakes, gameOver);
    }

    // this will stop execution of drawgame method
    return gameOver;
}

function displayGameOverText(snakes, Gameover)
{
    // Game Over Text
    ctx.fillStyle="white";
    ctx.font="50px verdana";
    ctx.fillText("Game Over!", canvas.width/6.5, canvas.height/2);

    // Winner Text
    let winner;
    let highestScore = 0;

    let count = 0;
    snakes.forEach(snake => {
        if(snake.score !== count)
        {
            count++;
        }
    });

    // Draw since all snakes have the same score (if 0 or 1)
    if(count < 1)
    {
        ctx.fillStyle="white";
    	ctx.font="36px verdana";
    	ctx.fillText("Draw!", canvas.width/2.5, canvas.height/2 + 50);

        return ga
    }
    // TODO: This will return only 1 winner even if multiple exist
    else
    {
        snakes.forEach(snake => {
            if(snake.score >= highestScore)
            {
                highestScore = snake.score;
                winner = snake;
            }
        });

        ctx.fillStyle=winner.headCol;
    	ctx.font="36px verdana";
    	ctx.fillText(winner.name + " Wins", canvas.width/5.5, canvas.height/2 + 50);
    }
}

function wallCollision(snake, Gameover)
{
    if(snake.headX<0){//if snake hits left wall
        Gameover=true;
    }
    else if(snake.headX===tileCount){//if snake hits right wall
        Gameover=true;
    }
    else if(snake.headY<0){//if snake hits wall at the top
        Gameover=true;
    }
    else if(snake.headY===tileCount){//if snake hits wall at the bottom
        Gameover=true;
    }
}

function wallTeleport(snake)
{
    if(snake.headX<0){//if snake hits left wall
        snake.headX=tileCount;
    }
    else if(snake.headX===tileCount){//if snake hits right wall
        snake.headX=0;
    }
    else if(snake.headY<0){//if snake hits wall at the top
        snake.headY=tileCount;
    }
    else if(snake.headY===tileCount){//if snake hits wall at the bottom
        snake.headY=0;
    }
}

// score function
function drawScore(snake){
    ctx.fillStyle = snake.headCol;
    ctx.font= "10px verdena";

    if(snake.name.includes("1"))
    {
        ctx.fillText(snake.name + " : " + snake.score, canvasSize*2/100, 10);
    }

    if(snake.name.includes("2"))
    {                                                   // 90%
        ctx.fillText(snake.name + " : " + snake.score, canvasSize*30/100, 10);
    }

    if(snake.name.includes("3"))
    {
        ctx.fillText(snake.name + " : " + snake.score, canvasSize*65/100, 10);
    }

    if(snake.name.includes("4"))
    {
        ctx.fillText(snake.name + " : " + snake.score, canvasSize*90/100, 10);
    }
}

// clear our screen
 function clearScreen(){
    // make screen black
    ctx.fillStyle= 'black';
    // black color start from 0px left, right to canvas width and canvas height
    ctx.fillRect(0,0,canvas.width, canvas.height);
 }
 
 function drawSnake(snake){
    
    ctx.fillStyle=snake.BodyCol;
    
    //loop through our snakeparts array
    for(let i=0;i<snake.parts.length;i++){
        //draw snake parts
        let part=snake.parts[i]
         ctx.fillRect(part.x *tileCount, part.y *tileCount, tileSize,tileSize)
    }
    
    //add parts to snake --through push
    snake.parts.push(new snakePart(snake.headX,snake.headY));//put item at the end of list next to the head
    
    if(snake.parts.length>snake.tailLength){
        snake.parts.shift();//remove furthest item from  snake part if we have more than our tail size
    }

    ctx.fillStyle=snake.headCol;
    ctx.fillRect(snake.headX* tileCount,snake.headY* tileCount, tileSize,tileSize)
 }
 
 function moveSnake(snake){
    snake.headX=snake.headX + snake.xVelocity;
    snake.headY=snake.headY+ snake.yVelocity;
 }
 
 function drawApple(){
     ctx.fillStyle="red";
     ctx.fillRect(appleX*tileCount, appleY*tileCount, tileSize, tileSize)
 }
 
 // check for collision and change apple position
 function checkCollision(snake){
     if(appleX==snake.headX && appleY==snake.headY){
         appleX=Math.floor(Math.random()*tileCount);
         appleY=Math.floor(Math.random()*tileCount);
         snake.tailLength++;
         snake.score++; //increase our score value
     }
 }
 
 //add event listener to our body
 document.body.addEventListener('keydown', keyDown);
 document.body.addEventListener('keypress', reset);
 
 function reset()
 {
 	if(event.keyCode==13)
    {
        location.reload();
    }
 }

function keyDown()
{
    //Arrows
	// Arrow Up
    if(event.keyCode==38){
    	moveUp(snake2);
    }
    
    // Arrow down
    if(event.keyCode==40){
    	moveDown(snake2);
    }

	// Arrow left
    if(event.keyCode==37){
    	moveLeft(snake2);
    }
    
    // Arrow right
    if(event.keyCode==39){
    	moveRight(snake2);
    }
    
    //WASD
    // W - up
    if(event.keyCode==87){
    	moveUp(snake1);
    }
    
    // A - left
    if(event.keyCode==65){
    	moveLeft(snake1);
    }

	// S - down
    if(event.keyCode==83){
    	moveDown(snake1);
    }
    
    // D - right
    if(event.keyCode==68){
    	moveRight(snake1);
    }

    //Custom

    //Custom1
	//Up
    if(event.keyCode==custom1[0]){
    	moveUp(snake3);
    }
    
    //Down
    if(event.keyCode==custom1[1]){
    	moveDown(snake3);
    }

	//Left
    if(event.keyCode==custom1[2]){
    	moveLeft(snake3);
    }
    
    //Right
    if(event.keyCode==custom1[3]){
    	moveRight(snake3);
    }

    //Custom2
	//Up
    if(event.keyCode==custom2[0]){
    	moveUp(snake4);
    }
    
    //Down
    if(event.keyCode==custom2[1]){
    	moveDown(snake4);
    }

	//Left
    if(event.keyCode==custom2[2]){
    	moveLeft(snake4);
    }
    
    //Right
    if(event.keyCode==custom2[3]){
    	moveRight(snake4);
    }
}


function moveUp(snake)
{
	if(snake.yVelocity==1)
        return;
        snake.yVelocity=-1;
        snake.xVelocity=0;
}

function moveDown(snake)
{
	if(snake.yVelocity==-1)
        return;
        snake.yVelocity=1;
        snake.xVelocity=0;
}

function moveRight(snake)
{
	if(snake.xVelocity==-1)
        return;
        snake.yVelocity=0;
        snake.xVelocity=1;
}

function moveLeft(snake)
{
	if(snake.xVelocity==1)
        return;
        snake.yVelocity=0;
        snake.xVelocity=-1;
}

document.addEventListener('touchstart', handleTouchStart, false);        
document.addEventListener('touchmove', handleTouchMove, false);

// Touch
var xDown = null;                                                        
var yDown = null;

function getTouches(evt) {
  return evt.touches || evt.originalEvent.touches; // jQuery
}

function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];                                      
    xDown = firstTouch.clientX;                                      
    yDown = firstTouch.clientY;                                      
};

function handleTouchMove(evt) {
    if ( ! xDown || ! yDown ) {
    	return;
    }

    var xUp = evt.touches[0].clientX;                                    
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;
                                                                         
    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
        if ( xDiff > 0 ) {
           moveLeft(snake.xVelocity, snake.yVelocity);
        } else {
            moveRight(snake.xVelocity, snake.yVelocity);
        }                       
    } else {
        if ( yDiff > 0 ) {
            moveUp(snake.xVelocity, snake.yVelocity);
        } else { 
            moveDown(snake.xVelocity, snake.yVelocity);
        }                                                                 
    }
    /* reset values */
    xDown = null;
    yDown = null;                                             
};

 drawGame(); 