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
let canvasSize = 400;
//GameOver
let lives = 1;
let solidWalls = false;
let WinningScore = 25;
//Color
let snake1HeadColor = "orange";
let snake1BodyColor = "green";
let snake2HeadColor = "yellow";
let snake2BodyColor = "blue";

canvas.width = canvasSize;
canvas.height = canvasSize;
let tileCount = canvasSize/20;

let tileSize=canvas.clientWidth/tileCount-2;

let headX=5;
let headY=10;

let head2X=15;
let head2Y=10;

// array for snake parts
const snakeParts=[];
const snake2Parts=[];
let tailLength=1;
let tail2Length=1;

//initialize the speed of snake
let xvelocity=0;
let yvelocity=0;
let xvelocity2=0;
let yvelocity2=0;

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
    changeSnakePosition();
    changeSnake2Position();
    
    // game over logic
    let stop = isGameOver();
    if(stop === true){
        return;
    }
    
    if(started && !AppleInitialized)
    {
    	appleX = 10;
    	appleY = 10;
    	AppleInitialized = true;
    }
    
    clearScreen();
    
    drawSnake();
    drawSnake2();
    
    drawApple();
    checkCollision();
    
    drawScore();
    drawScore2();
    setTimeout(drawGame, 1000/speed);// Faster speed, less timeout
}

//Game Over function
function isGameOver(){
    let gameOver=false; 
    //check whether game has started
    if(yvelocity===0 && xvelocity===0 && yvelocity2===0 && xvelocity2===0){
        return false;
    }
    
    // only draw apple once game has started and both players moving
    if((yvelocity!==0 || xvelocity!==0) && (yvelocity2!==0 || xvelocity2!==0)){
    	started = true;
    }
    
    if(score >= WinningScore || score2 >= WinningScore)
    {
    	gameOver=true;
    }
    
    // Game ends if snakes' heads clash
    if((headX == head2X && headY == head2Y) && started)
    {
    	gameOver = true;
    }
    
    if(solidWalls==true)
    {
    	if(headX<0 || head2X<0){//if snake hits left wall
    	gameOver=true;
	    }
	    else if(headX===tileCount || head2X===tileCount){//if snake hits right wall
	        gameOver=true;
	    }
	    else if(headY<0 || head2Y<0){//if snake hits wall at the top
	        gameOver=true;
	    }
	    else if(headY===tileCount || head2Y===tileCount){//if snake hits wall at the bottom
	        gameOver=true;
	    }
    }
    else
    {
		if(headX<0){//if snake hits left wall
    		headX=tileCount;
	    }
	    else if(headX===tileCount){//if snake hits right wall
	        headX=0;
	    }
	    else if(headY<0){//if snake hits wall at the top
	        headY=tileCount;
	    }
	    else if(headY===tileCount){//if snake hits wall at the bottom
	        headY=0;
	    }
	   
	   // Snake2
		if(head2X<0){//if snake hits left wall
    		head2X=tileCount;
	    }
	    else if(head2X===tileCount){//if snake hits right wall
	        head2X=0;
	    }
	    else if(head2Y<0){//if snake hits wall at the top
	        head2Y=tileCount;
	    }
	    else if(head2Y===tileCount){//if snake hits wall at the bottom
	        head2Y=0;
	    }
    }
    
    //stop game when snake crush to its own body
     for(let i=0; i<snakeParts.length;i++){
         let part=snakeParts[i];
         if(part.x===headX && part.y===headY){//check whether any part of snake is occupying the same space
             //gameOver=true;
             let penalty = snakeParts.length - i - 1;
             snakeParts.splice(snakeParts[i], penalty);
             tailLength-=penalty;
             score-= penalty;
             break; // to break out of for loop
         }
     }
    
    //stop game when snake2 crush to its own body
     for(let i=0; i<snake2Parts.length;i++){
         let part=snake2Parts[i];
         if(part.x===head2X && part.y===head2Y){//check whether any part of snake is occupying the same space
             //gameOver=true;
             let penalty = snake2Parts.length - i - 1;
             snake2Parts.splice(snake2Parts[i], penalty);
             tail2Length-=penalty;
             score2-= penalty;
             break; // to break out of for loop
         }
     }

    //display text Game Over
    if(gameOver){
     ctx.fillStyle="white";
     ctx.font="50px verdana";
     ctx.fillText("Game Over! ", canvas.clientWidth/6.5, canvas.clientHeight/2);//position our text in center
     
     if(score === score2)
     {
     	ctx.fillStyle="white";
    	ctx.font="36px verdana";
    	ctx.fillText("Draw!", canvas.clientWidth/2.5, canvas.clientHeight/2 + 50);
     }
     else if(score > score2)
     {
     	ctx.fillStyle=snake1HeadColor;
    	ctx.font="36px verdana";
    	ctx.fillText("Player 1 Wins!", canvas.clientWidth/5.5, canvas.clientHeight/2 + 50);
     }
     else
     {
     	ctx.fillStyle=snake2HeadColor;
    	ctx.font="36px verdana";
    	ctx.fillText("Player 2 Wins", canvas.clientWidth/5.5, canvas.clientHeight/2 + 50);
     }
    }

    return gameOver;// this will stop execution of drawgame method
}

// score function
function drawScore(){
ctx.fillStyle=snake1HeadColor// set our text color to white
ctx.font="10px verdena"//set font size to 10px of font family verdena
ctx.fillText("Player1: " +score, 10,10);// position our score at right hand corner 
}

// score2 function
function drawScore2(){
ctx.fillStyle=snake2HeadColor// set our text color to white
ctx.font="10px verdena"//set font size to 10px of font family verdena
ctx.fillText("Player2: " +score2, canvas.clientWidth-50, 10);// position our score at right hand corner 
}

// clear our screen
 function clearScreen(){

ctx.fillStyle= 'black'// make screen black
ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight)// black color start from 0px left, right to canvas width and canvas height
 }
 
 function drawSnake(){
    
    ctx.fillStyle=snake1BodyColor;
    
    //loop through our snakeparts array
    for(let i=0;i<snakeParts.length;i++){
        //draw snake parts
        let part=snakeParts[i]
         ctx.fillRect(part.x *tileCount, part.y *tileCount, tileSize,tileSize)
    }
    
    //add parts to snake --through push
    snakeParts.push(new snakePart(headX,headY));//put item at the end of list next to the head
    
    if(snakeParts.length>tailLength){
        snakeParts.shift();//remove furthest item from  snake part if we have more than our tail size
    }
    ctx.fillStyle=snake1HeadColor;
    ctx.fillRect(headX* tileCount,headY* tileCount, tileSize,tileSize)
 }
 
 function changeSnakePosition(){
     headX=headX + xvelocity;
     headY=headY+ yvelocity;
 }
 
  function drawSnake2(){
    
    ctx.fillStyle=snake2BodyColor;
    
    //loop through our snakeparts array
    for(let i=0;i<snake2Parts.length;i++){
        //draw snake parts
        let part=snake2Parts[i]
         ctx.fillRect(part.x *tileCount, part.y *tileCount, tileSize,tileSize)
    }
    
    //add parts to snake --through push
    snake2Parts.push(new snakePart(head2X,head2Y));//put item at the end of list next to the head
    
    if(snake2Parts.length>tail2Length){
        snake2Parts.shift();//remove furthest item from  snake part if we have more than our tail size
    }
    ctx.fillStyle=snake2HeadColor;
    ctx.fillRect(head2X* tileCount,head2Y* tileCount, tileSize,tileSize)
 }
 
 function changeSnake2Position(){
     head2X=head2X + xvelocity2;
     head2Y=head2Y+ yvelocity2;
 }
 
 function drawApple(){
     ctx.fillStyle="red";
     ctx.fillRect(appleX*tileCount, appleY*tileCount, tileSize, tileSize)
 }
 
 // check for collision and change apple position
 function checkCollision(){
     if(appleX==headX && appleY==headY){
         appleX=Math.floor(Math.random()*tileCount);
         appleY=Math.floor(Math.random()*tileCount);
         tailLength++;
         score++; //increase our score value
     }
     
     if(appleX==head2X && appleY==head2Y){
         appleX=Math.floor(Math.random()*tileCount);
         appleY=Math.floor(Math.random()*tileCount);
         tail2Length++;
         score2++; //increase our score value
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
	// Arrow Up
    if(event.keyCode==38){
    	moveUp2();
    }
    
    // Arrow down
    if(event.keyCode==40){
    	moveDown2();
    }

	// Arrow left
    if(event.keyCode==37){
    	moveLeft2();
    }
    
    // Arrow right
    if(event.keyCode==39){
    	moveRight2();
    }
    
    
    // W - up
    if(event.keyCode==87){
    	moveUp();
    }
    
    // A - left
    if(event.keyCode==65){
    	moveLeft();
    }

	// S - down
    if(event.keyCode==83){
    	moveDown();
    }
    
    // D - right
    if(event.keyCode==68){
    	moveRight();
    }
}

function moveUp()
{
	if(yvelocity==1)
        return;
        yvelocity=-1;
        xvelocity=0;
}

function moveDown()
{
	if(yvelocity==-1)
        return;
        yvelocity=1;
        xvelocity=0;
}

function moveRight()
{
	if(xvelocity==-1)
        return;
        yvelocity=0;
        xvelocity=1;
}

function moveLeft()
{
	if(xvelocity==1)
        return;
        yvelocity=0;
        xvelocity=-1;
}

function moveUp2()
{
	if(yvelocity2==1)
        return;
        yvelocity2=-1;
        xvelocity2=0;
}

function moveDown2()
{
	if(yvelocity2==-1)
        return;
        yvelocity2=1;
        xvelocity2=0;
}

function moveRight2()
{
	if(xvelocity2==-1)
        return;
        yvelocity2=0;
        xvelocity2=1;
}

function moveLeft2()
{
	if(xvelocity2==1)
        return;
        yvelocity2=0;
        xvelocity2=-1;
}

document.addEventListener('touchstart', handleTouchStart, false);        
document.addEventListener('touchmove', handleTouchMove, false);

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
           moveLeft(xvelocity, yvelocity);
        } else {
            moveRight(xvelocity, yvelocity);
        }                       
    } else {
        if ( yDiff > 0 ) {
            moveUp(xvelocity, yvelocity);
        } else { 
            moveDown(xvelocity, yvelocity);
        }                                                                 
    }
    /* reset values */
    xDown = null;
    yDown = null;                                             
};

 drawGame(); 