import 'phaser';
import ImageTracer from '../ImageTracer';

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
    	// Break all joints 
    	if (Phaser.Input.Keyboard.JustDown(this.keys.B)) {
    		for(let i = 0; i < this.particles.length; i++) {
        		let particle1 = this.particles[i];
        		for(let key in particle1.joints) {
        			let joint = particle1.joints[key]
        			let particle2 = this.particleKeys[key]
        			delete particle2.joints[particle1.uniqueID];
        			delete particle1.joints[key];
        			this.matter.world.removeConstraint(joint);
        		}
        	}
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

    markSentient(particle) {
    	// This function should ONLY be run on a single particle on startup
    	// or on a particle that is connected to   a sentient chunk 
    	particle.isSentient = true;
    	this.sentientParticles.push(particle);
    	//particle.setTint(0xff0000);
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
    
    updateFace(me, face, state) {
        face.state = state;
        switch(face.state) {
            case 'scared':
                face.setTexture('face_scared');
                break;
            case 'hurt':
                face.setTexture('face_hurt');
                setTimeout(function() {
                    if (face.state == 'hurt') { me.updateFace(me, face, 'normal'); }
                }, 1500);
                break;
            case 'normal':
            default:
                face.setTexture('face_normal');
        }
    }

    create() {    	
    	this.particles = [];
    	this.particleKeys = {};
    	this.sentientParticles = [];
    	this.targetCamX = 0;
    	this.targetCamY = 0;
    	this.initKeys();
        var tex = this.textures.get('level1');
    	var img = tex.getSourceImage();
        var map_scale = 10;
        var map_w = img.width * map_scale;
        var map_h = img.height * map_scale;
    	var W = map_w * 2;
    	var H = map_h;

        var game_w = this.game.config.width;
    	var game_h = this.game.config.height;

    	// Toggle debug draw off to start with 
    	// Just setting it to false in the initial settings doesn't work
    	// because then matter doesn't initialize the debugGraphic
    	this.matter.world.drawDebug = !this.matter.world.drawDebug;
    	this.matter.world.debugGraphic.clear();

        // Init background graphics
        var back_sky = this.add.graphics();
        var top_color = 0x8fe3e2;
        var bottom_color = 0xe9ffde;
        back_sky.fillGradientStyle(top_color, top_color, bottom_color, bottom_color, 1);
        back_sky.fillRect(0, 0, W, H);
        var back_mtn1 = this.add.image(game_w/2-50, game_h/2+80, 'mtn1').setScrollFactor(.02);
        var back_mtn2 = this.add.image(game_w/2+550, game_h/2+80, 'mtn2').setScrollFactor(.04);
        var mtn3_tex = this.textures.get('mtn3');
        var back_mtn3 = this.add.tileSprite(game_w, game_h/2+150, W, mtn3_tex.getSourceImage().height, 'mtn3').setScrollFactor(.06);
        back_mtn3.setTilePosition(120, 0);
        
        // Make level
        this.makeLevel(img, map_scale, W, H);
        
    	this.markSentient(this.createParticle(300,600, 1))
    	this.createParticle(400,400, 1)

    	for(let i = 0;i < 10;i++){
    		let min = 0.5;
    		let max = 1;
    		let size = Math.round(Math.random() * (min-max)) + min;
    		this.createParticle(600 + i * 50,600, 1)
    	}

    	this.matter.world.setBounds(0, 0, W, H);

    	this.matter.add.mouseSpring();

    	// Set up camera to follow player 
    	this.cameras.main.setBounds(0, 0, W, H);
        
        // Init character face
		this.face = this.add.image(0,0, 'face_normal');
		this.face.setOrigin(0.5);
		this.face.setScale(0.1);
        this.updateFace(this, this.face, 'hurt');

		this.windChar = this.add.image(300,200, 'stone');
		this.windChar.setOrigin(0.5)
		this.windChar.setScale(0.5);
		this.windChar.counter = 0;
    }

    windCharacterUpdate(playerX, playerY) {
    	let Matter = Phaser.Physics.Matter.Matter;
    	// Get the player's velocity. 
    	let averageVelocity = {x:0, y:0};
    	for(let particle of this.sentientParticles) {
    		averageVelocity.x += particle.body.velocity.x;
    		averageVelocity.y += particle.body.velocity.y;
    	}
    	averageVelocity.x /= this.sentientParticles.length; 
    	averageVelocity.y /= this.sentientParticles.length; 
    	let length = Math.sqrt(averageVelocity.x * averageVelocity.x + averageVelocity.y * averageVelocity.y);

    	let char = this.windChar;

    	if(length < 2 && !this.input.mousePointer.isDown) {
    		char.counter ++; 
    		if(char.counter > 20) {
    			// If determined to be on the ground, go and follow player 
    			this.windChar.targetX = playerX;
				this.windChar.targetY = playerY;
				if(this.face.state == "scared") {
					this.updateFace(this, this.face, 'normal')
				}
    		}
    		
		} else {
			char.counter = 0;
		}
    		
		// If click, apply force to all particles nearby 
		if (this.input.mousePointer.isDown) {
			let dx = this.input.mousePointer.worldX - playerX; 
			let dy = this.input.mousePointer.worldY - playerY; 
			let angle = Math.atan2(dy,dx);
			let cos = Math.cos(angle);
			let sin = Math.sin(angle);
			let dist = Math.sqrt(dx * dx + dy * dy);
			let strengthFactor = (dist / 400);
			if(strengthFactor > 1) strengthFactor = 1; 

			let maxParticles = 30;

			strengthFactor *= 0.005;

			let forcePosition = {
				x: this.input.mousePointer.worldX,
				y: this.input.mousePointer.worldY
			};
			let forceStrength = {
				x: cos * strengthFactor, 
				y: sin * strengthFactor
			}

			if(this.face.state == 'normal') {
				//this.updateFace(this, this.face, 'scared');
			}
			

			for(let particle of this.sentientParticles) {
				
				// Matter.Body.setVelocity(particle.body, {
				// 	x: strengthFactor * 20 * cos * factor,
				// 	y: strengthFactor * 20 * sin * factor
				// })

				Matter.Body.applyForce(particle.body, forcePosition, forceStrength);
			}
	   }
    }

    killDisconnectedSentience() {
    	// Collect all connected components
    	// if there are more than 1, mark all except the biggest as non-sentient 
    	let that = this;
    	function depthFirstSearch(particle, explored) {
    		explored[particle.uniqueID] = true; 
    		for(let key in particle.joints) {
				let particle2 = that.particleKeys[key]
				if(!explored[key]) {
					depthFirstSearch(particle2, explored);
				}
			}
    	}

    	let componentArray = [];
    	if(this.sentientParticles.length == 0) {
    		return;
    	}

    	let component = {};
    	depthFirstSearch(this.sentientParticles[0], component);
    	componentArray.push(component);
    	//console.log(Object.keys(component).length, this.sentientParticles.length);
    	let done = false;
    	while(!done) {
    		for(let p of this.sentientParticles) {
	    		if(!component[p.uniqueID]) {
	    			// Found a new component!
	    			let newComponent = {};
	    			depthFirstSearch(p, newComponent);
	    			componentArray.push(newComponent);
	    			break;
	    		}
	    	}

	    	done = true;
    	}
    	

    	if(componentArray.length > 1) {
    		// Find the biggest component 
    		let biggestComponentIndex = -1;
    		let biggest;
    		let i = 0;
    		for(let c of componentArray) {
    			if(biggestComponentIndex == -1) {
    				biggestComponentIndex = i;
    				biggest = Object.keys(c).length;
    			}

    			if(Object.keys(c).length >= biggest) {
    				biggest = Object.keys(c).length; 
    				biggestComponentIndex = i;
    			}

    			i++;
    		}

    		// Now mark everything else as non sentient 
    		i = 0;
    		this.sentientParticles = [];

    		for(let c of componentArray) {
    			for(let key in c) {
    				let particle = this.particleKeys[key]
					if(i != biggestComponentIndex) {
	    				particle.isSentient = false;
						//particle.setTint(0xffffff);
	    			} else {
	    				this.sentientParticles.push(particle);
	    			}
				}
    			i++;
    		}

    		
    	}

    	
    }

    markSweepSentience(particle, explored) {
    	// Given a particle, make sure all particles connected to it are marked as sentient 
    	for(let key in particle.joints) {
			let particle2 = this.particleKeys[key]
			if(!explored[key] && !particle2.isSentient) {
				this.markSentient(particle2);
				explored[key] = true;
				this.markSweepSentience(particle2, explored);
			}
		}
    }

    update() {
    	this.debugUpdate();	


    	let sentientAvgX = 0;
    	let sentientAvgY = 0;
    	let sentientLength = 0;
    	let broke_apart_times = 0;
        
        for(let i = 0; i < this.particles.length; i++) {
        	let particle1 = this.particles[i];

        	if(particle1.isSentient) {
        		sentientAvgX += particle1.x; 
        		sentientAvgY += particle1.y;
        		sentientLength++;
        	}

        	let id1 = particle1.uniqueID;

        	// Check if the distance between particle1 and all its joint particles is too big, 
        	// and if so, destroy the joint
           
        	for(let key in particle1.joints) {
    			let joint = particle1.joints[key]
    			let particle2 = this.particleKeys[key]
    			let dx = particle1.x - particle2.x; 
    			let dy = particle1.y - particle2.y; 
    			let dist  = Math.sqrt(dx * dx + dy * dy);
    			if (dist >= 45) {
    				delete particle2.joints[particle1.uniqueID];
    				delete particle1.joints[key];
    				this.matter.world.removeConstraint(joint);
    				this.killDisconnectedSentience();
                    broke_apart_times++;
    			}
            }

            if (broke_apart_times > 2) {this.updateFace(this, this.face, 'hurt');}

        	for(let j = 0; j < this.particles.length; j++) {
        		let particle2 = this.particles[j];
        		let p1Keys = Object.keys(particle1.joints);
        		let p2Keys = Object.keys(particle2.joints);
        		
        		// No particle should have more than 3 connections
        		// if(p1Keys.length >= 3 || p2Keys.length >= 3) {
	        	// 	continue;
	        	// }

        		let id2 = particle2.uniqueID;
        		if (i != j && !particle1.joints[id2]) {
        			let dx = particle1.x - particle2.x; 
        			let dy = particle1.y - particle2.y; 
        			let dist  = Math.sqrt(dx * dx + dy * dy);
        			if(dist < 30) {
        				let joint = this.matter.add.constraint(particle1, particle2, 35, 0.35);
        				particle1.joints[id2] = joint;
        				particle2.joints[id1] = joint;
        				if(particle1.isSentient && !particle2.isSentient) {
        					this.markSentient(particle2);
        					this.markSweepSentience(particle2, {});
        				} else if (particle2.isSentient && !particle1.isSentient) {
        					this.markSentient(particle1);
        					this.markSweepSentience(particle1, {});
        				}
        			}
        		}
        	}
        }

        // Average the x and y of the sentient and update camera view
        var W = this.game.config.width;
    	var H = this.game.config.height;
        sentientAvgX /= sentientLength;
        sentientAvgY /= sentientLength;
        let camera = this.cameras.main;

        this.targetCamX += (sentientAvgX - this.targetCamX) * 0.16;
        this.targetCamY += (sentientAvgY - this.targetCamY) * 0.16;

        let dx = (this.targetCamX - camera.scrollX) - camera.centerX;
        let dy = (this.targetCamY - camera.scrollY) - camera.centerY;
		let newX = (camera.centerX + camera.scrollX) + dx * 0.16;
		let newY = (camera.centerY + camera.scrollY) + dy * 0.16;
        camera.centerOn(newX, newY);

        this.face.x = sentientAvgX; 
        this.face.y = sentientAvgY;

        let factor = Math.min(sentientLength, 10) / 10;
        this.face.setScale(0.1 + factor * 0.2)
        this.windCharacterUpdate(sentientAvgX, sentientAvgY);
    }
}

// Make it so we can use it from a different file. 
export default Game;