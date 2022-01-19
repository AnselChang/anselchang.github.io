//import { loadImage, drawImage, drawCircle } from 'graphics.js';

var GAME_SPEED = 0.02;
var BULLET_SPEED = 0.3;

var KEYS = {
  "UP" : 38,
  "DOWN": 40,
  "LEFT" : 37,
  "RIGHT" : 39,
  "SPACEBAR" : 32,
  "S": 83,
  "A": 65
}

function getWidth() {
  return window.ctx.canvas.width;
}

function getHeight() {
  return window.ctx.canvas.height;
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

function getDistanceSquared(x1,y1,x2,y2) {
  let a = x1 - x2;
  let b = y1 - y2;
  return a*a + b*b;
}

// Generate a closure lambda for a parametrized circular orbit
function generateCircularOrbit(planet, radius, period, pstart = 0) {
  let t = pstart;
  return function() {
    t = (t + 1) % period;
    let theta = (t-pstart) * 2*Math.PI / period;
    return [planet.x + radius*Math.cos(theta), planet.y + radius*Math.sin(theta)]
  }
}

function outOfBounds(x, y, r, margin) {
  if (x + r < 0 - margin || x > getWidth() + margin) return true;
  if (y + r < 0 - margin || y > getHeight() + margin) return true;
  return false;
}

function drawPrediction(ctx, x, y, xvel, yvel, color = 'red', iterations = 500) {

  let RESOLUTION = 15;

  ctx.beginPath();
  ctx.moveTo(x, y);

  let startCollide = true;

  for (var i = 0; i < iterations; i++) {

    // Yield to the forces of gravity
    let delta = window.planets.getFieldVectorAt(x, y);

    if (outOfBounds(x,y,0,100)) break;

    // If collision with planet, stop prediction here
    if (delta === null) {
      if (startCollide === true) {
        delta = [0,0];
      } else {
        break;
      }
    } else {
      startCollide = false;
    }

    xvel += delta[0] / GAME_SPEED / RESOLUTION;
    yvel += delta[1] / GAME_SPEED / RESOLUTION;
    x += xvel / RESOLUTION;
    y += yvel / RESOLUTION;

    ctx.lineTo(x,y);
  }

  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  ctx.stroke();

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

    this.mass = mass;
    this.scale = scale;

    var self = this;

    this.image = loadImage(window.imageLoader, image, undefined, undefined, function() {
      self.findPosition();
      self.radius = self.scale / 4 * (self.image.width + self.image.height);
    });
    this.image = new Image();
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
    drawCircle(ctx, this.x, this.y, 10, 'blue');
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
    this.planets.push(new Planet(170, "mars.png", 0.23, false, [300, 350]));
    this.planets.push(new Planet(60, "moon.png", 0.14, false, [700, 600]));


    this.planets.push(new Planet(17, "asteroid.png", 0.08, false, [660, 150]));
    this.planets.push(new Planet(17, "asteroid.png", 0.08, false, [350, 750]));
    this.planets.push(new Planet(17, "asteroid.png", 0.08, false, [1200, 700]));
    this.planets.push(new Planet(17, "asteroid.png", 0.08, false, [1400, 600]));
    this.planets.push(new Planet(17, "asteroid.png", 0.08, false, [1350, 800]));

    let venus = new Planet(110, "venus.png", 0.225, false, [1100, 300]);
    this.planets.push(venus);
    let orbit = generateCircularOrbit(venus, 200, 300 / GAME_SPEED);
    this.planets.push(new Planet(17, "asteroid.png", 0.08, true, orbit));
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
  constructor(x, y, dir, speed, startDistance = 0) {

    this.radius = 3;

    this.xpos = x;
    this.ypos = y;
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
      return true; // If crash, delete bullet
    }


    this.xvel += delta[0] * BULLET_SPEED;
    this.yvel += delta[1] * BULLET_SPEED;

    this.xvel *= this.FRICTION;
    this.yvel *= this.FRICTION;

    // Move the bullet
    this.xpos += this.xvel * BULLET_SPEED;
    this.ypos += this.yvel * BULLET_SPEED;

    return outOfBounds(this.xpos, this.ypos, this.radius, this.MARGIN);
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

      this.SPEED = 0.6;
      this.BOOSTER_SPEED = 2;
      this.BULLET_SPEED = 15;

      // spawn with 0 velocity
      this.xvel = 0;
      this.yvel = 0;
      this.direction = 0; // 0 - 2pi degrees


      // Load images
      this.image1 = loadImage(window.imageLoader, "spaceship.png", 60, 60);
      this.image2 = loadImage(window.imageLoader, "spaceship2.png", 60, 60);
      this.image3 = loadImage(window.imageLoader, "spaceship3.png", 60, 60);

      this.size = (this.image1.width + this.image1.height) / 2;

      this.bulletCycle = 10;
      this.currentTick = this.bulletCycle;

    }


    tick() {

      // Yield to the forces of gravity
      let delta = window.planets.getFieldVectorAt(this.xpos, this.ypos);
      if (delta !== null) {
        this.xvel += delta[0];
        this.yvel += delta[1];

      } else {
        this.xvel = 0;
        this.yvel = 0;
      }


      this.direction = Math.atan2(window.mouse.y - this.ypos, window.mouse.x - this.xpos);

      // handle spacebar to accelerate spaceship
      if (window.keyHandler.isPressed("SPACEBAR")) {
        let speed = window.keyHandler.isPressed("A") ? this.BOOSTER_SPEED : this.SPEED;
        this.xvel += speed * Math.cos(this.direction);
        this.yvel += speed * Math.sin(this.direction);
      }


      // Actually update position of object from velocities
      this.xpos += this.xvel * GAME_SPEED;
      this.ypos += this.yvel * GAME_SPEED;



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
      if (window.keyHandler.isPressed("S") && this.currentTick === this.bulletCycle) {
        this.currentTick = 0;
        window.bulletManager.addBullet(this.xpos, this.ypos, this.direction, this.BULLET_SPEED, this.image1.height*0.5)

      }

    }

    draw(ctx) {

      let PREDICTION_SPEED = 30;
      let xvel = PREDICTION_SPEED * Math.cos(this.direction);
      let yvel = PREDICTION_SPEED * Math.sin(this.direction);
      drawPrediction(ctx, this.xpos, this.ypos, xvel, yvel, 'green');
      drawPrediction(ctx, this.xpos, this.ypos, this.xvel, this.yvel, 'red');

      let img;
      if (window.keyHandler.isPressed("SPACEBAR")) {
        if (window.keyHandler.isPressed("A")) {
          img = this.image3;
        } else {
          img = this.image2;
        }
      } else {
        img = this.image1;
      }
      drawImage(ctx, img, this.xpos, this.ypos, 1, 2, this.direction+Math.PI/2,0.3);
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

class MouseHandler {
  constructor() {
    this.x = 0;
    this.y = 0;
    var self = this;
    window.addEventListener('mousemove', (e) => {
      self.x = e.offsetX;
      self.y = e.offsetY;
    })

  }
}

class ImageLoader {
  constructor() {
    this.numStarted = 0;
    this.numFinished = 0;
  }
  start() {
    this.numStarted++;
  }
  finish() {
    this.numFinished++;
  }
  done() {
    return this.numFinished === this.numStarted && this.numStarted > 1;
  }
}

function executeProgramWhenLoaded() {
  if(window.imageLoader.done() === false) {
     window.setTimeout(executeProgramWhenLoaded, 100); /* this checks the flag every 100 milliseconds*/
  } else {
    console.log("Images loaded");
    window.requestAnimationFrame(executeFrame);
  }

}

function init() {

  console.log("start");

  window.canvas = document.getElementById('tutorial');
  window.ctx = canvas.getContext('2d');

  window.ctx.canvas.width  = window.innerWidth;
  window.ctx.canvas.height = window.innerHeight;

  console.log("" + window.ctx.canvas.width + " " + window.ctx.canvas.height);

  window.imageLoader = new ImageLoader();
  window.keyHandler = new KeyHandler();
  window.mouse = new MouseHandler();
  window.bulletManager = new BulletManager();
  window.planets = new PlanetarySystem();
  window.player = new Player(10, window.canvas.width, window.canvas.height);

  window.spaceBackground = loadImage(window.imageLoader, "space.jpeg");

  console.log("Loading images...");
  executeProgramWhenLoaded();

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

  drawText(ctx, '30px serif', 'Spacebar for engine, A for booster, S to shoot', 'white', getWidth()/2, 30);

  // Queue the exeuction of the next frame
  window.requestAnimationFrame(executeFrame);

}
