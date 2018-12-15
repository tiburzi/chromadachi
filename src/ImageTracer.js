class ImageTracer {
	// From Joseph Parker's http://www.procjam.com/tutorials/en/wfc/
	getPixel(imgData, x, y) {
	  let index = y*imgData.width+x
	  let i = index*4, d = imgData.data
	  return {r:d[i],g:d[i+1],b:d[i+2]}
	}

	getPointWithSmallestX(points) {
		let smallestX;
		let smallestIndex;
		let i = 0;
		for(let p of points) {
			if (smallestIndex == undefined) {
				smallestIndex = i;
				smallestX = p.x;
			}

			if(p.x <= smallestX) {
				smallestX = p.x; 
				smallestIndex = i;
			}

			i++;
		}

		return smallestIndex;
	}

	traceImage(img, size) {
		var c = document.createElement("canvas")
		c.width = img.width
		c.height = img.height
		var ctx = c.getContext("2d")
		ctx.drawImage(img,0,0)
		var imageData = ctx.getImageData(0,0,img.width,img.height);

	
		let points = [];
		let inside = false;
		// Scanline to get the points 
		for(var x = 0;x < img.width; x ++){
			for(var y = 0;y < img.height; y++){
				var pixel = this.getPixel(imageData, x, y);
				// If we see a black pixel and we're not inside anything
				if(pixel.r == 0 && !inside) {
					inside = true;
					points.push({x:x * size, y:y * size})
				} else if(inside && pixel.r == 255) {
					inside = false;
				}
			}
		}

		inside = false;
		for(var y = 0;y < img.height; y ++){
			for(var x = 0;x < img.width; x++){
				var pixel = this.getPixel(imageData, x, y);
				if(pixel.r == 0 && !inside) {
					inside = true;
					points.push({x:x * 10,y:y * 10})
				} else if(inside && pixel.r == 255) {
					inside = false;
				}
			}
		}

		let shapes = [];
		let i = 0;
		
		let point = points.splice(this.getPointWithSmallestX(points),1)[0];
		let newShape = [];
		
		while(points.length != 0) {
			let closestIndex;
			let closestDistance;
			let i = 0;
			// Find the closest point to point
			for(let p of points) {
				let dx = p.x - point.x;
				let dy = p.y - point.y; 

				let dist = Math.sqrt(dx * dx + dy * dy);
				if(closestIndex == undefined) {
					closestDistance = dist;
				}

				if(dist <= closestDistance) {
					closestIndex = i; 
					closestDistance = dist; 
				}
				i++;
			}

			// If it's close enough, it's still part of the shape
			if(closestDistance < 50 && points.length > 1) {
				// If a point is too close skip it 
				if(closestDistance > 10) {
					newShape.push(point);
					point = points.splice(closestIndex, 1)[0]
				} else {
					points.splice(closestIndex, 1)[0]
				}
			} else {
				// Too far! Start a new shape
				shapes.push(newShape);
				point = points.splice(this.getPointWithSmallestX(points), 1)[0];
				newShape = [];
			}
		}
        
        // Relax neighboring points to smooth the shapes
        function lerp(a, b, t) {
            return a*(1-t)+b*t;
        }
        function relax() {
            for(let shape of shapes) {
                let pts = shape.length;
                for(let i=0; i<pts; i++) {
                    let prev = (i-1+pts) % pts;
                    let next = (i+1) % pts;
                    shape[i].x = lerp(shape[prev].x, shape[next].x, .5);
                    shape[i].y = lerp(shape[prev].y, shape[next].y, .5);
                }
            }
        }
        for (let i=0; i<2; i++) {relax();}
        
        return shapes;

		// Convert the x/y to a string for Matterjs 
		/*let finalShapes = [];

		for(let shape of shapes){
			let newString = '';
			for(let point of shape){
				newString += point.x + " " + point.y + " "
			}
			finalShapes.push(newString)
		}		

		return finalShapes;*/

	}
}

export default ImageTracer;