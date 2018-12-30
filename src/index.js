import 'phaser';
import Loading from './scenes/Loading';
import MainMenu from './scenes/MainMenu';
import Game from './scenes/Game';

var game = new Phaser.Game({
    type: Phaser.AUTO, // Choose WebGL or Canvas automatically
    parent: 'game', // The ID of the div in index.html
    width: 1280,
    height: 720,
    scene: [Loading, MainMenu, Game],
    physics: {
        default: 'matter',
        matter: {
            gravity: {
                x: 0,
                y: 5
            },
            debug: true
        }
    }
});

