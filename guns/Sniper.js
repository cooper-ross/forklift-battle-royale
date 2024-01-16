const Gun = require('./Gun');

class Sniper extends Gun {
    constructor() {
        super(550, 205, 60, 75, 100, 2, 1, 50, 'pistol');        
        this.name = 'Sniper';
    }
}

module.exports = Sniper;