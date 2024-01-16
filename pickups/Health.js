class Health {
    constructor(id, width, height, xPos = 0, yPos = 0) {
        this.id = id;

        this.height = height;
        this.width = width;

        this.xPos = xPos;
        this.yPos = yPos;

        this.type = "health"
        this.health = 50;
        this.ammo = 0;
    };
}

module.exports = Health;