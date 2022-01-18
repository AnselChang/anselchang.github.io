//import { loadImage, drawImage, drawCircle } from 'graphics.js';

var KEYS = {
  "UP" : 38,
  "DOWN": 40,
  "LEFT" : 37,
  "RIGHT" : 39,
  "SPACEBAR" : 32
}

function getWidth() {
  return window.ctx.canvas.width;
}

function getHeight() {
  return window.ctx.canvas.height;
}


class Bullet {
  constructor(x, y, direction, speed, startDistance = 0) {
    console.log("spawned");

    this.radius = 3;

    this.xpos = x;
    this.ypos = y;
    let dir = Math.PI/180 * (direction - 90);
    this.xvel = speed * Math.cos(dir);
    this.yvel = speed * Math.sin(dir);

    this.xpos += startDistance * Math.cos(dir);
    this.ypos += startDistance * Math.sin(dir);
  }

  // Move the bullet. Return true if out of bounds
  move() {

    this.xpos += this.xvel;
    this.ypos += this.yvel;


    if (this.xpos + this.radius < 0 || this.xpos > getWidth()) return true;
    if (this.ypos + this.radius < 0 || this.ypos > getHeight()) return true;
    return false;
  }

  draw(ctx) {
    drawCircle(ctx, this.xpos, this.ypos, this.radius, 'red');
  }

}

class BulletManager {
  constructor() {
    this.bullets = [];
  }
  addBullet(x, y, direction, speed, startDistance = 0) {
    this.bullets.push(new Bullet(x, y, direction, speed, startDistance));
  }

  // update bullet positions and remove any off the screen
  update() {
    for (var i = this.bullets.length - 1; i >= 0; i--) {
      if (this.bullets[i].move()) {
          this.bullets.splice(i, 1);
          console.log("bullet deleted");
      }
    }
  }

  draw(ctx) {
    console.log("size: " + this.bullets.length);
    for (var i = 0; i < this.bullets.length; i++) {
      this.bullets[i].draw(ctx);
    }
  }


}

class Player {
    constructor(size) {
      this.size = size;

      // spawn at center of screen
      this.xpos = getWidth()/2;
      this.ypos = getHeight()/2;

      this.SPEED = 0.5;
      this.DIRECTION_SPEED = 2;
      this.FRICTION = 0.99;
      this.BULLET_SPEED = 10;

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

      this.bulletCycle = 10;
      this.currentTick = this.bulletCycle;

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
      if (this.xpos + this.size > getWidth()) {
        this.xpos = getWidth() - this.size;
        this.xvel = 0;
      } else if (this.xpos < 0) {
        this.xpos = 0;
        this.xvel = 0;
      }

      // Collision with top/bottom walls
      if (this.ypos + this.size > getHeight()) {
        this.ypos = getHeight() - this.size;
        this.yvel = 0;
      } else if (this.ypos < 0) {
        this.ypos = 0;
        this.yvel = 0;
      }

      // Handle bullet creation
      if (this.currentTick < this.bulletCycle) {
        this.currentTick++;
      }
      if (window.keyHandler.isPressed("SPACEBAR") && this.currentTick === this.bulletCycle) {
        this.currentTick = 0;
        window.bulletManager.addBullet(this.xpos, this.ypos, this.direction, this.BULLET_SPEED, this.image1.height*1.3)

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
  window.bulletManager = new BulletManager();
  window.player = new Player(10, window.canvas.width, window.canvas.height);

  window.spaceBackground = loadImage("space.jpeg");

  window.requestAnimationFrame(executeFrame);

}

function executeFrame() {

  window.player.tick();
  window.bulletManager.update();

  window.ctx.canvas.width  = window.innerWidth;
  window.ctx.canvas.height = window.innerHeight;

  // clear screen and draw background
  window.ctx.clearRect(0,0,window.canvas.width, window.canvas.height);
  window.ctx.drawImage(window.spaceBackground, 0, 0);


  window.player.draw(window.ctx);
  window.bulletManager.draw(window.ctx);

  // Queue the exeuction of the next frame
  window.requestAnimationFrame(executeFrame);

}
