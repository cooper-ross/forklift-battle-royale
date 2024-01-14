class Tree {
    constructor(id, trunkRadius, foliageRadius, xPos = 0, yPos = 0) {
        this.id = id;

        this.foliageRadius = foliageRadius;

        this.width = trunkRadius;
        this.height = trunkRadius;

        this.xPos = xPos;
        this.yPos = yPos;

        this.health = 100;
    }

    getHit(bullet, gameState) {
        // Reduce the tree's health by the bullet's damage  
        this.health -= bullet.damage;

        // Same deal as blocks, but with trees now
        if (this.health <= 0) {
            gameState.trees = gameState.trees.filter(tree => tree.id !== this.id);
        }
    };
}

module.exports = Tree;