const menu = document.getElementById("menu");
const game = document.getElementById("game");
const player = document.getElementById("player");
const scoreElement = document.getElementById("score");

let lane = 1; // 0 esquerda, 1 meio, 2 direita
let lanes = ["30%", "50%", "70%"];
let speed = 5;
let score = 0;
let isJumping = false;

menu.addEventListener("click", startGame);

function startGame(){
  menu.classList.add("hidden");
  game.classList.remove("hidden");
  player.style.left = lanes[lane];
  gameLoop();
  spawnObstacle();
}

document.addEventListener("keydown", e => {
  if(e.key === "ArrowLeft" && lane > 0){
    lane--;
    player.style.left = lanes[lane];
  }
  if(e.key === "ArrowRight" && lane < 2){
    lane++;
    player.style.left = lanes[lane];
  }
  if(e.key === "ArrowUp" && !isJumping){
    jump();
  }
});

function jump(){
  isJumping = true;
  player.style.transition = "0.3s";
  player.style.bottom = "250px";
  setTimeout(()=>{
    player.style.bottom = "120px";
    isJumping = false;
  },300);
}

function spawnObstacle(){
  setInterval(()=>{
    let obstacle = document.createElement("div");
    obstacle.classList.add("obstacle");
    let randomLane = Math.floor(Math.random()*3);
    obstacle.style.left = lanes[randomLane];
    game.appendChild(obstacle);

    moveObstacle(obstacle);
  },1500);
}

function moveObstacle(obstacle){
  let pos = -60;
  let interval = setInterval(()=>{
    pos += speed;
    obstacle.style.top = pos + "px";

    // colisão
    if(pos > window.innerHeight-200 &&
       obstacle.style.left === player.style.left &&
       !isJumping){
        alert("Game Over 🔥");
        location.reload();
    }

    if(pos > window.innerHeight){
      obstacle.remove();
      score++;
      scoreElement.innerText = score;
      speed += 0.2;
      clearInterval(interval);
    }
  },20);
}

function gameLoop(){
  // só mantém rodando
}
