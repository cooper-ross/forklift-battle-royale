// Initialize the server
var app = require('express')();
var express = require('express');
var path = require('path');
var http = require('http').createServer(app);
var io = require('socket.io')(http)

const Player = require('./world/Player');
const Block = require('./world/Block');
const Tree = require('./world/Tree');

const Health = require('./pickups/Health');
const Ammo = require('./pickups/Ammo');

const Pistol = require('./guns/Pistol');
const Shotgun = require('./guns/Shotgun');
const SMG = require('./guns/SMG');
const Sniper = require('./guns/Sniper');

// Serve the /client folder
var htmlPath = path.join(__dirname, 'client');
app.use(express.static(htmlPath));

// Variable that stores the players
const gameState = {
  players: {},
  blocks: [],
  trees: [],
  bullets: [],
  pickups: []
}

const playerMovements = {}

const fillWorldWithBlocks = () => {
  const blockSize = 50;
  const numBlocks = Math.floor(2140 / blockSize)+1;
  for (let i = 1; i < numBlocks; i++) {
    for (let j = 1; j < numBlocks; j++) {
      if (Math.random() > 0.05) continue; // 5% chance to spawn a block
      const xPos = i * blockSize;
      const yPos = j * blockSize;
      gameState.blocks.push(new Block(i * numBlocks + j, blockSize, blockSize, xPos, yPos));
    }
  }
};

const combineAjacentBlocks = () => {
  for (let i = 0; i < gameState.blocks.length; i++) {
    const block1 = gameState.blocks[i];

    for (let j = i + 1; j < gameState.blocks.length; j++) {
      const block2 = gameState.blocks[j];

      // Check if block2 is adjacent to block1
      if (
        block2.xPos === block1.xPos + block1.width && // block2 is to the right of block1
        block2.yPos === block1.yPos && // block2 is at the same vertical position as block1
        block2.height === block1.height // block2 has the same height as block1
      ) {
        // Combine block1 and block2
        block1.width += block2.width;
        gameState.blocks.splice(j, 1); // Remove block2 from the array
        j--; // Decrement j to account for the removed block
      } else if (
        block2.yPos === block1.yPos + block1.height && // block2 is below block1
        block2.xPos === block1.xPos && // block2 is at the same horizontal position as block1
        block2.width === block1.width // block2 has the same width as block1
      ) {
        // Combine block1 and block2
        block1.height += block2.height;
        gameState.blocks.splice(j, 1); // Remove block2 from the array
        j--; // Decrement j to account for the removed block
      }
    }
  }
}

const fillWorldWithTrees = () => {
  const numBlocks = Math.floor(2140 / 175) + 1;
  for (let i = 1; i < numBlocks; i++) {
    for (let j = 1; j < numBlocks; j++) {
      if (Math.random() > 0.05) continue; // 5% chance to spawn a tree

      var blockSize = 75 + Math.floor(Math.random() * 75);

      const xPos = i * blockSize;
      const yPos = j * blockSize;

      // Check if the position is occupied by a block
      let isOccupied = false;
      for (const block of gameState.blocks) {
        if (
          xPos >= block.xPos &&
          xPos <= block.xPos + block.width &&
          yPos >= block.yPos &&
          yPos <= block.yPos + block.height
        ) {
          isOccupied = true;
          break;
        }
      }

      // If the position is not occupied by a block, add a tree
      if (!isOccupied) {
        gameState.trees.push(new Tree(i * numBlocks + j, blockSize / 3, blockSize, xPos, yPos));
      }
    }
  }
};

// Fill the world with blocks
fillWorldWithBlocks();

// Now go through and "combine" blocks that are next to each other
for (let i = 0; i < 3; i++) combineAjacentBlocks();

// Fill the world with trees
fillWorldWithTrees();

// Set up event listeners for socket connections
io.on('connection', (socket) => {
  
  // Event handler for when a new player joins
  socket.on('newPlayer', (name) => {
    // Create a new player and add them to the game state
    const newPlayer = new Player(name, 0, 0, socket.id);
    gameState.players[socket.id] = newPlayer;

    // Pistol: 
    const pistol = new Pistol();
    const shotgun = new Shotgun(8, 6, 8);
    const smg = new SMG(15, 20, 5);
    const sniper = new Sniper();
    gameState.players[socket.id].inventory.push(pistol);
    gameState.players[socket.id].inventory.push(shotgun);
    gameState.players[socket.id].inventory.push(smg);
    gameState.players[socket.id].inventory.push(sniper);
    gameState.players[socket.id].selectedSlot = 0;
  })

  // Event handler for player movement updates
  socket.on('playerMovement', (playerMovement) => {
    // Update player movements in the game state
    const player = gameState.players[socket.id];
    if (!player) return; // Player not found, ignore the movement update

    // Send the movement updates to a map, since we need to make sure sending movements faster doesn't
    // make the player faster. Check the player.runtime call for a better comment about this
    playerMovements[socket.id] = playerMovement;


    if (player.name == "John" && playerMovements[socket.id]) {
      // Hack for players named John to have aimbot
      const nearestPlayer = Object.values(gameState.players)
        .filter(target => target.id !== socket.id && target.alive) // Ignore players that are not alive
        .sort((a, b) => {
          const distA = Math.sqrt(Math.pow(a.xPos - player.xPos, 2) + Math.pow(a.yPos - player.yPos, 2));
          const distB = Math.sqrt(Math.pow(b.xPos - player.xPos, 2) + Math.pow(b.yPos - player.yPos, 2));
          return distA - distB;
        })[0];

      // Calculate the direction to the nearest player and set the view direction to face them
      if (nearestPlayer) { 
        const direction = { x: nearestPlayer.xPos - player.xPos, y: nearestPlayer.yPos - player.yPos };
        const magnitude = Math.sqrt(Math.pow(direction.x, 2) + Math.pow(direction.y, 2));
        direction.x /= magnitude; direction.y /= magnitude;
        playerMovements[socket.id].viewDirection = direction;
      }
    }
  });

  // Event handler for when a player disconnects
  socket.on("disconnect", () => {
    // Remove the disconnected player from the game state
    delete gameState.players[socket.id];
    
    // Notify all connected clients about the removed player
    io.sockets.emit('removePlayer', socket.id);
  });
})


// Emit the gamestate to the clients 60 times / second
setInterval(() => {
  // Add ammo and health pickups
  if (gameState.pickups.length < 5) {
    if (Math.random() > 0.5) {
      gameState.pickups.push(new Health(1, 20, 20, Math.random()*2110, Math.random()*2110));
    } else {
      gameState.pickups.push(new Ammo(1, 20, 20, Math.random()*2110, Math.random()*2110));
    }
  }

  // Get the gamestate map (id -> player object) and do the runtime for the player this game tick
  for (const playerID in gameState.players) {
    const player = gameState.players[playerID];
    const playerMovement = playerMovements[playerID];

    // Simplify the game state to only include the necessary information
    const simplifiedGameState = {
      players: {
        // Map the player objects to the simplified player objects
        ...Object.fromEntries(Object.entries(gameState.players).map(([id, player]) => [id, {
          width: player.width,
          height: player.height,
          xPos: player.xPos,
          yPos: player.yPos,
          name: player.name,
          id: player.id,
          alive: player.alive,
          hideName: player.hideName,
          viewDir: player.viewDir,
          inventory: player.inventory,
          selectedSlot: player.selectedSlot,
          health: player.health,
          shield: player.shield
        }]))
      },
      blocks: gameState.blocks,
      trees: gameState.trees,
      bullets: gameState.bullets,
      pickups: gameState.pickups
    };

    // The movements are accessed here so that sending movements faster doesn't make the player faster,
    // since the movements are dependent on the game tick, and not when the movement packet is recived
    player.runtime(playerMovement, simplifiedGameState);
  }

  // Loop through the bullets in a unconventional way, since we also remove them as we go
  gameState.bullets = gameState.bullets.filter(bullet => {
    bullet.runtime(gameState);
  
    // Keep bullets that do not meet the condition (shouldDelete), remove the ones that do
    return !(bullet.shouldDelete);
  });

  // Send the state to each client
  io.sockets.emit('state', gameState);
}, 1000 / 60);

// Start the server on port 4000
http.listen(4000, () => {
  console.log('listening on *:4000');
});