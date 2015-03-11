var debug = 0;	

function Path(offsetX,offsetY)
{
    this.offsetX = offsetX;
    this.offsetY = offsetY;
}

Path.prototype.modifications = [];
Path.prototype.points = [];
Path.prototype.complete = false;

function Renderer(canvas,width,height,depth,blockWidth=1, blockHeight=1)
{
    this.mapWidth = blockWidth*width + 100;
    this.blockWidth = blockWidth;
    this.blockHeight = blockHeight;
    this.canvas = canvas;
    this.canvas.width= this.mapWidth*height;
    this.canvas.height= depth*blockHeight;
    this.context = canvas.getContext("2d");
}

Renderer.prototype.renderWorld = function(data)
{
    this.context.fillStyle = "#eee";    
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    
    for (var j=0;j<data[0].length;j++)
    {
	this.context.fillStyle = "#fee";    
	this.context.fillRect(this.mapWidth*j, 0, this.blockWidth*data.length, this.canvas.height);
	
	for (var i=0;i<data.length;i++)
	{
	    for (var k=0;k<data[0][0].length;k++)
	    {
		switch(data[i][j][k])
		{
		    case 1:
			this.context.fillStyle = "#000";  
			this.context.fillRect(i*this.blockWidth + j*this.mapWidth, k*this.blockHeight, this.blockWidth, this.blockHeight);
			break;
		    case 2:
			this.context.fillStyle = "#f00";  
			this.context.fillRect(i*this.blockWidth + j*this.mapWidth, k*this.blockHeight, this.blockWidth, this.blockHeight);
			break;
		    case 3:
			this.context.fillStyle = "#0f0";  
			this.context.fillRect(i*this.blockWidth + j*this.mapWidth, k*this.blockHeight, this.blockWidth, this.blockHeight);
			break;
		    case 4:
			this.context.fillStyle = "#00f";  
			this.context.fillRect(i*this.blockWidth + j*this.mapWidth, k*this.blockHeight, this.blockWidth, this.blockHeight);
			break;
		}
	    }
	}
    }
    if (debug>0)
	console.log("Rendering finished");
}

Renderer.prototype.renderPaths = function(paths,blockWidth=1, blockHeight=1)
{
      var halfWidth = Math.round(this.blockWidth/2);
      var halfHeight = Math.round(this.blockHeight/2);
      
      for (var p=0;p<paths.length;p++)
      {     
	  if (paths[p].complete)
	      this.context.strokeStyle="#f0f";
	  else
	      this.context.strokeStyle="#00f";
	  for (var i=paths[p].points.length-2;i>=0;i--)
	  {
	      this.context.beginPath();
	      this.context.moveTo(paths[p].offsetX+this.blockWidth*(paths[p].points[i+1].x)+halfWidth + paths[p].points[i+1].y*this.mapWidth,paths[p].offsetY+blockHeight*(paths[p].points[i+1].z)+halfHeight);
	      this.context.lineTo(paths[p].offsetX+this.blockWidth*(paths[p].points[i].x)+halfWidth + +halfWidth + paths[p].points[i].y*this.mapWidth,paths[p].offsetY+blockHeight*(paths[p].points[i].z)+halfHeight);
	      this.context.stroke();
	  }
	  
	  var modDotWidth = Math.round(this.blockWidth/5);
	  var modDotHeight = Math.round(this.blockHeight/5);
	  
	  for (var i=paths[p].modifications.length-1;i>=0;i--)
	  {
	      if (paths[p].complete)
		  this.context.fillStyle="#f0f";
	      else
		  this.context.fillStyle="#00f";
	      this.context.fillRect(paths[p].modifications[i][0]*this.blockWidth+paths[p].offsetX+halfWidth-Math.round(modDotWidth/2), paths[p].modifications[i][2]*this.blockHeight+paths[p].offsetY+halfHeight-Math.round(modDotHeight/2), modDotWidth, modDotHeight);
	  }
      }
}
   