var debug = false;	

function Renderer()
{
}

Renderer.render = function(canvas,data,blockWidth=1, blockHeight=1)
{
    canvas.width=data.length * blockWidth;
    canvas.height=data[0].length * blockHeight;
    
    var context = canvas.getContext("2d");
    
    context.fillStyle = "#eee";    
    //context.fillRect(0, 0, canvas.width, canvas.height);

    
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

Renderer.renderPath = function(canvas,points,blockWidth=1, blockHeight=1)
{
      var context = canvas.getContext("2d");
      context.strokeStyle="#f00";
	  
      var halfWidth = Math.round(blockWidth/2);
      var halfHeight = Math.round(blockHeight/2);
      
      var offsetX = Math.round(Math.random()*blockWidth/3 - blockWidth/3);
      var offsetY = Math.round(Math.random()*blockHeight/3 - blockHeight/3);
	  
      for (var i=points.length-2;i>=0;i--)
      {
	  context.beginPath();
	  context.moveTo(offsetX+blockWidth*(points[i+1].x)+halfWidth,offsetY+blockHeight*(points[i+1].y)+halfHeight);
	  context.lineTo(offsetX+blockWidth*(points[i].x)+halfWidth,offsetY+blockHeight*(points[i].y)+halfHeight);
	  context.stroke();
      }
}
   