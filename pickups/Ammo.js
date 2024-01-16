class Ammo {
    constructor(id, width, height, xPos = 0, yPos = 0) {
        this.id = id;

        this.height = height;
        this.width = width;

        this.xPos = xPos;
        this.yPos = yPos;

        this.type = "ammo"
        this.health = 0;
        this.ammo = 50;
    };
}

module.exports = Ammo;