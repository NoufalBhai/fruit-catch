const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

const basket = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 50,
  width: 150,
  height: 20,
  velocity: 0,
  maxSpeed: 10,
  acceleration: 0.5,
  friction: 0.9,
};

// Load fruit images
const fruitImages = {
  apple: loadImage("apple.png"),
  banana: loadImage("banana.png"),
  grape: loadImage("grape.png"),
};

const fruitTypes = [
  { type: "apple", size: 40, score: 1 },
  { type: "banana", size: 50, score: 2 },
  { type: "grape", size: 60, score: 3 },
];

let fruit = getRandomFruit();

let score = 0;
let lives = 5;
let isMovingLeft = false;
let isMovingRight = false;
let gameRunning = false;
let gameOver = false;
let gamePaused = false;

let playerId = "";
let playerName = "";

const playerTableBody = document.getElementById("playerTableBody");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const userDetailsForm = document.getElementById("userDetailsForm");
const playerIdInput = document.getElementById("playerId");
const playerNameInput = document.getElementById("playerName");
const errorMessage = document.getElementById("error-message");

function showModal() {
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
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
  const fruitImage = fruitImages[fruit.type];
  if (fruitImage) {
    ctx.drawImage(fruitImage, fruit.x, fruit.y, fruit.size, fruit.size);
  }
}

function drawText(text, x, y, size = "20px", color = "black") {
  ctx.font = `${size} Arial`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawHeart(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.bezierCurveTo(
    x,
    y - size / 4,
    x - size / 2,
    y - size / 4,
    x - size / 2,
    y + size / 4
  );
  ctx.bezierCurveTo(
    x - size / 2,
    y + (size * 3) / 4,
    x,
    y + (size * 3) / 4,
    x,
    y + size / 4
  );
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();
}

function drawEmptyHeart(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.bezierCurveTo(
    x,
    y - size / 4,
    x - size / 2,
    y - size / 4,
    x - size / 2,
    y + size / 4
  );
  ctx.bezierCurveTo(
    x - size / 2,
    y + (size * 3) / 4,
    x,
    y + (size * 3) / 4,
    x,
    y + size / 4
  );
  ctx.strokeStyle = "red";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.closePath();
}

function drawScoreboard() {
  // Draw the score in the top left corner
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);

  // Draw lives in the top right corner
  const heartSize = 30;
  const heartSpacing = 40;
  const startX = canvas.width - (heartSize + heartSpacing); // Right edge minus the size and spacing
  const startY = 30; // Position the hearts just below the score

  for (let i = 0; i < 5; i++) {
    // Always draw 5 hearts
    if (i < lives) {
      drawHeart(startX - i * (heartSize + heartSpacing), startY, heartSize); // Full heart
    } else {
      drawEmptyHeart(
        startX - i * (heartSize + heartSpacing),
        startY,
        heartSize
      ); // Empty heart
    }
  }
}

function update() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawScoreboard();
  drawBasket();
  drawFruit();

  if (gameOver) {
    drawText(
      "Game Over",
      canvas.width / 2 - 150,
      canvas.height / 2,
      "50px",
      "red"
    );
    drawText(
      "Press Spacebar...",
      canvas.width / 2 - 150,
      canvas.height / 2 + 50,
      "20px",
      "black"
    );
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

  basket.velocity = Math.max(
    -basket.maxSpeed,
    Math.min(basket.velocity, basket.maxSpeed)
  );
  basket.x += basket.velocity;

  if (basket.x < 0) basket.x = 0;
  if (basket.x + basket.width > canvas.width)
    basket.x = canvas.width - basket.width;

  fruit.y += fruit.speed;

  if (
    fruit.y + fruit.size > basket.y &&
    fruit.x > basket.x &&
    fruit.x < basket.x + basket.width
  ) {
    score += fruit.score; // Add score based on fruit type
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

function getRandomFruit() {
  const randomIndex = Math.floor(Math.random() * fruitTypes.length);
  return {
    ...fruitTypes[randomIndex],
    x: Math.random() * (canvas.width - 40),
    y: 0,
    speed: 3 + Math.random() * 5,
  };
}

function resetFruit() {
  fruit = getRandomFruit(); // Get a new random fruit
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
  const focusedElement = document.activeElement;
  if (
    focusedElement.tagName === "INPUT" ||
    focusedElement.tagName === "TEXTAREA"
  ) {
    return;
  }

  e.preventDefault();
  if (gamePaused) {
    gamePaused = false;
    gameRunning = true;
    update(); // Continue the game
  } else if (!gameRunning && !gameOver) {
    promptForUserDetails();
  } else if (gameRunning) {
    gameRunning = false; // Pause the game
    gamePaused = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before redrawing
    drawText(
      "Game Paused",
      canvas.width / 2 - 150,
      canvas.height / 2,
      "50px",
      "green"
    );
  } else if (gameOver) {
    resetGame();
    promptForUserDetails();
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
    const existingPlayerIndex = players.findIndex(
      (player) => player.id === playerId
    );

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
  gameRunning = false;
  gamePaused = false;
  resetFruit();
}

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function populateFruitInfoTable() {
  const fruitInfoBody = document.getElementById("fruitInfoBody");
  fruitInfoBody.innerHTML = ""; // Clear existing content

  fruitTypes.forEach((fruit) => {
    const tr = document.createElement("tr");
    const fruitImage = fruitImages[fruit.type];

    // Create a td for the image
    const imgTd = document.createElement("td");
    const img = document.createElement("img");
    img.src = fruitImage.src;
    img.alt = fruit.type;
    img.width = fruit.size;
    img.height = fruit.size;
    imgTd.appendChild(img);

    // Create a td for the score
    const scoreTd = document.createElement("td");
    scoreTd.textContent = fruit.score;

    // Append the tds to the tr
    tr.appendChild(imgTd);
    tr.appendChild(scoreTd);

    // Append the tr to the table body
    fruitInfoBody.appendChild(tr);
  });
}

// Call this function during initialization
populateFruitInfoTable();

function initialize() {
  document.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      handleSpacebar(e);
    } else {
      moveBasket(e);
    }
  });

  document.addEventListener("keyup", stopBasket);
  closeModal.addEventListener("click", hideModal);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBasket();
  drawFruit();
  drawText(
    "Press Space to Start",
    canvas.width / 2 - 150,
    canvas.height / 2,
    "30px",
    "black"
  );
  displayPreviousPlayers();
  populateFruitInfoTable(); // Populate the fruit info table
}

initialize();
