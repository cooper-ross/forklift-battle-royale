class Bullet {
    constructor(startPosition, viewDirection, owner, speed = 15, maxTravelDistance = 20, damage = 1) {
        this.xSpeed = viewDirection.x * speed;
        this.ySpeed = viewDirection.y * speed;
        this.startPosition = startPosition;

        // Move the bullet back a bit so it doesn't phase through blocks
        this.xPos = startPosition.x - this.xSpeed;
        this.yPos = startPosition.y - this.ySpeed;

        this.owner = owner;
        this.damage = damage;

        this.height = 10;
        this.width = 10;

        this.maxTravelDistance = maxTravelDistance * 50; // 50 is "block" size
        this.distanceTraveled = 0;

        this.isStopped = false;
        this.deleteCounter = 100;
        this.shouldDelete = false;

        this.setPosition();
    }

    setPosition(posX = this.xPos, posY = this.yPos) {
        this.xPos = posX;
        this.yPos = posY;
    }
 
    // swept AABB (Axis-Aligned Bounding Box) style collison detection
    detectCollision(obj1, obj2) {
        // Calculate the velocity of the moving object (assuming constant velocity)
        var vx = obj1.xSpeed;
        var vy = obj1.ySpeed;
    
        // Get the sides of each object at the start and end of the trajectory
        var left1 = obj1.xPos;
        var right1 = obj1.xPos + obj1.width;
        var top1 = obj1.yPos;
        var bottom1 = obj1.yPos + obj1.height;
    
        var left2 = obj2.xPos;
        var right2 = obj2.xPos + obj2.width;
        var top2 = obj2.yPos;
        var bottom2 = obj2.yPos + obj2.height;
    
        // Check for collision along the trajectory
        if (
            right1 + vx > left2 &&
            left1 + vx < right2 &&
            bottom1 + vy > top2 &&
            top1 + vy < bottom2
        ) {
            return true;
        }
    
        return false; // No collision
    }

    runtime(gameState) {
        gameState.blocks.forEach(block => {
            const collisons = this.detectCollision(this, block);
            if (collisons) {
                this.distanceTraveled = this.maxTravelDistance;
                this.xSpeed *= 0.3;
                this.ySpeed *= 0.3;
            }

            if (collisons && this.deleteCounter === 100) {
                block.getHit(this, gameState);
            }
        })

        gameState.trees.forEach(tree => {
            const collisons = this.detectCollision(this, tree);
            if (collisons) {
                this.distanceTraveled = this.maxTravelDistance-10;
                this.xSpeed *= 0.5;
                this.ySpeed *= 0.5;
            }

            if (collisons && this.deleteCounter === 100) {
                tree.getHit(this, gameState);
            }
        })

        Object.values(gameState.players).forEach(player => {
            if (!player.alive || this.owner.id === player.id) return;
            const collisons = this.detectCollision(this, player);
            if (collisons && this.deleteCounter === 100) {
                this.xSpeed *= 0.3;
                this.ySpeed *= 0.3;
                this.deleteCounter = 10;
                this.isStopped = true;

                player.getHit(this);
            }
        })

        if (this.xPos < 0) {
            this.xPos = 0;
            this.xSpeed *= 0.3;
            this.ySpeed *= 0.3;
            this.distanceTraveled = this.maxTravelDistance;
        }
        if (this.yPos < 0) {
            this.yPos = 0;
            this.xSpeed *= 0.3;
            this.ySpeed *= 0.3;
            this.distanceTraveled = this.maxTravelDistance;
        }
        if (this.yPos > 2200) {
            this.yPos = 2200;
            this.xSpeed *= 0.3;
            this.ySpeed *= 0.3;
            this.distanceTraveled = this.maxTravelDistance;
        }
        if (this.xPos > 2200) {
            this.xPos = 2200;
            this.xSpeed *= 0.3;
            this.ySpeed *= 0.3;
            this.distanceTraveled = this.maxTravelDistance;
        }


        const [initialX, initialY] = [this.xPos, this.yPos];

        // We add tiny inconsistencies with the random numbers just to keep it fresh
        // only if it's still moving, not when stopped
        this.xPos += this.xSpeed + (this.isStopped ? 0 : (Math.random() * 2 - 1));
        this.yPos += this.ySpeed + (this.isStopped ? 0 : (Math.random() * 2 - 1));

        this.distanceTraveled += Math.hypot(this.xPos - initialX, this.yPos - initialY);

        this.setPosition(this.xPos, this.yPos);

        if (this.distanceTraveled >= this.maxTravelDistance) {
            this.xSpeed *= 0.7;
            this.ySpeed *= 0.7;
            this.isStopped = true;
        }

        if (this.isStopped) this.deleteCounter -= 5;
        if (this.deleteCounter < 0) this.shouldDelete = true;

        //detectCollision call goes here
    } 

};

module.exports = Bullet;


