import 'phaser';


class MainMenu extends Phaser.Scene {
    constructor(config) {
    	super('MainMenu');
    }

    preload() {

    }

    create() {
    	console.log("MainMenu!");
    }
}

// Make it so we can use it from a different file. 
export default MainMenu;