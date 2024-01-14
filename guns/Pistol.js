const Gun = require('./Gun');

class Pistol extends Gun {
    constructor() {
        super(250, 25, 40, 10, 20, 0.1, 20, 50, 'pistol');        
        this.name = 'Reaper Pistol';
    }
}

module.exports = Pistol;