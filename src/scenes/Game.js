import 'phaser';

class Game extends Phaser.Scene {
    constructor(config) {
    	super('Game');

    	this.pCounter = 0;
    }

    debugUpdate() {
    	// For toggling the debug physics view and anything else 
    	if (Phaser.Input.Keyboard.JustDown(this.keys.spacebar)) {
    		this.matter.world.drawDebug = !this.matter.world.drawDebug;
    		this.matter.world.debugGraphic.clear();
    	}
    }

    initKeys() {
    	this.keys  = {
    		'spacebar' : this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    		'B' : this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B)
    	}
	}

    preload() {
    	
    }

    createParticle(x,y, scale) {
    	let p = this.matter.add.image(x,y, 'snow', null, 
    		{shape: {
    			type: 'polygon',
    			radius: 15,
    			sides: 6
    		}})
    	//let p = this.matter.add.image(x,y, 'snow')

    	//p.setCircle(12);
    	p.setScale(scale);
    	p.setOrigin(0.5);
    	p.setFriction(0.6);
        p.setFrictionAir(0.05);
    	p.setBlendMode('ADD');
    	p.uniqueID = this.pCounter++;
    	p.joints = {}

    	this.particles.push(p);
    	this.particleKeys[p.uniqueID] = p;

    	return p;
    }

    makeLevel(img, level_scale, level_w, level_h) {
        // Try to read image data to create level
		let tracer = new ImageTracer();
		let shapes = tracer.traceImage(img, level_scale);
        
        // Convert shape vertex x/y to a string for Matterjs 
		let stringShapes = [];

		for(let shape of shapes){
			let newString = '';
			for(let point of shape){
				newString += point.x + " " + point.y + " "
			}
			stringShapes.push(newString)
		}
        
        var vertArray = [];
        for(let s of stringShapes) {
            let verts = this.matter.verts.fromPath(s);
            vertArray.push(verts);
        }
    	let collision = this.matter.add.fromVertices(level_w/2 - 424, level_h/2 - 27, vertArray, { isStatic: true }, true);

        // Tile stone texture across level, masking using the traced image (help from https://goo.gl/VC8dK2)
        var ground = this.add.tileSprite(level_w/2, level_h/2, level_w, level_h, 'stone-tile');
        
        var mask_shape = this.make.graphics();
        mask_shape.fillStyle(0xffffff);
        mask_shape.beginPath();
        for(let shape of shapes) {
            var pts = [];
            for (let p of shape) {
                pts.push(new Phaser.Geom.Point(p.x, p.y));
            }
            mask_shape.fillPoints(pts, true);
        }
        var mask = mask_shape.createGeometryMask();

        ground.setMask(mask);
    }

    createPolyFromVerts(_x, _y, vert_string) {
        var poly = this.add.polygon(_x, _y, vert_string, 0x0000ff, 0.2);
        this.matter.add.gameObject(poly, { shape: { type: 'fromVerts', verts: vert_string, flagInternal: true } });
    }

    addRandomShape() {
        var x = Phaser.Math.Between(100, 700);
        var y = Phaser.Math.Between(100, 500);

        /*if (Math.random() < 0.7)
        {
            var sides = Phaser.Math.Between(3, 14);
            var radius = Phaser.Math.Between(8, 50);

            this.matter.add.polygon(x, y, sides, radius, { restitution: 0.5 });
        }
        else
        {
            var width = Phaser.Math.Between(16, 128);
            var height = Phaser.Math.Between(8, 64);

            this.matter.add.rectangle(x, y, width, height, { restitution: 0.5 });
        }*/

        var arrow = '40 0 40 20 100 20 100 80 40 80 40 100 0 50';
        var min_r = 50;
        var max_r = 150;

        var shape_str = '';
        var pts = [];
        var pts_max = 30;
        var dis = Phaser.Math.Between(min_r, max_r);
        for (var i=0; i<pts_max; i++) {
            var angle = 2*Math.PI * (i/pts_max);
            if (Math.random() < 0.5)
                dis = Phaser.Math.Clamp(dis + Phaser.Math.Between(-50, 50), min_r, max_r);
            var v = {
                x: dis*Math.cos(angle),
                y: dis*Math.sin(angle)
            }
            pts.push(v);

            shape_str += v.x + ' ' + v.y + ' ';
        }
        this.createPolyFromVerts(300, 400, shape_str);

        //smooth shape
        function smoothVerts(pts) {
            var relax = 0.5;
            for (var i=0; i<pts.length; i++) {
                var j = Phaser.Math.Wrap(i+1, 0, pts.length);
                pts[i].x = Phaser.Math.Linear(pts[i].x, pts[j].x, relax);
                pts[i].y = Phaser.Math.Linear(pts[i].y, pts[j].y, relax);
            }
        }

        //create smoothed shape as physics body
        var shape_smooth_str = '';
        for (var i=0; i<3; i++) {smoothVerts(pts);}

        this.matter.verts.scale(pts, 0.25+0.5*Math.random(), 1);

        for (var i=0; i<pts.length; i++) {
            shape_smooth_str += pts[i].x + ' ' + pts[i].y + ' ';
        }
        this.createPolyFromVerts(600, 400, shape_smooth_str);

    }

    create() {    	
    	this.particles = [];
    	this.particleKeys = {};
    	this.initKeys();

        var game_w = this.game.config.width;
    	var game_h = this.game.config.height;

        this.matter.world.setBounds();

    	for (var i = 0; i < 1; i++) {
            this.addRandomShape();
        }

        this.matter.add.mouseSpring();
    }

    update() {
    	this.debugUpdate();
    }
}

// Make it so we can use it from a different file. 
export default Game;