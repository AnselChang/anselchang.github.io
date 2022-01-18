//import { loadImage, drawImage, drawCircle } from './graphics.js';

var KEYS = {
  "UP" : 38,
  "DOWN": 40,
  "LEFT" : 37,
  "RIGHT" : 39,
  "SPACEBAR" : 32
}

function loadImage(filename, width, height) {
  let img;
  if (width === undefined || height == undefined) {
    img = new Image();
  } else {
    img = new Image(width , height);
  }
  img.src = filename;
  return img;
}

// draw rotated image
// https://stackoverflow.com/questions/17411991/html5-canvas-rotate-image
function drawImage(ctx, image, x, y, cx, cy, rotation, scale = 1) {
    ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin
    ctx.rotate(rotation);
    ctx.drawImage(image, -cx*image.width, -cy*image.height);
    ctx.setTransform(1,0,0,1,0,0);
}

function drawCircle(context, centerX, centerY, radius, color = 'black') {
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
  context.fillStyle = color;
  context.fill();
  context.lineWidth = 5;
  context.strokeStyle = color;
  context.stroke();
}

class Player {
    constructor(size, width, height) {
      this.size = size;
      this.sWidth = width
      this.sHeight = height

      // spawn at center of screen
      this.xpos = width/2;
      this.ypos = height/2;

      this.SPEED = 0.5;
      this.DIRECTION_SPEED = 2;
      this.FRICTION = 0.99;

      // spawn with 0 velocity
      this.xvel = 0;
      this.yvel = 0;
      this.direction = 0; // 0-360 degrees


      // Load images
      this.image1 = loadImage("spaceship.png", 60, 60);
      this.image2 = loadImage("spaceship2.png", 60, 60);
      // this.image1 = new Image(60,60);
      // this.image1.src = "spaceship.png"
      // this.image2 = new Image(60,60);
      // this.image2.src = "spaceship2.png"

    }


    tick() {


      // handle left/right arrow keys to rotate spaceship
      if (window.keyHandler.isPressed("LEFT")) {
        this.direction = (360 + this.direction - this.DIRECTION_SPEED) % 360;
      } else if (window.keyHandler.isPressed("RIGHT")) {
        this.direction = (this.direction + this.DIRECTION_SPEED) % 360;
        console.log("down");
      }
      console.log(this.direction);

      // handle spacebar to accelerate spaceship
      if (window.keyHandler.isPressed("UP")) {

        let dir = Math.PI/180 * (this.direction - 90);
        this.xvel += this.SPEED * Math.cos(dir);
        this.yvel += this.SPEED * Math.sin(dir);
        console.log(this.xvel, this.yvel)
      }

      // friction
      this.xvel *= this.FRICTION;
      this.yvel *= this.FRICTION;

      // Actually update position of object from velocities
      this.xpos += this.xvel;
      this.ypos += this.yvel;

      // Collision with side walls
      if (this.xpos + this.size > this.sWidth) {
        this.xpos = this.sWidth - this.size;
        this.xvel = 0;
      } else if (this.xpos < 0) {
        this.xpos = 0;
        this.xvel = 0;
      }

      // Collision with top/bottom walls
      if (this.ypos + this.size > this.sHeight) {
        this.ypos = this.sHeight - this.size;
        this.yvel = 0;
      } else if (this.ypos < 0) {
        this.ypos = 0;
        this.yvel = 0;
      }

    }

    draw(ctx) {
      let img = window.keyHandler.isPressed("UP") ? this.image2 : this.image1;
        drawImage(ctx, img, this.xpos, this.ypos, 1, 2, Math.PI/180 * this.direction);
    }
}


class KeyHandler {

  constructor() {

    this.pressedKeys = {};

    window.addEventListener('keydown', (e) => {this.pressedKeys[e.keyCode] = true;}, false);
    window.addEventListener('keyup', (e) => {this.pressedKeys[e.keyCode] = false;}, false);

  }


  isPressed(keyStr) {
      // If not in pressedKeys dictionary, return false by default
      return this.pressedKeys[KEYS[keyStr]] ?? false;
  }

}



function init() {

  console.log("start");

  window.canvas = document.getElementById('tutorial');
  window.ctx = canvas.getContext('2d');

  window.keyHandler = new KeyHandler();
  window.player = new Player(40, window.canvas.width, window.canvas.height);

  window.spaceBackground = loadImage("space.jpeg");

  window.requestAnimationFrame(executeFrame);

}

function executeFrame() {

  window.player.tick();
  draw();

  // Queue the exeuction of the next frame
  window.requestAnimationFrame(executeFrame);

}

function draw() {

  player.sWidth = window.ctx.canvas.width  = window.innerWidth;
  player.sHeight = window.ctx.canvas.height = window.innerHeight;

  // clear screen and draw background
  window.ctx.clearRect(0,0,window.canvas.width, window.canvas.height);
  window.ctx.drawImage(window.spaceBackground, 0, 0);


  window.player.draw(window.ctx);
  drawCircle(window.ctx, 300,300, 50, 'red');

  window.ctx.font = '60px serif';
  //window.ctx.fillText(window.keyHandler.get(),200,200);

}
