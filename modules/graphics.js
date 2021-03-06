function loadImage(loader, filename, width, height, onload = undefined) {

  loader.start();
  console.log("start load " + filename);

  let img;
  if (width === undefined || height == undefined) {
    img = new Image();
  } else {
    img = new Image(width , height);
  }
  img.onload = function() {
    console.log("onload " + filename);
    loader.finish();
    if (onload !== undefined) {
      onload();
    }
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

function drawText(ctx, font, text, color, x, y) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}
