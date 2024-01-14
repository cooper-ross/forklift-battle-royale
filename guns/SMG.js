const Bullet = require('./Bullet');
const Gun = require('./Gun');

class SMG extends Gun {
    constructor(spreadAngle, fireRate, damage) {
        super(fireRate, 60, 30, damage, 5, 0.2, 30, 50, 'smg');
        this.spreadAngle = spreadAngle;

        this.name = 'Bullseye SMG';
    }

    randomOffsetVector(originalVector, maxOffsetDegrees) {
        // Convert degrees to radians
        const randomOffset = (Math.PI / 180) * (Math.random() * maxOffsetDegrees - maxOffsetDegrees/2);

        // Calculate new direction
        const offsetX = originalVector.x * Math.cos(randomOffset) - originalVector.y * Math.sin(randomOffset);
        const offsetY = originalVector.x * Math.sin(randomOffset) + originalVector.y * Math.cos(randomOffset);
        
        // Return the new rotated vector
        return { x: offsetX, y: offsetY };
    }
    
    fire(player, gameState) {
        // Fire rate
        if (Date.now() - this.timeOfLastShot < this.fireRate || this.currentAmmo <= 0) return;
        this.timeOfLastShot = Date.now();

        // Recoil
        player.applyForce({ x: -this.recoil * player.viewDir.x, y: -this.recoil * player.viewDir.y });

        // Shoot from the tip of the barrel
        const shootPoint = {
            x: (player.xPos + player.width/2) + player.viewDir.x * this.tipOffset - 5,
            y: (player.yPos + player.width/2) + player.viewDir.y * this.tipOffset - 5
        }

        // Reduce ammo count
        this.reloadCounter = 0;
        this.currentAmmo--;
        
        // Create the bullets with our gun specifications
        const offsetVector = this.randomOffsetVector(player.viewDir, this.spreadAngle);
        gameState.bullets.push(new Bullet(shootPoint, offsetVector, player, this.bulletSpeed, this.range, this.damage));
    }   
}

module.exports = SMG;