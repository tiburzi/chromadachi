import 'phaser';
import Loading from './scenes/Loading';
import MainMenu from './scenes/MainMenu';
import Game from './scenes/Game';

var game = new Phaser.Game({
    type: Phaser.AUTO, // Choose WebGL or Canvas automatically
    parent: 'game', // The ID of the div in index.html
    scene: [Loading, MainMenu, Game],
    backgroundColor: '#051020',
    physics: {
        default: 'arcade'
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%'
    }
});

