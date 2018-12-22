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

    addRandomShape() {
        /*var x = Phaser.Math.Between(100, 700);
        var y = Phaser.Math.Between(100, 500);

        //create random shapes
        if (Math.random() < 0.7)
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
    }

    smoothVerts(pts) {
        var relax = 0.5;
        for (let i=0; i<pts.length; i++) {
            var j = Phaser.Math.Wrap(i+1, 0, pts.length);
            pts[i].x = Phaser.Math.Linear(pts[i].x, pts[j].x, relax);
            pts[i].y = Phaser.Math.Linear(pts[i].y, pts[j].y, relax);
        }
    }

    createPolyFromVerts(_x, _y, vert_string) {
        var poly = this.add.polygon(_x, _y, vert_string, 0x0000ff, 0.2, { restitution: 0.1 });
        return this.matter.add.gameObject(poly, { shape: { type: 'fromVerts', verts: vert_string, flagInternal: true } });
    }

    createRock(rock_x, rock_y) {
        var arrow = '40 0 40 20 100 20 100 80 40 80 40 100 0 50';
        var min_r = 80;
        var max_r = 150;

        //generate a random enclosed shape
        var pts = [];
        var pts_max = 30;
        var dis = Phaser.Math.Between(min_r, max_r);
        for (let i=0; i<pts_max; i++) {
            var angle = 2*Math.PI * (i/pts_max);
            if (Math.random() < 0.5)
                dis = Phaser.Math.Clamp(dis + Phaser.Math.Between(-50, 50), min_r, max_r);
            var v = {
                x: dis*Math.cos(angle),
                y: dis*Math.sin(angle)
            }
            pts.push(v);
        }

        //flatten a side of the shape (make vertices colinear)
        var count = Phaser.Math.Between(5, 15);
        var start = Phaser.Math.Between(0, pts.length-1);
        var p_start = pts[start];
        var p_end = pts[Phaser.Math.Wrap(start+count, 0, pts.length)];
        for (let i=0; i<count; i++) {
            let j = Phaser.Math.Wrap(start+i, 0, pts.length);
            pts[j].x = Phaser.Math.Linear(p_start.x, p_end.x, i/count) + Phaser.Math.FloatBetween(-5.0, 5.0);
            pts[j].y = Phaser.Math.Linear(p_start.y, p_end.y, i/count) + Phaser.Math.FloatBetween(-5.0, 5.0);;
        }

        //smooth shape
        var passes = Phaser.Math.Between(2, 5);
        for (var i=0; i<passes; i++) {this.smoothVerts(pts);}

        //warp shape
        var xscale = Phaser.Math.FloatBetween(1, Math.random() < 0.8 ? Phaser.Math.FloatBetween(0.2, 0.6) : 1);
        var yscale = Phaser.Math.FloatBetween(1, Math.random() < 0.3 ? Phaser.Math.FloatBetween(1.0, 1.6) : 1);
        this.matter.verts.scale(pts, xscale, yscale);

        //create rock
        var shape_str = '';
        for (let i=0; i<pts.length; i++) {
            shape_str += pts[i].x + ' ' + pts[i].y + ' ';
        }
        var rock = this.createPolyFromVerts(rock_x, rock_y, shape_str);

        //rock.setDensity(10);
        rock.setFriction(.8);

    }

    create() {    	
    	this.particles = [];
    	this.particleKeys = {};
    	this.initKeys();

        var game_w = this.game.config.width;
    	var game_h = this.game.config.height;

        this.matter.world.setBounds();

    	for (var i = 0; i < 5; i++) {
            var _x = Phaser.Math.Between(200, game_w-200);
            var _y = Phaser.Math.Between(100, game_h-300);
            this.createRock(_x, _y);
        }

        this.matter.add.mouseSpring();
    }

    update() {
    	this.debugUpdate();
    }
}

// Make it so we can use it from a different file. 
export default Game;