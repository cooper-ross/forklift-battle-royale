var socket = io();
var socketSignal;

var mousePosition = { x: 0, y: 0 };
var hideMouse = false;

var offset = { x: 0, y: 0 };

var zoom = 1.8;

var shieldDisplay = 0;
var redShieldEffect = 0;
var healthDisplay = 0;
var redHealthEffect = 0;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Since I'm committed to never using drawImage, I individually draw each rectangle to form a gun top down sprite and also the side view icon
const gunTextures = {
  pistol: {
    icon(x, y, width, height) {
      ctx.save();
      drawRotatedRectangle({ x: x+width-25, y: y+height-25 }, { x: x+25.5, y: y+height-15 }, 8, '#343334', '#9da6a8');
      drawRotatedRectangle({ x: x+20, y: y+15 }, { x: x+width-20, y: y+height-25 }, 8, '#343334', '#9da6a8');
      ctx.restore();
    },
    sprite(playerX, playerY, playerGunTipOffset, player) {
      ctx.save();
      const shootPoint = { x: playerX, y: playerY };
      const gunTipOffset = { x: playerX + player.viewDir.x * playerGunTipOffset, y: playerY + player.viewDir.y * playerGunTipOffset };
      drawRotatedRectangle(shootPoint, gunTipOffset, 8, '#343334', '#9da6a8');
      ctx.restore();
    }
  },
  shotgun: {
    icon(x, y, width, height) {
      ctx.save();
      drawRotatedRectangle({ x: x+width-18, y: y+height-20 }, { x: x+45.5, y: y+height-10 }, 8, '#343334', '#9da6a8');
      
      drawRotatedRectangle({ x: x+20, y: y+13 }, { x: x+width-15, y: y+height-22 }, 3, '#343334', '#9da6a8');
      drawRotatedRectangle({ x: x+width-30, y: y+height-37 }, { x: x+15, y: y+height-22 }, 6, '#343334', '#9da6a8');
      drawRotatedRectangle({ x: x+25, y: y+20 }, { x: x+width-15, y: y+height-20 }, 10, '#343334', '#9da6a8');
      drawRotatedRectangle({ x: x+25, y: y+20 }, { x: x+width-15, y: y+height-20 }, 1, '#343334', '#9da6a8');
      ctx.restore();
    },
    sprite(playerX, playerY, playerGunTipOffset, player) {
      ctx.save();
      const shootPoint = { x: playerX, y: playerY };
      const gunBarrelOffset = { x: playerX + player.viewDir.x * 55, y: playerY + player.viewDir.y * 55 };
      const gunTipOffset = { x: playerX + player.viewDir.x * 70, y: playerY + player.viewDir.y * 70 };
      drawRotatedRectangle(shootPoint, gunTipOffset, 3, '#343334', '#9da6a8');
      drawRotatedRectangle(shootPoint, gunBarrelOffset, 10, '#343334', '#9da6a8');
      drawRotatedRectangle(shootPoint, gunBarrelOffset, 1, '#343334', '#9da6a8');
      ctx.restore();
    }
  },
  smg: {
    icon(x, y, width, height) {
      ctx.save();
      drawRotatedRectangle({ x: x+width-30+5, y: y+height-35+3 }, { x: x+25+5, y: y+height-15+3 }, 6, '#343334', '#9da6a8');
      drawRotatedRectangle({ x: x+width-35+5, y: y+height-40+3 }, { x: x+10+5, y: y+height-25+3 }, 6, '#343334', '#9da6a8');
      drawRotatedRectangle({ x: x+15 +5, y: y+10+3 }, { x: x+width-20+5, y: y+height-25+3 }, 3, '#343334', '#9da6a8');
      drawRotatedRectangle({ x: x+20 +5, y: y+15+3 }, { x: x+width-20+5, y: y+height-25+3 }, 8, '#343334', '#9da6a8');
      ctx.restore();
    },
    sprite(playerX, playerY, playerGunTipOffset, player) {
      ctx.save();
      const shootPoint = { x: playerX, y: playerY };
      const gunTipOffset2 = { x: playerX + player.viewDir.x * 40, y: playerY + player.viewDir.y * 40 };
      const gunTipOffset = { x: playerX + player.viewDir.x * playerGunTipOffset, y: playerY + player.viewDir.y * playerGunTipOffset };
      drawRotatedRectangle(shootPoint, gunTipOffset2, 10, '#343334', '#9da6a8');
      drawRotatedRectangle(gunTipOffset2, gunTipOffset, 1, '#343334', '#9da6a8');
      ctx.restore();
    }
  }
}

// Object that stores the current pressed keys, mouse position, and view direction (and inventory slot)
const playerMovement = {
  up: false,
  down: false,
  left: false,
  right: false,
  shoot: false,
  reload: false,
  viewDirection: { x: 0, y: 0 },
  selectedSlot: 0
};

// Function that runs whenever a key is pressed, and helps us track which keys are pressed
const keyDownHandler = (e) => {
  if (e.keyCode == 39 || e.keyCode == 68) {
    playerMovement.right = true;
  } else if (e.keyCode == 37 || e.keyCode == 65) {
    playerMovement.left = true;
  } else if (e.keyCode == 38 || e.keyCode == 87) {
    playerMovement.up = true;
  } else if (e.keyCode == 40 || e.keyCode == 83) {
    playerMovement.down = true;
  } else if (e.keyCode == 82) {
    playerMovement.reload = true;
  }
};

// Function that runs when a key is released, and helps us track which keys are non pressed any more
const keyUpHandler = (e) => {
  if (e.keyCode == 39 || e.keyCode == 68) {
    playerMovement.right = false;
  } else if (e.keyCode == 37 || e.keyCode == 65) {
    playerMovement.left = false;
  } else if (e.keyCode == 38 || e.keyCode == 87) {
    playerMovement.up = false;
  } else if (e.keyCode == 40 || e.keyCode == 83) {
    playerMovement.down = false;
  } else if (e.keyCode == 82) {
    playerMovement.reload = false;
  }
};

// Make the functions run whenever the events happen
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

// Function that runs when the mouse is clicked, held, or right clicked
document.addEventListener("mousedown", (event) => {
  playerMovement.shoot = true;
});

// When the mouse is released, stop shooting
document.addEventListener("mouseup", (event) => {
  playerMovement.shoot = false;
});

// This is so we can track the players view direction later on in the main runtime
canvas.addEventListener("mousemove", function (event) {
  var rect = canvas.getBoundingClientRect();
  hideMouse = false;
  mousePosition = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
});

// This is a personal touch, so the mouse is hidden when the user has it off screen
canvas.addEventListener("mouseleave", function () {
  hideMouse = true;
});

// Listen for mouse scroll and move to the next/previous weapon slot
canvas.addEventListener("wheel", function (event) {
  if (event.deltaY < 0) {
    playerMovement.selectedSlot--;
    if (playerMovement.selectedSlot < 0) playerMovement.selectedSlot = 3;
  } else {
    playerMovement.selectedSlot++;
    if (playerMovement.selectedSlot > 3) playerMovement.selectedSlot = 0;
  }
});


// Select the submit button
var submitButton = document.getElementById('submit');

// Add event listener to the submit button
submitButton.addEventListener('click', function(event) {
  event.preventDefault(); // Prevent form submission

  // Get the value of the name input field
  var name = document.getElementById('name').value;
  socketSignal = socket.emit('newPlayer', name);

  document.getElementById("pregame-screen").remove();
});

// This function is responsible for drawing the player and gun sprites
function drawPlayer(player) {
  if (!player.alive) return;

  // Camera center coords
  const playerX = player.xPos + offset.x + player.width/2;
  const playerY = player.yPos + offset.y + player.height/2;

  // Player body styles
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#343334";
  ctx.fillStyle = '#FCC876';
  if (player.wasJustHit) ctx.fillStyle = '#ff7b4f';

  // Left hand
  const leftVector = offsetVector(player.viewDir, 20);
  const leftHandOffset = { x: playerX + leftVector.x * 27, y: playerY + leftVector.y * 27 };
  ctx.beginPath();
  ctx.arc(leftHandOffset.x, leftHandOffset.y, 10, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Right hand
  const rightVector = offsetVector(player.viewDir, -10);
  const rightHandOffset = { x: playerX + rightVector.x * 35, y: playerY + rightVector.y * 35 };
  ctx.beginPath();
  ctx.arc(rightHandOffset.x, rightHandOffset.y, 10, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  
  // Gun
  const heldGun = player.inventory[player.selectedSlot];
  if (heldGun) gunTextures[heldGun.texture].sprite(playerX, playerY, heldGun.tipOffset, player);

  // Actual player body
  ctx.beginPath();
  ctx.arc(playerX, playerY, player.width/2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

function drawPlayerName(player) {
  if (!player.alive) return;
  if (player.hideName && player.id != socket.id) return;

  // Semi transparent for the client to show that their name is hidden
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  if (player.id === socket.id && player.hideName) {
    ctx.fillStyle = "#ffffff80";
    ctx.strokeStyle = '#00000080';
  }

  const playerX = player.xPos + offset.x + player.width/2;
  const playerY = player.yPos + offset.y + player.height/2;  
  ctx.textAlign = "center";
  ctx.font = "15px Catamaran";
  ctx.lineWidth = 3;
  ctx.strokeText(player.name || "Guest", playerX, playerY-40);
  ctx.fillText(player.name || "Guest", playerX, playerY-40);
}

function drawBlock(block) {
  ctx.fillStyle = '#6E8297';
  ctx.fillRect(block.xPos + offset.x, block.yPos + offset.y, block.width, block.height);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#343334';
  ctx.strokeRect(block.xPos + offset.x, block.yPos + offset.y, block.width, block.height);
}

function drawPickup(pickup) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(pickup.xPos + offset.x, pickup.yPos + offset.y, pickup.width, pickup.height);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#343334';
  ctx.strokeRect(pickup.xPos + offset.x, pickup.yPos + offset.y, pickup.width, pickup.height);
  

  if (pickup.type === "health") {
    ctx.strokeStyle = '#FF4C4C';
    ctx.strokeText("+", pickup.xPos + offset.x + pickup.width/2, pickup.yPos + offset.y + pickup.height/2);
  } else {
    ctx.strokeStyle = '#919191';
    ctx.strokeText("[]", pickup.xPos + offset.x + pickup.width/2, pickup.yPos + offset.y + pickup.height/2);
  }
}

function drawTree(tree, gameState) {
  // Trunk
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#343334';
  ctx.fillStyle = '#8a610f';
  ctx.beginPath();
  ctx.arc(tree.xPos + offset.x + tree.width/2, tree.yPos + offset.y + tree.height/2, tree.width/2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#18b87d';

  const player = gameState.players[socket.id];
  let distanceToTree = 1000;
  if (player && player.alive) distanceToTree = Math.sqrt(Math.pow((tree.xPos-player.xPos), 2) + Math.pow((tree.yPos-player.yPos), 2));
  if (player && !player.alive) distanceToTree = 10;

  // Foliage
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#343334' + convertAlphaToHex(distanceToTree*tree.foliageRadius/200);
  ctx.fillStyle = '#18b87d' + convertAlphaToHex(distanceToTree*tree.foliageRadius/200);
  ctx.beginPath();
  ctx.arc(tree.xPos + offset.x + tree.width/2, tree.yPos + offset.y + tree.height/2, tree.foliageRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

function drawBullet(bullet, gameState) {
  const player = gameState.players[socket.id];
  if (!bullet || !player) return;

  const distanceToBullet = Math.sqrt( Math.pow((bullet.xPos-player.xPos), 2) + Math.pow((bullet.yPos-player.yPos), 2) );
  if (distanceToBullet > 900) return;

  const startingSpeedFactor = Math.abs(bullet.xSpeed)+Math.abs(bullet.ySpeed);
  let prevPositionX, prevPositionY;
  if (bullet.distanceTraveled > startingSpeedFactor * 4) {
    prevPositionX = bullet.xPos - bullet.xSpeed * 4;
    prevPositionY = bullet.yPos - bullet.ySpeed * 4;
  } else {
    prevPositionX = bullet.startPosition.x;
    prevPositionY = bullet.startPosition.y;
  }

  if (bullet.distanceTraveled < startingSpeedFactor*4) {
    if (distanceToBullet < 700) {
      screenShake(7 - distanceToBullet/100);
    }
  }

  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(prevPositionX + offset.x + bullet.width/2, prevPositionY + offset.y + bullet.height/2);
  ctx.lineTo(bullet.xPos + offset.x + bullet.width/2, bullet.yPos + offset.y + bullet.height/2);
  ctx.strokeStyle = "#ffffff33";
  ctx.stroke();
  
  ctx.lineWidth = 3;
  ctx.fillStyle = '#6E8297' + convertAlphaToHex(bullet.deleteCounter);
  ctx.strokeStyle = "#343334" + convertAlphaToHex(bullet.deleteCounter);
  ctx.beginPath();
  ctx.arc(bullet.xPos + offset.x + bullet.width/2, bullet.yPos + offset.y + bullet.height/2, (bullet.deleteCounter/25), 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke(); 
}

function drawBulletEffects(bullet, gameState) {
    // Muzzle flash
    const timeSizeScaleQuadratic = Math.max(9-(bullet.distanceTraveled/20-3)^2, 0);
    if (timeSizeScaleQuadratic != 0) {
      ctx.fillStyle = 'white'
      ctx.strokeStyle = '#ffe100'
      ctx.lineWidth = timeSizeScaleQuadratic;
  
      ctx.beginPath();
      ctx.arc(bullet.startPosition.x + offset.x + bullet.width/2 + (Math.random() * 8 - 4), bullet.startPosition.y + offset.y + bullet.height/2 + (Math.random() * 8 - 4), timeSizeScaleQuadratic, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
    }
}

function drawBackground() {
  ctx.fillStyle = '#698D41';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#506d2f';
  ctx.fillRect(offset.x, 0, -canvas.width, canvas.height);
  ctx.fillRect(offset.x + 2200, 0, canvas.width, canvas.height);

  ctx.fillRect(0, offset.y, canvas.width, -canvas.height);
  ctx.fillRect(0, offset.y + 2200, canvas.width, canvas.height);
}

function drawGUI(gameState) {
  // If the player doesn't have stuff like health loaded yet, ignore this function
  const player = gameState.players[socket.id];
  if (!player) return;

  // Destructure player object for better readability
  const { health, shield } = player;

  if (healthDisplay < health) healthDisplay = health;
  if (shieldDisplay < shield) shieldDisplay = shield;
  if (redHealthEffect < health) redHealthEffect = health;
  if (redShieldEffect < shield) redShieldEffect = shield;

  healthDisplay = lerp(healthDisplay, health, 0.5);
  shieldDisplay = lerp(shieldDisplay, shield, 0.5);

  redHealthEffect = lerp(redHealthEffect, health, 0.1);
  redShieldEffect = lerp(redShieldEffect, shield, 0.1);


  // Calculate ratios using a single function
  const calculateRatioShield = (value) => Math.max(Math.min(value, 100), 0) / 100;
  const calculateRatioHealth = (value) => Math.max(Math.min(value, 100), 5) / 100;
  const healthRatio = calculateRatioHealth(healthDisplay);
  const redHealthRatio = calculateRatioHealth(redHealthEffect);
  const shieldRatio = calculateRatioShield(shieldDisplay);
  const redShieldRatio = calculateRatioShield(redShieldEffect);

  // Zoomed out GUI
  const canvasHeight = canvas.height/zoom;
  const canvasWidth = canvas.width/zoom;

  // Set common properties for the health bar
  const healthBarHeight = 35;
  const healthBarWidth = canvasWidth/4;
  const padding = 10;
  const baseY = canvasHeight - healthBarHeight - padding;

  // Draw background bars
  const drawBackgroundBar = (y) => {
    ctx.fillStyle = '#3e464a';
    ctx.fillRect(padding, y, healthBarWidth, healthBarHeight);
  };

  // Draw health and shield bars
  const drawBar = (y, color, ratio) => {
    ctx.fillStyle = color;
    ctx.fillRect(padding, y, healthBarWidth * ratio, healthBarHeight);
  };

  // Draw background bars
  drawBackgroundBar(canvasHeight - healthBarHeight - padding);
  drawBackgroundBar(canvasHeight - 2 * healthBarHeight - 2 * padding);

  drawBar(canvasHeight - healthBarHeight - padding, '#e33b3b', redHealthRatio);
  drawBar(canvasHeight - 2 * healthBarHeight - 2 * padding, '#e33b3b', redShieldRatio);

  // Draw shield and health bars
  drawBar(canvasHeight - healthBarHeight - padding, '#2fb56b', healthRatio);
  drawBar(canvasHeight - 2 * healthBarHeight - 2 * padding, '#0db1de', shieldRatio);

  // Set common properties for the stroke
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#222a2e';

  // Draw the strokes for both bars
  ctx.strokeRect(padding, baseY, healthBarWidth, healthBarHeight);
  ctx.strokeRect(padding, baseY - healthBarHeight - padding, healthBarWidth, healthBarHeight);

  // Draw a small white rectangle above of the shield bar to the right
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(padding + healthBarWidth - 10, baseY - 2*healthBarHeight - 2*padding, 10, healthBarHeight);
  ctx.strokeRect(padding + healthBarWidth - 10, baseY - 2*healthBarHeight - 2*padding, 10, healthBarHeight);

  ctx.fillRect(padding + healthBarWidth - 27, baseY - 2*healthBarHeight - 2*padding, 10, healthBarHeight);
  ctx.strokeRect(padding + healthBarWidth - 27, baseY - 2*healthBarHeight - 2*padding, 10, healthBarHeight);

  ctx.fillRect(padding + healthBarWidth - 44, baseY - 2*healthBarHeight - 2*padding, 10, healthBarHeight);
  ctx.strokeRect(padding + healthBarWidth - 44, baseY - 2*healthBarHeight - 2*padding, 10, healthBarHeight);

  // 
  const heldGun = player.inventory[player.selectedSlot];

  // Ammo counter
  ctx.font = "25px Catamaran";
  ctx.textAlign = "right";
  ctx.lineWidth = 8;
  ctx.strokeText(`${heldGun.currentAmmo}/${heldGun.totalAmmo}`, padding + healthBarWidth - 55, baseY - 2*healthBarHeight - padding + 20);
  ctx.fillText(`${heldGun.currentAmmo}/${heldGun.totalAmmo}`, padding + healthBarWidth - 55, baseY - 2*healthBarHeight - padding + 20);

  // Draw a circle loading bar to show reloading time - small version for hud gui
  ctx.strokeStyle = '#222a2e';
  ctx.fillStyle = '#222a2e';
  ctx.beginPath();
  ctx.arc(padding + 15, baseY - 2*healthBarHeight - padding + healthBarHeight/2, 8, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fill();

  ctx.beginPath();
  if (heldGun.reloadCounter > 0) {
    ctx.strokeStyle = '#ffffff';
    ctx.arc(padding + 15, baseY - 2*healthBarHeight - padding + healthBarHeight/2, 6, Math.PI * 1.5, Math.PI * (1.5 + 2 * heldGun.reloadCounter/heldGun.reloadTime));
  } else if (heldGun.currentAmmo > 0) {
    ctx.strokeStyle = '#ffffff';
    ctx.arc(padding + 15, baseY - 2*healthBarHeight - padding + healthBarHeight/2, 6, Math.PI * 1.5, Math.PI * (1.5 + 2 * 1));
  } else {
    ctx.strokeStyle = '#ffffff33';
    ctx.arc(padding + 15, baseY - 2*healthBarHeight - padding + healthBarHeight/2, 6, Math.PI * 1.5, Math.PI * (1.5 + 2 * 1));
  }
  ctx.lineWidth = 5;
  ctx.stroke();

  // Big version for when you're holding the gun
  if (heldGun.reloadCounter > 0) {
    ctx.fillStyle = '#222a2e33';
    ctx.beginPath();
    ctx.arc(canvasWidth/2, canvasHeight/2-90, 28, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(canvasWidth/2, canvasHeight/2-90, 18, Math.PI * 1.5, Math.PI * (1.5 + 2 * heldGun.reloadCounter/heldGun.reloadTime));
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#ffffff33';
    ctx.stroke();
  }


  // Function to draw the a inventory slot on the right side of the screen
  const drawInventorySlot = (slot, x, y, width, height, color, strokeColor) => {

    if (player.selectedSlot === slot) {
      ctx.strokeStyle = "#d6d6d6";
    } else {
      ctx.strokeStyle = strokeColor;
    }
    ctx.lineWidth = 4;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    const heldGun = player.inventory[slot];
    if (heldGun) gunTextures[heldGun.texture].icon(x, y, width, height);
  };

  // Draw the inventory slots
  const slotSideLength = 60;

  drawInventorySlot(3, canvasWidth - padding - slotSideLength, canvasHeight - padding - slotSideLength, slotSideLength, slotSideLength, '#4b5963', '#222a2e');
  drawInventorySlot(2, canvasWidth - 2*padding - 2*slotSideLength, canvasHeight - padding - slotSideLength, slotSideLength, slotSideLength, '#4b5963', '#222a2e');
  drawInventorySlot(1, canvasWidth - 3*padding - 3*slotSideLength, canvasHeight - padding - slotSideLength, slotSideLength, slotSideLength, '#4b5963', '#222a2e');
  drawInventorySlot(0, canvasWidth - 4*padding - 4*slotSideLength, canvasHeight - padding - slotSideLength, slotSideLength, slotSideLength, '#4b5963', '#222a2e');

  ctx.font = "15px Catamaran";
  ctx.textAlign = "right";
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#222a2e';
  ctx.fillStyle = '#ffffff';

  const description = heldGun.name || 'Nothing Held';

  ctx.strokeText(`${description}`, canvasWidth-padding, canvasHeight - 2*padding - slotSideLength);
  ctx.fillText(`${description}`, canvasWidth-padding, canvasHeight - 2*padding - slotSideLength);


  // Draw mouse crosshair
  if (!hideMouse) {
    ctx.scale(1/zoom,1/zoom);
    ctx.beginPath();
    ctx.moveTo(mousePosition.x, mousePosition.y-20);
    ctx.lineTo(mousePosition.x, mousePosition.y+20);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();
  
    ctx.beginPath();
    ctx.moveTo(mousePosition.x-20, mousePosition.y);
    ctx.lineTo(mousePosition.x+20, mousePosition.y);
    ctx.stroke();
  }
}

function drawGrid() {
  // Define the spacing between grid lines
  const gridSpace = 50;
  
  // Calculate the left and top offsets based on the grid space
  const left = (offset.x % gridSpace);
  const top = (offset.y % gridSpace);

  // Set line styles for the grid
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#465e2b33';

  // Function to draw lines based on start, end, and direction (vertical or horizontal)
  function drawLines(start, end, isVertical) {
    for (let i = start; i < end; i += gridSpace) {
      ctx.beginPath();
      isVertical ? ctx.moveTo(i, 0) : ctx.moveTo(0, i);
      isVertical ? ctx.lineTo(i, canvas.height) : ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
  }

  // Draw the lines
  drawLines(left, canvas.width, true);
  drawLines(top, canvas.height, false);
}

function drawLoadingScreen() {
  // Zoomed out GUI
  const canvasHeight = canvas.height/zoom;
  const canvasWidth = canvas.width/zoom;
  
  ctx.fillStyle = '#698D41';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = '#506d2f';
  ctx.fillRect(offset.x, 0, -canvasWidth, canvasHeight);
  ctx.fillRect(offset.x + 2200, 0, canvasWidth, canvasHeight);

  ctx.fillRect(0, offset.y, canvasWidth, -canvasHeight);
  ctx.fillRect(0, offset.y + 2200, canvasWidth, canvasHeight);

  ctx.lineWidth = 5;
  ctx.strokeStyle = '#222a2e';
  ctx.fillStyle = '#ffffff';
  ctx.font = "30px Catamaran";
  ctx.textAlign = "center";
  ctx.strokeText("Loading...", canvasWidth/2, canvasHeight/2);
  ctx.fillText("Loading...", canvasWidth/2, canvasHeight/2);
}

socket.on('state', (gameState) => {
  if (!socketSignal || !socketSignal.connected) return;
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(zoom,zoom);

  const player = gameState.players[socket.id];
  if (!player) return drawLoadingScreen();

  // Calculate the offset of the camera
  offset = {
    x: lerp(offset.x, canvas.width/(2*zoom)-player.xPos-player.width/2, 0.05),
    y: lerp(offset.y, canvas.height/(2*zoom)-player.yPos-player.height/2, 0.05) 
  }

  drawBackground();
  drawGrid();

  gameState.pickups.forEach(pickup => {
    //drawBullet(bullet, gameState);
    drawPickup(pickup);
  });

  gameState.bullets.forEach(bullet => {
    drawBullet(bullet, gameState);
  });

  Object.values(gameState.players).forEach(player => {
    drawPlayer(player);
  })

  gameState.blocks.forEach(block => {
    drawBlock(block);
  });

  gameState.bullets.forEach(bullet => {
    drawBulletEffects(bullet, gameState);
  });

  gameState.trees.forEach(tree => {
    drawTree(tree, gameState);
  });

  Object.values(gameState.players).forEach(player => {
    drawPlayerName(player);
  })

  if (player.alive) {
    // These variables are screenspace positions so we can use them for the view direction
    const playerX = (player.xPos + offset.x + player.width / 2) * zoom;
    const playerY = (player.yPos + offset.y + player.height / 2) * zoom;
    
    // Set the view direction based on the mouse position
    playerMovement.viewDirection = getViewDirectionVector({ x: playerX, y: playerY }, mousePosition);

    // Draw the GUI
    drawGUI(gameState);
  }

  socket.emit('playerMovement', playerMovement);
});


/* ------------------------------ *\
 * Helper Functions
\* ------------------------------ */

// We'll use this for the camera, health, and anything else where smooth motion looks better
function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

// We'll use this for the player's view direction and weapon rotation
function getViewDirectionVector(point1, point2) {
    const deltaX = point2.x - point1.x;
    const deltaY = point2.y - point1.y;
    
    // Calculate the length of the vector
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Avoid division by zero
    if (length === 0) {
      return { x: 0, y: 0 };
    }
    
    // Normalize the vector
    const normalizedX = deltaX / length;
    const normalizedY = deltaY / length;

    return { x: normalizedX, y: normalizedY };
}

// We'll use this to draw the gun sprites and icons for the inventory
function drawRotatedRectangle(start, end, thickness, color, fillColor) {
  // Calculate the angle of rotation
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  // Calculate the half-thickness offset
  const halfThicknessX = thickness * 0.5 * Math.cos(angle + Math.PI * 0.5);
  const halfThicknessY = thickness * 0.5 * Math.sin(angle + Math.PI * 0.5);

  // Calculate the four corner points of the rectangle
  const p1 = { x: start.x + halfThicknessX, y: start.y + halfThicknessY };
  const p2 = { x: end.x + halfThicknessX, y: end.y + halfThicknessY };
  const p3 = { x: end.x - halfThicknessX, y: end.y - halfThicknessY };
  const p4 = { x: start.x - halfThicknessX, y: start.y - halfThicknessY };

  // Draw the rectangle
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();

  // Set styles and stroke/fill the rectangle
  ctx.lineWidth = 7;
  ctx.strokeStyle = color;
  ctx.fillStyle = fillColor || 'transparent';

  ctx.stroke();
  ctx.fill();
}

// This is for the gun sprites, so they can be rotated
function offsetVector(originalVector, offsetDegrees) {
  // Convert degrees to radians
  const offset = (Math.PI / 180) * offsetDegrees;
  
  // Calculate new direction
  const offsetX = originalVector.x * Math.cos(offset) - originalVector.y * Math.sin(offset);
  const offsetY = originalVector.x * Math.sin(offset) + originalVector.y * Math.cos(offset);
  
  return { x: offsetX, y: offsetY };
}

function convertAlphaToHex(alphaDecimal) {
  // Convert alphaDecimal to a value between 0 and 1
  const alpha = alphaDecimal / 100;

  // Calculate the equivalent alpha value in the range of 0 to 255
  const alphaInt = Math.round(alpha * 255);

  // Convert alphaInt to hexadecimal string
  const alphaHex = alphaInt.toString(16).toUpperCase();

  // Pad the hexadecimal value with leading zero if needed
  const paddedAlphaHex = alphaHex.padStart(2, '0');

  return paddedAlphaHex;
}

function screenShake(shakeIntensity) {
  var randomOffset = {
    x: Math.random() * shakeIntensity - shakeIntensity / 2,
    y: Math.random() * shakeIntensity - shakeIntensity / 2
  };

  // Apply the offsets to the original variables
  offset.x += randomOffset.x;
  offset.y += randomOffset.y;
}