const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

let basket = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 50,
  width: 150,
  height: 20,
  velocity: 0,
  maxSpeed: 15,
  acceleration: 1,
  friction: 0.9,
};

const fruitImages = {};
const heartImages = {};
const fruitTypes = [
  { type: "apple", size: 40, score: 1 },
  { type: "bomb", size: 50, score: -5 },
  { type: "banana", size: 50, score: 2 },
  { type: "tnt", size: 50, score: -2 },
  { type: "grape", size: 60, score: 2 },
  { type: "pineapple", size: 60, score: 3 },
];
const fruits = [];
const maxFruits = 3; // Maximum number of fruits on the screen at the same time

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
const fruitTableBody = document.getElementById("fruitTableBody"); // Fruit info table body
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const userDetailsForm = document.getElementById("userDetailsForm");
const playerIdInput = document.getElementById("playerId");
const playerNameInput = document.getElementById("playerName");
const errorMessage = document.getElementById("error-message");

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

async function loadFruitImages() {
  fruitImages.apple = await loadImage("./images/apple.png");
  fruitImages.banana = await loadImage("./images/banana.png");
  fruitImages.grape = await loadImage("./images/grape.png");
  heartImages.filled = await loadImage("./images/heart.png"); // Load filled heart image
  heartImages.empty = await loadImage("./images/empty_heart.png"); // Load empty heart image
  fruitImages.bomb = await loadImage("./images/bomb.png");
  fruitImages.tnt = await loadImage("./images/tnt.png");
  fruitImages.pineapple = await loadImage("./images/pineapple.png")
}

function showModal() {
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  playerIdInput.focus();
}

function hideModal() {
  modal.style.display = "none";
}

// Add event listener to closeModal button
closeModal.addEventListener("click", function () {
  hideModal();
});

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

function drawFruits() {
  fruits.forEach((fruit) => {
    const fruitImage = fruitImages[fruit.type];
    if (fruitImage) {
      ctx.drawImage(fruitImage, fruit.x, fruit.y, fruit.size, fruit.size);
    }
  });
}

function drawText(text, x, y, size = "20px", color = "black") {
  ctx.font = `${size} Arial`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawHeart(x, y, size) {
  const heartImage = heartImages.filled;
  if (heartImage) {
    ctx.drawImage(heartImage, x, y, size, size);
  }
}

function drawEmptyHeart(x, y, size) {
  const emptyHeartImage = heartImages.empty;
  if (emptyHeartImage) {
    ctx.drawImage(emptyHeartImage, x, y, size, size);
  }
}

function drawScoreboard() {
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);

  const heartSize = 30;
  const heartSpacing = 40;
  const startX = canvas.width - (heartSize + heartSpacing);
  const startY = 30;

  for (let i = 0; i < 5; i++) {
    if (i < lives) {
      drawHeart(startX - i * (heartSize + heartSpacing), startY, heartSize);
    } else {
      drawEmptyHeart(
        startX - i * (heartSize + heartSpacing),
        startY,
        heartSize
      );
    }
  }
}

// Function to populate the fruit info table
function populateFruitInfoTable() {
  fruitTableBody.innerHTML = "";

  fruitTypes.forEach((fruit) => {
    const row = document.createElement("tr");
    // Fruit Image
    const fruitImage = fruitImages[fruit.type];
    const imgCell = document.createElement("td");
    const img = document.createElement("img");
    img.src = fruitImage.src; // Ensure this path is correct
    img.alt = fruit.type;
    img.width = 50; // Set the desired width for the image
    img.height = 50; // Set the desired height for the image
    imgCell.appendChild(img);
    row.appendChild(imgCell);

    // const sizeCell = document.createElement("td");
    // sizeCell.textContent = fruit.size;
    // row.appendChild(sizeCell);

    const scoreCell = document.createElement("td");
    scoreCell.textContent = fruit.score;
    row.appendChild(scoreCell);

    fruitTableBody.appendChild(row);
  });
  const row = document.createElement("tr");
  const textCell = document.createElement("td");
  textCell.textContent = "Miss";
  row.appendChild(textCell);
  const scoreCell = document.createElement("td");
  scoreCell.textContent = "-1";
  row.appendChild(scoreCell);
  fruitTableBody.appendChild(row);
}

function update() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawScoreboard();
  drawBasket();
  drawFruits();

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
    }, 2000);
    return;
  }

  if (!gamePaused) {
    basket.velocity *= basket.friction;
    basket.velocity = Math.max(
      -basket.maxSpeed,
      Math.min(basket.velocity, basket.maxSpeed)
    );
    basket.x += basket.velocity;

    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width)
      basket.x = canvas.width - basket.width;

    fruits.forEach((fruit, index) => {
      if (fruit.score < 0) {
        fruit.y += 2 * fruit.speed;
      } else {
        fruit.y += fruit.speed;
      }

      if (
        fruit.y + fruit.size > basket.y &&
        fruit.x + fruit.size > basket.x &&
        fruit.x < basket.x + basket.width
      ) {
        score += fruit.score;
        fruits.splice(index, 1);
        if (fruits.length < maxFruits) {
          fruits.push(createRandomFruit());
        }
        if (fruit.score < 0) {
          lives--;
        }
      } else if (fruit.y + fruit.size > canvas.height) {
        if(fruit.score > 0){
            score--;
        }
        fruits.splice(index, 1);
        if (fruits.length < maxFruits) {
          fruits.push(createRandomFruit());
        }
      }
    });

    if (lives <= 0) {
      gameOver = true;
    }
  }

  requestAnimationFrame(update);
}

function createRandomFruit() {
  const randomIndex = Math.floor(Math.random() * fruitTypes.length);
  return {
    ...fruitTypes[randomIndex],
    x: Math.random() * (canvas.width - 60),
    y: 0,
    speed: 3 + Math.random() * 2,
  };
}

function handleKeyDown(e) {
  if (e.key === "ArrowRight") {
    isMovingRight = true;
  } else if (e.key === "ArrowLeft") {
    isMovingLeft = true;
  } else if (e.key === " ") {
    handleSpacebar(e);
  }
}

function handleKeyUp(e) {
  if (e.key === "ArrowRight") {
    isMovingRight = false;
  } else if (e.key === "ArrowLeft") {
    isMovingLeft = false;
  }
}

function resetGame() {
  fruits.length = 0;
  score = 0;
  lives = 5;
  gameOver = false;
  gamePaused = false;

  for (let i = 0; i < maxFruits; i++) {
    fruits.push(createRandomFruit());
  }

  basket = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 50,
    width: 150,
    height: 20,
    velocity: 0,
    maxSpeed: 15,
    acceleration: 1,
    friction: 0.9,
  };

  populateFruitInfoTable(); // Populate the fruit info table

  promptForUserDetails();
}

function savePlayerDetails() {
  const players = JSON.parse(localStorage.getItem("players")) || [];

  const playerIndex = players.findIndex((player) => player.id === playerId);
  if (playerIndex !== -1) {
    // Update existing player
    players[playerIndex].name = playerName;
    if (score > players[playerIndex].score) {
      players[playerIndex].score = score;
    }
  } else {
    // Add new player
    players.push({ id: playerId, name: playerName, score });
  }

  localStorage.setItem("players", JSON.stringify(players));
}

function displayPreviousPlayers() {
  playerTableBody.innerHTML = "";
  const players = JSON.parse(localStorage.getItem("players")) || [];
  players.sort((a, b) => b.score - a.score);
  players.forEach((player) => {
    const row = document.createElement("tr");
    const idCell = document.createElement("td");
    const nameCell = document.createElement("td");
    const scoreCell = document.createElement("td");

    idCell.textContent = player.id;
    nameCell.textContent = player.name;
    scoreCell.textContent = player.score;

    row.appendChild(idCell);
    row.appendChild(nameCell);
    row.appendChild(scoreCell);

    playerTableBody.appendChild(row);
  });
}

function handleSpacebar(e) {
  if (e.key === " ") {
    if (!gameRunning) {
      gameRunning = true;
      update();
    } else if (gameOver) {
      resetGame();
    } else {
      gamePaused = !gamePaused;
      if (!gamePaused) {
        update();
      }
    }
  }
}

function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;

  basket.x = mouseX - basket.width / 2;

  if (basket.x < 0) basket.x = 0;
  if (basket.x + basket.width > canvas.width)
    basket.x = canvas.width - basket.width;
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
canvas.addEventListener("mousemove", handleMouseMove);

loadFruitImages().then(() => {
  resetGame();
  populateFruitInfoTable();
  displayPreviousPlayers();
  drawScoreboard();
});
