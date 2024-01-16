const Bullet = require('./Bullet');
const Gun = require('./Gun');

class Shotgun extends Gun {
    constructor(pelletCount, pelletSpread, damage) {
        // Custom properties for Shotgun
        super(2000, 100, 15, damage, 5, 6, 4, 70, 'shotgun');

        this.pelletCount = pelletCount;
        this.pelletSpread = pelletSpread;

        this.name = 'Frenzy Shotgun';
    }

    offsetVector(originalVector, offsetDegrees) {
        // Convert degrees to radians
        const randomOffset = (Math.PI / 180) * offsetDegrees;

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

        for (let i = 0; i < this.pelletCount; i++) {
            const offsetVector = this.offsetVector(player.viewDir, (i-(this.pelletCount/2))*this.pelletSpread);
            gameState.bullets.push(new Bullet(shootPoint, offsetVector, player, this.bulletSpeed, this.range, this.damage));
        }
    }   
}

module.exports = Shotgun;