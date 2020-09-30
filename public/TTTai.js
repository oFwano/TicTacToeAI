//initialize game variables

let board = [
    [0,0,0],
    [0,0,0],
    [0,0,0]
  ];
// 0 no player/pause/end state,1 player one, 2 player two
let currentPlayer;
// 0 no winner, 1 player one 'x', 2 player two 'o', winner '3' == tie game
let winner;
//boolean true: playing against AI, false: player v player
let play_vsAI;
//radio button value
let radio_val;
let gameWidth;
let gameHeight;

var socket;

function setup() {

  createCanvas(1000,600);
  socket = io.connect('http://localhost:3000');

  gameWidth = 600;
  gameHeight = 600;

  currentPlayer = 0;
  winner = 0;

  button = createButton('New Game');
  button.position(700,500);
  button.mousePressed(newGame);

  radio = createRadio();
  radio.option('Player 2',1)
  radio.option('Ai',2);
  radio.position(700,525);

  socket.on('player_turn',function(data){
    board = data.board;
    winner = data.winner;
    currentPlayer = data.currentPlayer;
    play_vsAI = data.pvAI;
    radio_val = data.radio_val;
    radio.value(radio_val);
    }
  );
}

function draw() {
  // colour background
  // draw game board
  // draw game pieces x and o
  background('rgb(189, 189, 189)');
  drawGridLines();
  for(let i =0; i <3; i++){
    for(let j=0; j < 3; j++){
      if(board[i][j] == 1){  drawXpiece(i,j);  }
      else if (board[i][j] == 2){  drawOpiece(i,j);  }
    }
  }

  // text showing player symbol and turn
  fill(255).strokeWeight(0).textSize(40).textStyle(BOLD);
  if (currentPlayer == 1 && winner == 0){
    fill('rgb(109, 156, 161)');
  }
  else{
    fill(255);
  }
  text('Player 1: X', 650, 75);

  if (play_vsAI == false){
    if (currentPlayer == 2 && winner == 0){
      fill('rgb(224, 162, 103)');
    }
    else{
      fill(255);
    }
    text('Player 2: O', 650, 125);
  }
  else if (play_vsAI == true){
    fill('rgb(255,255, 255)');
    text('Minimax AI: O', 650, 125);
  }


  // text printing winner if there is a winner
  if (winner != 0){
    fill('rgb(110,250,182)').strokeWeight(1).textSize(40).stroke('rgb(110,250,182)');
    if (winner == 1){
      text('Player 1 Wins !!!', 650,200);
    }
    else if (winner ==2 && play_vsAI == false){
      text('Player 2 Wins !!!', 650,200);
    }
    else if (winner ==2 && play_vsAI == true){
      fill('rgb(255,0,0)');
      text('Minimax AI Wins !!!', 650,200);
    }
    else{
      text('Tie Game', 650,200);
    }
  }

}

function checkWin(){
  //horizontal check
  let count;
  let startNum;
  for (let i = 0; i < 3; i++){
    count = 0;
    startNum = board[i][0];
    for (let j=1;j<3;j++){
      if (board[i][j] == startNum && startNum != 0){
        count++;
      }
      else{  break;  }
    }
    if (count == 2){
      return startNum;
    }
  }
   // vertical check
  for (let i=0; i<3; i++){
    count=0;
    startNum = board[0][i];
    for (let j = 1; j <3; j++){
      if (board[j][i] == startNum && startNum !=0){
        count++;
      }
      else{  break;  }
    }
    if (count==2){
      return startNum;
    }
  }
  //diagonal check \
  count = 0;
  startNum = board[0][0];
  for (let i=1; i <3;i++){
    if (board[i][i] == startNum && startNum !=0){
      count++;
    }
  }
  if (count == 2){
    return startNum;
  }
  //diagonal check /
  count = 0;
  startNum = board[2][0];
  for (let i=1; i <3;i++){
    if (board[2-i][i] == startNum && startNum !=0){
      count++;
    }
  }
  if (count ==2){
    return startNum;
  }
  let empty = 0;
    for (let i=0; i<3; i++) {
      for (let j=0; j<3; j++) {
        if (board[i][j] == 0) {
          empty++;
        }
      }
    }
  if (empty == 0){
    return 3; // tie game
  }

  return 0; // no win, still boardspace open.
}

function newGame(){
  //reset game board
  for(let i=0; i < 3; i++){
    for(let j=0; j < 3; j++){
      board[i][j] = 0;
    }
  }
  //get radio value -- either player vs player or player vs ai
  radio_val = radio.value();
  if (!radio_val){
    return;
  }
  //choose a random player to start.( If player 2 starts AI gets to go first. )
  currentPlayer = floor(random()*2)+1;

  if (radio_val == 2){
      play_vsAI = true;
      if (currentPlayer==2){
        moveAI();
      }
  }
  else{
    play_vsAI = false;
  }

  winner = 0;
  sendSocketData(board,winner,currentPlayer,play_vsAI,radio_val);
}

function mousePressed(){
  let i = floor(mouseX/(gameWidth/3));
  let j = floor(mouseY/(gameHeight/3));
  // if a game is not in progress return
  if (winner != 0 || currentPlayer == 0){
    return;
  }
  // if board is empty at mouse position place piece
  // switch player
  // check winner
  // if playing against the AI, process move for AI
  if (board[i][j] == 0){
    board[i][j] = currentPlayer;
    currentPlayer = (currentPlayer == 1) ? 2 : 1;
    winner = checkWin();

    if(play_vsAI==true && winner == 0){
       moveAI();
       winner = checkWin();
    }
  }
  sendSocketData(board,winner,currentPlayer,play_vsAI,radio_val)
}

function sendSocketData(gameboard,win,currPlayer,play_vsAI,radio_val){
  //synchronize data between clients
  var gameState = {
    board: gameboard,
    winner: win,
    currentPlayer: currPlayer,
    pvAI: play_vsAI,
    radio_val: radio_val
  };
  socket.emit('player_turn',gameState);
}

//=============================================================//
//  minimax
function moveAI() {
  // AI to make its turn
  let bestScore = -Infinity;
  let besti;
  let bestj;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] == 0) {
        board[i][j] = 2;
        let score = minimax(board, 0, false);
        board[i][j] = 0;
        if (score > bestScore) {
          bestScore = score;
          besti = i;
          bestj = j;
        }
      }
    }
  }
  board[besti][bestj] = 2;
  currentPlayer = 1;
}

function minimax(board, isMaximizing) {
  let result = checkWin();
  if (result != 0) {
    // 0 no winner, 1 player one 'x', 2 player two 'o', winner '3' == tie game
    if (result == 1){
      return -1;
    }
    else if (result == 2){
      return 1;
    }
    else{
      return 0;
    }
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] == 0) {
          board[i][j] = 2;
          let score = minimax(board, false);
          board[i][j] = 0;
          bestScore = max(score, bestScore);
        }
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] == 0) {
          board[i][j] = 1;
          let score = minimax(board, true);
          board[i][j] = 0;
          bestScore = min(score, bestScore);
        }
      }
    }
    return bestScore;
  }
}
//---------------------------------------------------------//
// drawing functions

function drawGridLines(){
  strokeWeight(7);
  stroke('rgb(88, 88, 88)');
  line(gameWidth/3, 0, gameWidth/3, gameHeight);
  line(2*gameWidth/3, 0, 2*gameWidth/3, gameHeight);
  line(0, gameHeight/3, gameWidth, gameHeight/3);
  line(0, 2*gameHeight/3,gameWidth,2*gameHeight/3);
}

function drawXpiece(x, y){
  stroke('rgb(109, 156, 161)');
  strokeWeight(10);
  line(200*x+50, 200*y+50, 200*(x+1)-50, 200*(y+1)-50);
  line(200*(x+1)-50, 200*y+50, 200*x+50, 200*(y+1)-50);
}

function drawOpiece(x,y){
  stroke('rgb(224, 162, 103)');
  strokeWeight(10);
  fill('rgb(189, 189, 189)');
  circle(x*200+100,y*200+100,90);
}
