class Square {
    constructor(size) {
      this.size = size;
    }
}

function init() {
    window.requestAnimationFrame(draw);
}

function draw() {
    var canvas = document.getElementById('tutorial');
    if (canvas.getContext) {

      var ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width, canvas.height);

      ctx.fillStyle = 'rgb(200, 0, 0)';
      ctx.fillRect(10, 10, 50, 50);

      ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
      ctx.fillRect(30, 30, 50, 50);

      ctx.font = '60px serif';
      ctx.fillText(canvas.width,200,200);

      window.requestAnimationFrame(draw);
    }
}
