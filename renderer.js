var debug = false;	

function Path(offsetX,offsetY)
{
    this.offsetX = offsetX;
    this.offsetY = offsetY;
}

Path.prototype.modifications = [];
Path.prototype.points = [];
Path.prototype.complete = false;

function Renderer()
{
}

Renderer.renderWorld = function(canvas,data,blockWidth=1, blockHeight=1)
{
    canvas.width=data.length * blockWidth;
    canvas.height=data[0].length * blockHeight;
    
    var context = canvas.getContext("2d");
    
    context.fillStyle = "#eee";    
    context.fillRect(0, 0, canvas.width, canvas.height);

    
    for (var i=0;i<data.length;i++)
    {
	for (var j=0;j<data[0].length;j++)
	{
	    switch(data[i][j])
	    {
		case 1:
		    context.fillStyle = "#000";  
		    context.fillRect(i*blockWidth, j*blockHeight, blockWidth, blockHeight);
		    break;
		case 2:
		    context.fillStyle = "#f00";  
		    context.fillRect(i*blockWidth, j*blockHeight, blockWidth, blockHeight);
		    break;
		case 3:
		    context.fillStyle = "#0f0";  
		    context.fillRect(i*blockWidth, j*blockHeight, blockWidth, blockHeight);
		    break;
		case 4:
		    context.fillStyle = "#00f";  
		    context.fillRect(i*blockWidth, j*blockHeight, blockWidth, blockHeight);
		    break;
	    }
	}
    }
    if (debug)
	console.log("Rendering finished");
}

Renderer.renderPaths = function(canvas,paths,blockWidth=1, blockHeight=1)
{
      var context = canvas.getContext("2d");

      var halfWidth = Math.round(blockWidth/2);
      var halfHeight = Math.round(blockHeight/2);
      
      for (var p=0;p<paths.length;p++)
      {     
	  if (paths[p].complete)
	      context.strokeStyle="#f0f";
	  else
	      context.strokeStyle="#00f";
	  for (var i=paths[p].points.length-2;i>=0;i--)
	  {
	      context.beginPath();
	      context.moveTo(paths[p].offsetX+blockWidth*(paths[p].points[i+1].x)+halfWidth,paths[p].offsetY+blockHeight*(paths[p].points[i+1].y)+halfHeight);
	      context.lineTo(paths[p].offsetX+blockWidth*(paths[p].points[i].x)+halfWidth,paths[p].offsetY+blockHeight*(paths[p].points[i].y)+halfHeight);
	      context.stroke();
	  }
	  
	  var modDotWidth = Math.round(blockWidth/5);
	  var modDotHeight = Math.round(blockHeight/5);
	  
	  for (var i=paths[p].modifications.length-1;i>=0;i--)
	  {
	      if (paths[p].complete)
		  context.fillStyle="#f0f";
	      else
		  context.fillStyle="#00f";
	      context.fillRect(paths[p].modifications[i][0]*blockWidth+paths[p].offsetX+halfWidth-Math.round(modDotWidth/2), paths[p].modifications[i][1]*blockHeight+paths[p].offsetY+halfHeight-Math.round(modDotHeight/2), modDotWidth, modDotHeight);
	  }
      }
}
   