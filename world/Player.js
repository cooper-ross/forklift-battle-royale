class Player {
    constructor(name, xPos = 0, yPos = 0, id) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.setPosition();

        this.xSpeed = 0;
        this.ySpeed = 0;

        this.height = 48;
        this.width = 48;

        this.viewDir = { x: 0, y: 0 };

        this.shield = 0;
        this.health = 100;

        this.alive = true;
        this.wasJustHit = false;

        this.gunOffset = 50;

        this.heldGun = undefined;

        this.inventory = [];
        this.selectedSlot = 0;

        this.name = name;
        this.hideName = false;
        this.id = id;
        this.controllable = true;

        this.timeLastHit = Date.now();
        this.regenShieldDelay = 5000;
    }

    setPosition(posX = this.xPos, posY = this.yPos) {
        this.xPos = posX;
        this.yPos = posY;
    }

    detectCollision(obj1, obj2) {
        // Get the sides of each object
        var left1 = obj1.xPos;
        var right1 = obj1.xPos + obj1.width;
        var top1 = obj1.yPos;
        var bottom1 = obj1.yPos + obj1.height;

        var left2 = obj2.xPos;
        var right2 = obj2.xPos + obj2.width;
        var top2 = obj2.yPos;
        var bottom2 = obj2.yPos + obj2.height;

        // Check for collision
        if (bottom1 < top2 || top1 > bottom2 || right1 < left2 || left1 > right2) {
            return false; // No collision
        } else {
            // Determine the direction of the collision
            var dx = (obj1.xPos + obj1.width / 2) - (obj2.xPos + obj2.width / 2);
            var dy = (obj1.yPos + obj1.height / 2) - (obj2.yPos + obj2.height / 2);

            var width = (obj1.width + obj2.width) / 2;
            var height = (obj1.height + obj2.height) / 2;

            var crossWidth = width * dy;
            var crossHeight = height * dx;

            var collisionDirection = '';

            if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
                if (crossWidth > crossHeight) {
                    collisionDirection = (crossWidth > (-crossHeight)) ? 'bottom' : 'left';
                } else {
                    collisionDirection = (crossWidth > -(crossHeight)) ? 'right' : 'top';
                }
            }

            return collisionDirection;
        }
    }

    handleCollisions(collisons, block) {
        switch (true) {
            case collisons.includes("left"):
                var amountOverlap = (this.xPos + this.width) - block.xPos;
                if (amountOverlap > 0) this.xPos -= amountOverlap;
                break;
            case collisons.includes("right"):
                amountOverlap = this.xPos - (block.xPos + block.width);
                if (amountOverlap < 0) this.xPos -= amountOverlap;
                break;
            case collisons.includes("top"):
                amountOverlap = (this.yPos + this.height) - block.yPos;
                if (amountOverlap > 0) this.yPos -= amountOverlap;
                break;
            case collisons.includes("bottom"):
                amountOverlap = this.yPos - (block.yPos + block.height);
                if (amountOverlap < 0) this.yPos -= amountOverlap;
                break;
        }
    }

    applyForce(forceVector) {
        this.xSpeed += forceVector.x;
        this.ySpeed += forceVector.y;
    }

    getHit(bullet) {
        this.whiteFrames = 3;
        this.wasJustHit = true;

        // Calculate damage to shield and health
        const shieldDamage = Math.min(this.shield, bullet.damage);
        const healthDamage = Math.max(0, bullet.damage - shieldDamage);
        this.shield -= shieldDamage;
        this.health -= healthDamage;

        // Keep track of when the player was last hit so we can regen shield
        this.timeLastHit = Date.now();
    }

    slow() {
        this.xSpeed *= 0.5;
        this.ySpeed *= 0.5; 
    }

    // Runtime function to handle player movement and collision detection
    runtime(movement, gameState) {
        // Death check
        if (this.health <= 0) {
            this.alive = false;
        }

        if (this.alive) { 
            this.aliveRuntime(movement, gameState)
        } else {
            movement.shoot = false;
        }

        // Handle player movement
        if (movement) {
            this.viewDir = movement.viewDirection;
            this.xSpeed += (movement.left ? -2 : 0) + (movement.right ? 2 : 0);
            this.ySpeed += (movement.up ? -2 : 0) + (movement.down ? 2 : 0);
        }

        // Limit player position within boundaries
        this.xPos = Math.max(0, Math.min(2140, this.xPos));
        this.yPos = Math.max(0, Math.min(2140, this.yPos));

        // Apply friction to player speed
        this.xSpeed *= 0.8;
        this.ySpeed *= 0.8;

        // Update player position
        this.setPosition(this.xPos + this.xSpeed, this.yPos + this.ySpeed);
    }

    aliveRuntime(movement, gameState) {
        // Update white frames
        if (this.whiteFrames > 0) {
            this.whiteFrames--;
        } else {
            this.wasJustHit = false;
        }

        // Regenerate shield if enough time has passed since last hit
        if (this.timeLastHit + this.regenShieldDelay < Date.now() && this.shield < 100) {
            this.shield += 0.05;
        }

        // Handle collisions with blocks
        // Beleive it or not, this actually works better than matter.js or other physics engines, at least in terms of runtime speed
        // Can't say much for "realistic" physics though
        gameState.blocks.forEach(block => {
            const collisions = this.detectCollision(this, block);
            if (collisions) {
                this.handleCollisions(collisions, block);
            }
        });

        // Ingore the janky hide name system, I'm too lazy to fix it
        this.hideName = false;
        gameState.trees.forEach(tree => {
            const distanceToTree = Math.hypot(this.xPos - tree.xPos, this.yPos - tree.yPos);
            const collisions = this.detectCollision(this, tree);
            if (collisions) {
                this.handleCollisions(collisions, tree);
            }

            if (distanceToTree < tree.foliageRadius + this.width / 2) {
                this.hideName = true;
            }
        });

        if (movement) {
            this.selectedSlot = movement.selectedSlot;

            if (this.selectedSlot > this.inventory.length - 1 || this.selectedSlot < 0) return;
            const heldGun = this.inventory[this.selectedSlot];

            if (movement.reload) {
                heldGun.reload();
                if (heldGun.reloadCounter != 0) this.slow();
            } else {
                heldGun.update();
            }

            if (movement.shoot) {
                heldGun.fire(this, gameState);
            }
        }
    }
};

module.exports = Player;