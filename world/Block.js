class Block {
    constructor(id, width, height, xPos = 0, yPos = 0) {
        this.id = id;

        this.height = height;
        this.width = width;

        this.xPos = xPos;
        this.yPos = yPos;

        this.health = 100;
    };

    getHit(bullet, gameState) {
        // Reduce the block's health by the bullet's damage
        this.health -= bullet.damage;

        // If the block is destroyed, remove it from the game in this fancy way
        if (this.health <= 0) {
            gameState.blocks = gameState.blocks.filter(block => block.id !== this.id);
        }
    };
}

module.exports = Block;