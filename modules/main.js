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

function getDistanceSquared(x1,y1,x2,y2) {
  let a = x1 - x2;
  let b = y1 - y2;
  return a*a + b*b;
}

// Generate a closure lambda for a parametrized circular orbit
function generateCircularOrbit(planet, radius, period, pstart) {
  let t = pstart;
  return function() {
    t = (t + 1) % period;
    let theta = (t-pstart) * 2*Math.PI / period;
    return [planet.x + radius*Math.cos(theta), planet.y + radius*Math.sin(theta)]
  }
}

class Planet {
  constructor(mass, image, scale, isParametric, parametric, period) {

    this.isParametric = isParametric;

    if (isParametric) {
      this.para = parametric;
      this.period = period;
      [this.x, this.y] = this.para(0);

    } else {
      [this.x, this.y] = parametric;
    }
    console.log(""+this.x + "a" + this.y);

    this.mass = mass;
    this.scale = scale;

    var self = this;
    this.image = new Image();
    this.image.onload = function() {

      self.findPosition();
      self.radius = self.scale / 4 * (this.width + this.height);
    }
    this.image.src = image;
    this.radius = 100;

    this.findPosition();

  }

  // Update position of planet from parametric equations
  update() {

    if (this.isParametric) {

      [this.x, this.y] = this.para();

      this.findPosition();
    }

  }

  findPosition()  { // position at top-left corner
    this.lx = this.x - this.image.width / 2 * this.scale;
    this.ly = this.y - this.image.height / 2 * this.scale;

  }

  draw(ctx) {
    drawImage(ctx, this.image, this.lx, this.ly, 0, 0, 0, this.scale);
  }
}

// In charge of determining gravitational forces aggregated from all planets
class PlanetarySystem {

  // Create hardcoded planets here
  constructor() {
    this.planets = [];
    this.CONSTANT = 100;

    this.createPlanets();

  }

  createPlanets() {
    this.planets.push(new Planet(170, "mars.png", 0.2, false, [300, 350]));
    this.planets.push(new Planet(100, "moon.png", 0.1, false, [700, 600]));


    this.planets.push(new Planet(30, "asteroid.png", 0.07, false, [660, 150]));
    this.planets.push(new Planet(30, "asteroid.png", 0.07, false, [350, 750]));
    this.planets.push(new Planet(30, "asteroid.png", 0.07, false, [1200, 700]));
    this.planets.push(new Planet(30, "asteroid.png", 0.07, false, [1400, 600]));
    this.planets.push(new Planet(30, "asteroid.png", 0.07, false, [1350, 800]));

    let venus = new Planet(200, "venus.png", 0.2, false, [1100, 300]);
    this.planets.push(venus);
    console.log(venus);
    let orbit = generateCircularOrbit(venus, 200, 300, 50);
    console.log(orbit);
    this.planets.push(new Planet(30, "asteroid.png", 0.07, true, orbit, ));
  }

  updatePlanets() {
    for (var i = 0; i < this.planets.length; i++) {
      this.planets[i].update();
    }
  }

  // For each planet, approximate formula = k * mass / radius^2
  getFieldVectorAt(x,y) {
    let dx = 0;
    let dy = 0;

    for (var i = 0; i < this.planets.length; i++) {
      let distSquared = getDistanceSquared(this.planets[i].x, this.planets[i].y, x, y);
      let magnitude = Math.sqrt(distSquared);

      // crash onto planet
      if (magnitude < this.planets[i].radius) {
        console.log("small");
        return null;
      }

      let force = this.CONSTANT * this.planets[i].mass / (distSquared);

      // unit vector is vector component over magnitude

      dx += force * (this.planets[i].x - x) / magnitude;
      dy += force * (this.planets[i].y - y) / magnitude;
    }

    return [dx,dy];
  }

  draw(ctx) {
    for (var i = 0; i < this.planets.length; i++) {
      this.planets[i].draw(ctx);
    }
  }

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

    this.FRICTION = 1;

    this.MARGIN = 100; // distance off screen to warrent auto-despawn
  }

  // Move the bullet. Return true if out of bounds
  move() {

    // Yield to the forces of gravity
    let delta = window.planets.getFieldVectorAt(this.xpos, this.ypos);
    if (delta === null) {
      console.log("collision");
      return true; // If crash, delete bullet
    }


    this.xvel += delta[0];
    this.yvel += delta[1];

    this.xvel *= this.FRICTION;
    this.yvel *= this.FRICTION;

    // Move the bullet
    this.xpos += this.xvel;
    this.ypos += this.yvel;


    if (this.xpos + this.radius < 0 - this.MARGIN || this.xpos > getWidth() + this.MARGIN) return true;
    if (this.ypos + this.radius < 0 - this.MARGIN || this.ypos > getHeight() + this.MARGIN) return true;
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
    for (var i = 0; i < this.bullets.length; i++) {
      this.bullets[i].draw(ctx);
    }
  }


}

class Player {
    constructor() {

      // spawn at center of screen
      this.xpos = getWidth()/2;
      this.ypos = getHeight()/2;

      this.SPEED = 0.5;
      this.DIRECTION_SPEED = 2;
      this.FRICTION = 0.99;
      this.BULLET_SPEED = 12;

      // spawn with 0 velocity
      this.xvel = 0;
      this.yvel = 0;
      this.direction = 0; // 0-360 degrees


      // Load images
      this.image1 = loadImage("spaceship.png", 60, 60);
      this.image2 = loadImage("spaceship2.png", 60, 60);

      this.size = (this.image1.width + this.image1.height) / 2;

      this.bulletCycle = 10;
      this.currentTick = this.bulletCycle;

    }


    tick() {


      // handle left/right arrow keys to rotate spaceship
      if (window.keyHandler.isPressed("LEFT")) {
        this.direction = (360 + this.direction - this.DIRECTION_SPEED) % 360;
      } else if (window.keyHandler.isPressed("RIGHT")) {
        this.direction = (this.direction + this.DIRECTION_SPEED) % 360;
      }

      // handle spacebar to accelerate spaceship
      if (window.keyHandler.isPressed("UP")) {

        let dir = Math.PI/180 * (this.direction - 90);
        this.xvel += this.SPEED * Math.cos(dir);
        this.yvel += this.SPEED * Math.sin(dir);
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

  window.ctx.canvas.width  = window.innerWidth;
  window.ctx.canvas.height = window.innerHeight;

  console.log("" + window.ctx.canvas.width + " " + window.ctx.canvas.height);

  window.keyHandler = new KeyHandler();
  window.bulletManager = new BulletManager();
  window.planets = new PlanetarySystem();
  window.player = new Player(10, window.canvas.width, window.canvas.height);

  window.spaceBackground = loadImage("space.jpeg");

  window.requestAnimationFrame(executeFrame);

}

function executeFrame() {

  window.ctx.canvas.width  = window.innerWidth;
  window.ctx.canvas.height = window.innerHeight;

  window.planets.updatePlanets();
  window.player.tick();
  window.bulletManager.update();


  // clear screen and draw background
  window.ctx.clearRect(0,0,window.canvas.width, window.canvas.height);
  window.ctx.drawImage(window.spaceBackground, 0, 0);

  window.planets.draw(window.ctx);
  window.player.draw(window.ctx);
  window.bulletManager.draw(window.ctx);

  drawText(ctx, '30px serif', 'Arrow keys to move, spacebar to shoot', 'white', getWidth()/2, 30);

  // Queue the exeuction of the next frame
  window.requestAnimationFrame(executeFrame);

}
