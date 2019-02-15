import 'phaser';

// TODO
// 1. Make game.

class Game extends Phaser.Scene {
    constructor(config) {
    	super('Game');
    }

    create() {    	
    	this.bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'rain').setOrigin(0);
        this.logo = this.add.sprite(this.scale.width / 2, this.scale.height / 2, 'logo');

        this.scale.on('resize', this.resize, this);
    }

    update() {
    	
    }

    resize (gameSize, baseSize, displaySize, resolution)
    {
        var width = gameSize.width;
        var height = gameSize.height;

        this.cameras.resize(width, height);

        this.bg.setSize(width, height);
        this.logo.setPosition(width / 2, height / 2);
    }
}

// Make it so we can use it from a different file. 
export default Game;