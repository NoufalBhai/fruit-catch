const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

const basket = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 50,
  width: 100,
  height: 20,
  velocity: 0,
  maxSpeed: 10,
  acceleration: 0.5,
  friction: 0.9,
};

const fruit = {
  x: Math.random() * (canvas.width - 30),
  y: 0,
  size: 30,
  speed: 3,
};

let score = 0;
let lives = 5;
let isMovingLeft = false;
let isMovingRight = false;
let gameRunning = false; // To track if the game is running or paused
let gameOver = false; // To track if the game is over

let playerId = "";
let playerName = "";

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const playerTableBody = document.getElementById("playerTableBody");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const userDetailsForm = document.getElementById("userDetailsForm");
const playerIdInput = document.getElementById("playerId");
const playerNameInput = document.getElementById("playerName");
const errorMessage = document.getElementById("error-message");

function showModal() {
  modal.style.display = "block";
  playerIdInput.focus();
}

function hideModal() {
  modal.style.display = "none";
}

function promptForUserDetails() {
  showModal();
}

userDetailsForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const id = playerIdInput.value.trim();
  const name = playerNameInput.value.trim();

  if (id === "" || name === "") {
    errorMessage.textContent = "Please fill in both fields.";
    return;
  }

  playerId = id;
  playerName = name;

  const players = JSON.parse(localStorage.getItem("players")) || [];
  const existingPlayer = players.find((player) => player.id === playerId);

  if (existingPlayer) {
    playerNameInput.value = existingPlayer.name; // Autofill the name
  }

  hideModal();
  gameRunning = true;
  update();
});

playerIdInput.addEventListener("input", () => {
  const id = playerIdInput.value.trim();
  if (id) {
    const players = JSON.parse(localStorage.getItem("players")) || [];
    const existingPlayer = players.find((player) => player.id === id);

    if (existingPlayer) {
      playerNameInput.value = existingPlayer.name;
    } else {
      playerNameInput.value = "";
    }
  } else {
    playerNameInput.value = "";
  }
});

function drawBasket() {
  ctx.fillStyle = "#8b4513";
  ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
}

function drawFruit() {
  ctx.fillStyle = "#ff6347";
  ctx.beginPath();
  ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
}

function drawText(text, x, y, size = "20px", color = "black") {
  ctx.font = `${size} Arial`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawHeart(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.bezierCurveTo(x, y - size / 4, x - size / 2, y - size / 4, x - size / 2, y + size / 4);
  ctx.bezierCurveTo(x - size / 2, y + (size * 3) / 4, x, y + (size * 3) / 4, x, y + size / 4);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();
}

function drawScoreboard() {
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);

  const heartSize = 30;
  const heartSpacing = 40;
  const startX = canvas.width - 200;

  for (let i = 0; i < lives; i++) {
    drawHeart(startX + i * heartSpacing, 30, heartSize);
  }
}

function update() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawScoreboard();
  drawBasket();
  drawFruit();

  if (gameOver) {
    drawText("Game Over", canvas.width / 2 - 150, canvas.height / 2, "50px", "red");
    drawText("Press Spacebar...", canvas.width / 2 - 150, canvas.height / 2 + 50, "20px", "black");
    savePlayerDetails();
    displayPreviousPlayers();

    setTimeout(() => {
      resetGame();
      promptForUserDetails();
    }, 2000);
    return;
  }

  if (isMovingRight) {
    basket.velocity += basket.acceleration;
  } else if (isMovingLeft) {
    basket.velocity -= basket.acceleration;
  } else {
    basket.velocity *= basket.friction;
  }

  basket.velocity = Math.max(-basket.maxSpeed, Math.min(basket.velocity, basket.maxSpeed));
  basket.x += basket.velocity;

  if (basket.x < 0) basket.x = 0;
  if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;

  fruit.y += fruit.speed;

  if (
    fruit.y + fruit.size > basket.y &&
    fruit.x > basket.x &&
    fruit.x < basket.x + basket.width
  ) {
    score++;
    resetFruit();
  } else if (fruit.y + fruit.size > canvas.height) {
    score--;
    lives--;
    resetFruit();
  }

  if (lives <= 0) {
    gameOver = true;
  }

  requestAnimationFrame(update);
}

function resetFruit() {
  fruit.x = Math.random() * (canvas.width - fruit.size);
  fruit.y = 0;
  fruit.speed = 3 + Math.random() * 5;
}

function moveBasket(e) {
  if (e.key === "ArrowRight") {
    isMovingRight = true;
  } else if (e.key === "ArrowLeft") {
    isMovingLeft = true;
  }
}

function stopBasket(e) {
  if (e.key === "ArrowRight") {
    isMovingRight = false;
  } else if (e.key === "ArrowLeft") {
    isMovingLeft = false;
  }
}

function handleSpacebar(e) {
  if (e) e.preventDefault(); // Prevent default spacebar action
  console.log(e);
  if (e.srcElement === playerIdInput || e.srcElement === playerNameInput) {
    e.srcElement.value = e.srcElement.value + " "
    return; // Do nothing if the focus is on an input field
  }
  
  if (!gameRunning && !gameOver) {
    promptForUserDetails();
  } else if (gameRunning) {
    gameRunning = false; // Pause the game
  }
}

function savePlayerDetails() {
  if (playerId && playerName) {
    const playerData = {
      id: playerId,
      name: playerName,
      score: score,
    };

    let players = JSON.parse(localStorage.getItem("players")) || [];
    const existingPlayerIndex = players.findIndex((player) => player.id === playerId);

    if (existingPlayerIndex >= 0) {
      if (players[existingPlayerIndex].score < score) {
        players[existingPlayerIndex].score = score;
      }
    } else {
      players.push(playerData);
    }

    localStorage.setItem("players", JSON.stringify(players));
  }
}

function displayPreviousPlayers() {
  const players = JSON.parse(localStorage.getItem("players")) || [];

  playerTableBody.innerHTML = "";
  players.sort((a, b) => b.score - a.score); // Sort by score in descending order
  players.forEach((player) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${player.id}</td>
            <td>${player.name}</td>
            <td>${player.score}</td>
        `;
    playerTableBody.appendChild(tr);
  });
}

function resetGame() {
  score = 0;
  lives = 5;
  gameOver = false;
  fruit.x = Math.random() * (canvas.width - fruit.size);
  fruit.y = 0;
  fruit.speed = 3;
  gameRunning = false;
  playerId = "";
  playerName = "";
  displayPreviousPlayers();
}

document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    handleSpacebar(e);
  } else {
    moveBasket(e);
  }
});

document.addEventListener("keyup", stopBasket);
closeModal.addEventListener("click", hideModal);

// Initial screen before the game starts
ctx.clearRect(0, 0, canvas.width, canvas.height);
drawBasket();
drawFruit();
drawText("Press Space to Start", canvas.width / 2 - 150, canvas.height / 2, "30px", "black");
displayPreviousPlayers();
