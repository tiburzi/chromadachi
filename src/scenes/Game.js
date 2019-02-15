import 'phaser';

// TODO
// 1. Make game.

class Game extends Phaser.Scene {
    constructor(config) {
    	super('Game');

        this.objCounter = 0;
    }

    addCell(_x, _y) {
        //let c = this.add.sprite(_x, _y, 'cell');
        let c = this.physics.add.image(_x, _y, 'cell');
        c.setData('emotion', 'happy');

        c.uniqueID = this.objCounter++;
        this.cells.push(c);
        this.cellsKeys[c.uniqueID] = c;
        return c;
    }

    create() {    	
    	//make game resize with window
        this.scale.on('resize', this.resize, this);

        this.physics.world.setBoundsCollision(true);
        this.bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'grid').setOrigin(0);

        //populate shtuff
        this.cells = [];
        this.cellsKeys = [];

        for(let i=0; i<5; i++) {
            let c = this.addCell(0, 0);
            c.setRandomPosition();
            c.setVelocity(Util.irandomRange(-100,100), Util.irandomRange(-100,100));
            c.setCollideWorldBounds(true);
            c.setBounce(1);
        }

        var group = this.physics.add.group(this.cells, {
        });

        this.physics.add.collider(group, group);
        }

    updateCells() {
        this.cells.forEach(function(c) {

        });
    }

    update() {
    	//updateCells();
    }

    resize (gameSize, baseSize, displaySize, resolution)
    {
        let w = gameSize.width;
        let h = gameSize.height;

        this.cameras.resize(w, h);
        this.bg.setSize(w, h);

        //smoosh cells together!
        this.cells.forEach(function(c) {
            c.setPosition(Math.min(c.x, w), Math.min(c.y, h));
        });
    }
}

// Make it so we can use it from a different file. 
export default Game;