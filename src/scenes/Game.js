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

    smoothVerts(pts, passes, smooth_xdir, smooth_ydir) {
        var relax = 0.6;
        for (var i=0; i<passes; i++) {
            for (let i=0; i<pts.length; i++) {
                var prev = pts[Phaser.Math.Wrap(i-1, 0, pts.length)];
                var next = pts[Phaser.Math.Wrap(i+1, 0, pts.length)];
                var center_x = Phaser.Math.Linear(prev.x, next.x, 0.5);
                var center_y = Phaser.Math.Linear(prev.y, next.y, 0.5);
                if (smooth_xdir) {pts[i].x = Phaser.Math.Linear(pts[i].x, center_x, relax);}
                if (smooth_ydir) {pts[i].y = Phaser.Math.Linear(pts[i].y, center_y, relax);}
            }
        }
    }

    createPolyFromVerts(_x, _y, vert_string) {
        var poly = this.add.polygon(_x, _y, vert_string, 0x0000ff, 0.2);
        var obj = this.matter.add.gameObject(poly, { shape: { type: 'fromVerts', verts: vert_string, flagInternal: true } });
        obj.setPosition(_x, _y);
        return obj;
    }

    addMaskedSpriteTile(obj, sprite, w, h, pts) {
        //set tiled image (help from https://goo.gl/VC8dK2)
        var tex = this.add.tileSprite(0, 0, w, h, sprite);
        var C = this.matter.verts.centre(pts);

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
        obj.tex = tex;
        obj.mask_shape = mask_shape;
    }

    createRock(rock_x, rock_y, rock_size) {
        var min_r = 50;
        var max_r = 150;
        var size = (rock_size === undefined ? Phaser.Math.FloatBetween(0,1) : rock_size);
        var r = Phaser.Math.Linear(min_r, max_r, size);

        //generate a random enclosed shape
        var pts = [];
        var pts_max = 20+Phaser.Math.CeilTo(r/5);
        for (let i=0; i<pts_max; i++) {
            var angle = 2*Math.PI * (i/pts_max);
            if (Math.random() < 0.5)
                r = Phaser.Math.Clamp(r + Phaser.Math.Between(-30, 30), min_r, max_r);
            var v = {
                x: r*Math.cos(angle),
                y: r*Math.sin(angle)
            }
            pts.push(v);
        }

        //give the rock some flat sides (by making batches of vertices colinear)
        if (r > 100) {
            for (let s=0, sides_max = Phaser.Math.Between(0,2); s<sides_max; s++) {
                var count = Phaser.Math.Between(pts_max/8, pts_max/3);
                var start = Phaser.Math.Between(0, pts.length-1);
                var p_start = pts[start];
                var p_end = pts[Phaser.Math.Wrap(start+count, 0, pts.length)];
                for (let i=0; i<count; i++) {
                    let j = Phaser.Math.Wrap(start+i, 0, pts.length);
                    pts[j].x = Phaser.Math.Linear(p_start.x, p_end.x, i/count) + Phaser.Math.FloatBetween(-5.0, 5.0);
                    pts[j].y = Phaser.Math.Linear(p_start.y, p_end.y, i/count) + Phaser.Math.FloatBetween(-5.0, 5.0);;
                }
            }
        }

        //smooth shape
        var passes = Phaser.Math.Between(3, 6);
        this.smoothVerts(pts, passes, true, true);

        //warp shape
        var yscale = Math.random() < 0.7 ? Phaser.Math.FloatBetween(0.2, 0.6) : 1;
        var xscale = Math.random() < 0.3 ? Phaser.Math.FloatBetween(1.0, 1.6) : 1;
        this.matter.verts.scale(pts, xscale, yscale);

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
        rock.inertia_static = rock.body.inertia*1000;
        rock.inertia_dynamic = rock.body.inertia;

        //add masked, tiled sprite to rock
        var sprite = 'stone_tex_'+Phaser.Math.Wrap(this.rocksArray.length, 1, 6).toString();
        this.addMaskedSpriteTile(rock, sprite, 3*max_r, 3*max_r, pts);

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

    createGround() {
        var game_w = this.game.config.width;
        var game_h = this.game.config.height;
        //var ground = this.matter.add.rectangle(0.5*game_w, game_h-15, game_w, 30, {isStatic: true});
        
        //generate ground's surface
        var pts = [];
        var pts_max = 100;
        var rough = false;
        var stepped = false;
        var prev = 100;
        var left_side = -0.5*game_w-50;
        var right_side = 0.5*game_w+50;
        for (let i=0; i<=pts_max; i++) {
            if (Math.random() < 0.06 && stepped) {stepped = false;}
            if (Math.random() < 0.01 && !stepped) {stepped = true;}
            if (Math.random() < 0.05) {rough = !rough;}
            var elevation = (rough && Math.random() < .9) ? prev : (Phaser.Math.Between(50, 100) + stepped*50);
            var prev = elevation;
            var v = {
                x: Phaser.Math.Linear(left_side, right_side, i/pts_max),
                y: -elevation
            }
            pts.push(v);
        }
        this.smoothVerts(pts, 5, false, true);

        //add small noise
        pts.forEach(function(p) {if (Math.random() < .04) {p.y -= Phaser.Math.Between(10, 30);}});
        this.smoothVerts(pts, 1, false, true);

        //add vertices off screen to complete the shape
        pts.push({ x: right_side, y: 0 });
        pts.push({ x: left_side, y: 0 });

        //create ground object
        var shape_str = '';
        for (let i=0; i<pts.length; i++) {
            shape_str += pts[i].x + ' ' + pts[i].y + ' ';
        }
        var C = this.matter.verts.centre(pts);
        var x = game_w*0.5 + C.x;
        var y = game_h + C.y;
        var ground = this.createPolyFromVerts(x, y, shape_str);
        
        //give ground a masked, tiled sprite
        var sprite = 'stone_tile';
        this.addMaskedSpriteTile(ground, 'stone_tile', game_w+100, 300, pts);
        ground.mask_shape.x = ground.tex.x = x;
        ground.mask_shape.y = ground.tex.y = y;

        //ground physics
        ground.setStatic(true);
        ground.friction = .9;

        return ground;
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
        this.createGround();

        var rocks = 10;
    	for (var i = 0; i < rocks; i++) {
            var _x = Phaser.Math.Between(250, game_w-250);
            var _y = game_h-Phaser.Math.Between(200, 350);
            var _size = Math.pow(i/rocks, 3);
            this.createRock(_x, _y, _size);
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
            //update all rock masks
            var r = this.rocksArray[i];
            r.mask_shape.x = r.tex.x = r.x;
            r.mask_shape.y = r.tex.y = r.y;
            r.mask_shape.angle = r.tex.angle = r.angle;

            //set rock inertia (hack)
            var speed_threshold = 0.5;
            if (r.body.speed < speed_threshold && r.stableFrames > 4) {
                r.body.inertia = r.inertia_static;
            } else {
                r.body.inertia = r.inertia_dynamic;
            }
            r.body.inverseInertia = 1/r.body.inertia;

            //check if reversing time
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