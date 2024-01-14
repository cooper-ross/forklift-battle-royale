const Bullet = require('./Bullet');

class Gun {
    constructor(fireRate, reloadTime, bulletSpeed, damage, range, recoil, magSize, tipOffset, texture) {
        // Basic stuff
        this.fireRate = fireRate;
        this.reloadTime = reloadTime;
        this.reloadCounter = 0;

        // Bullet type
        this.bulletSpeed = bulletSpeed;
        this.damage = damage;
        this.range = range;
        this.recoil = recoil;

        // Ammo handling
        this.currentAmmo = magSize;
        this.magSize = magSize;
        this.totalAmmo = magSize * 3;
        this.timeOfLastShot = 0;

        // Visual
        this.tipOffset = tipOffset;
        this.texture = texture;
        this.name = 'Gun';
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
        gameState.bullets.push(new Bullet(shootPoint, player.viewDir, player, this.bulletSpeed, this.range, this.damage));
    }

    reload() {
        if (this.totalAmmo <= 0 || this.currentAmmo === this.magSize) return;

        this.reloadCounter++;
        if (this.reloadCounter >= this.reloadTime) {
            const ammoNeededForFullMag = this.magSize - this.currentAmmo;

            if (this.totalAmmo >= ammoNeededForFullMag) {
                this.totalAmmo -= ammoNeededForFullMag;
                this.currentAmmo = this.magSize;
            } else {
                this.currentAmmo += this.totalAmmo;
                this.totalAmmo = 0;
            }

            this.reloadCounter = 0;
        }
    }

    update() {
        this.reloadCounter = 0;
    }
}

module.exports = Gun;