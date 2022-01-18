import { loadImage, drawImage, drawCircle } from './modules/graphics.js';

var KEYS = {
  "UP" : 38,
  "DOWN": 40,
  "LEFT" : 37,
  "RIGHT" : 39,
  "SPACEBAR" : 32
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
