import 'phaser';

// TODO


// 4- Once done, finish reversal, undo sensor, and undo static
// 5- Every time a rock stabilizes (still for X frames?), clear the positions array

class Game extends Phaser.Scene {
    constructor(config) {
    	super('Game');

    	this.pCounter = 0;
        this.isReversing = false;
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
    		'R' : this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
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
            var prev = pts[Phaser.Math.Wrap(i-1, 0, pts.length)];
            var next = pts[Phaser.Math.Wrap(i+1, 0, pts.length)];
            var center_x = Phaser.Math.Linear(prev.x, next.x, 0.5);
            var center_y = Phaser.Math.Linear(prev.y, next.y, 0.5);
            pts[i].x = Phaser.Math.Linear(pts[i].x, center_x, relax);
            pts[i].y = Phaser.Math.Linear(pts[i].y, center_y, relax);
        }
    }

    createPolyFromVerts(_x, _y, vert_string) {
        var poly = this.add.polygon(_x, _y, vert_string, 0x0000ff, 0.2);
        return this.matter.add.gameObject(poly, { shape: { type: 'fromVerts', verts: vert_string, flagInternal: true } });
    }

    createRock(rock_x, rock_y) {
        var arrow = '40 0 40 20 100 20 100 80 40 80 40 100 0 50';
        var min_r = 50;
        var max_r = 150;
        var r = Phaser.Math.Between(min_r, max_r);

        //generate a random enclosed shape
        var pts = [];
        var pts_max = 20+Phaser.Math.CeilTo(r/5);
        for (let i=0; i<pts_max; i++) {
            var angle = 2*Math.PI * (i/pts_max);
            if (Math.random() < 0.5)
                r = Phaser.Math.Clamp(r + Phaser.Math.Between(-50, 50), min_r, max_r);
            var v = {
                x: r*Math.cos(angle),
                y: r*Math.sin(angle)
            }
            pts.push(v);
        }

        //flatten a side of the shape (make vertices colinear)
        if (r > 80) {
            var count = Phaser.Math.Between(pts_max/8, pts_max/2);
            var start = Phaser.Math.Between(0, pts.length-1);
            var p_start = pts[start];
            var p_end = pts[Phaser.Math.Wrap(start+count, 0, pts.length)];
            for (let i=0; i<count; i++) {
                let j = Phaser.Math.Wrap(start+i, 0, pts.length);
                pts[j].x = Phaser.Math.Linear(p_start.x, p_end.x, i/count) + Phaser.Math.FloatBetween(-5.0, 5.0);
                pts[j].y = Phaser.Math.Linear(p_start.y, p_end.y, i/count) + Phaser.Math.FloatBetween(-5.0, 5.0);;
            }
        }

        //smooth shape
        var passes = Phaser.Math.Between(2, 6);
        for (var i=0; i<passes; i++) {this.smoothVerts(pts);}

        //warp shape
        var xscale = Phaser.Math.FloatBetween(1, Math.random() < 0.8 ? Phaser.Math.FloatBetween(0.2, 0.5) : 1);
        var yscale = Phaser.Math.FloatBetween(1, Math.random() < 0.3 ? Phaser.Math.FloatBetween(1.0, 1.6) : 1);
        this.matter.verts.scale(pts, xscale, yscale);

        var C = this.matter.verts.centre(pts);

        //create rock
        var shape_str = '';
        for (let i=0; i<pts.length; i++) {
            shape_str += pts[i].x + ' ' + pts[i].y + ' ';
        }
        var rock = this.createPolyFromVerts(rock_x, rock_y, shape_str);

        //set rock physics properties
        rock.setDensity(.00001);
        rock.setFriction(1, .01, 1); //(overall, air, static)
        rock.setBounce(0);
        rock.inertia_static = rock.body.inertia*10;
        rock.inertia_dynamic = rock.body.inertia;

        //set rock tiled image (help from https://goo.gl/VC8dK2)
        var tex = this.add.tileSprite(0, 0, 3*max_r, 3*max_r, 'stone-tile');
        var mask_shape = this.make.graphics();

        mask_shape.fillStyle(0xffffff);
        mask_shape.beginPath();
        var geom_pts = [];
        for (let i=0; i<pts.length; i++) {
            geom_pts.push(new Phaser.Geom.Point(pts[i].x - C.x, pts[i].y - C.y));
        }
        mask_shape.fillPoints(geom_pts, true);

        var mask = mask_shape.createGeometryMask();
        tex.setMask(mask);
        rock.tex = tex;
        rock.mask_shape = mask_shape;

        //save reference to object
        rock.uniqueID = rock.body.id;
        this.rocksArray.push(rock);
        this.rocksKeys[rock.uniqueID] = rock;

        // Initialize array to keep track of positions 
        rock.positions = [];
        rock.pastX = rock.x; 
        rock.pastY = rock.y;
        rock.pastAngle = rock.angle;
        rock.stableFrames = 0;

        return rock;
    }

    create() {    	
    	this.particles = [];
    	this.particleKeys = {};
        this.rocksArray = [];
        this.rocksKeys = {};
    	this.initKeys();

        var game_w = this.game.config.width;
    	var game_h = this.game.config.height;

        this.matter.world.setBounds();
        var floor = this.matter.add.rectangle(0.5*game_w, game_h-15, game_w, 30, {isStatic: true});
        floor.friction = .9;

    	for (var i = 0; i < 5; i++) {
            var _x = Phaser.Math.Between(200, game_w-200);
            var _y = Phaser.Math.Between(100, game_h-300);
            this.createRock(_x, _y);
        }

        this.matter.add.mouseSpring({
            angularStiffness: 0.7
        });
    }

    update() {
    	this.debugUpdate();
        
        if (Phaser.Input.Keyboard.JustDown(this.keys.R) && !this.isReversing) { 
            this.isReversing = true;
            // Disable collision (set sensor) and set all rocks to static 
            for(let rock of this.rocksArray) {
                rock.body.collisionFilter.group = -1;
                rock.setStatic(true);
            }
        }

        let allDoneReversing = true;

        for (let i=0; i<this.rocksArray.length; i++) {
            var r = this.rocksArray[i];
            r.mask_shape.x = r.tex.x = r.x;
            r.mask_shape.y = r.tex.y = r.y;
            r.mask_shape.angle = r.tex.angle = r.angle;

            var speed_threshold = 0.5;
            if (r.body.speed < speed_threshold && r.stableFrames > 4) {
                r.body.inertia = r.inertia_static;
            } else {
                r.body.inertia = r.inertia_dynamic;
            }
            r.body.inverseInertia = 1/r.body.inertia;

            if (this.isReversing) {
                // Rewind back as long as there is something to rewind 
                if (r.positions.length != 0) {
                    allDoneReversing = false;
                    let pos = r.positions.pop();
                    r.x = pos.x; 
                    r.y = pos.y; 
                    r.angle = pos.angle;
                }
                continue;
            }

            let dx = r.x - r.pastX; 
            let dy = r.y - r.pastY;
            let dAngle = r.angle - r.pastAngle;
            let thresholdXY = 5;
            let thresholdAngle = 0.5;
            let stableFramesNeeded = 30;

            if(Math.abs(dx) > thresholdXY || Math.abs(dy) > thresholdXY || Math.abs(dAngle) > thresholdAngle) {
                // Record position
                r.pastX = r.x; 
                r.pastY = r.y;
                r.pastAngle = r.angle;
                r.positions.push({x:r.x, y:r.y, angle:r.angle});
                r.stableFrames = 0;
            } else {
                r.stableFrames ++;
                if (r.stableFrames > stableFramesNeeded) {
                    r.positions = [];
                }
            }
        }

        if (this.isReversing && allDoneReversing) {
            // Redo collision filters and static 
            for(let rock of this.rocksArray) {
                rock.body.collisionFilter.group = 0;
                rock.setStatic(false);
            }
            this.isReversing = false;
        }
    }
}

// Make it so we can use it from a different file. 
export default Game;