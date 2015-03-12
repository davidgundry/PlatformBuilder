PlatformBuilder.Renderer = function(){}

PlatformBuilder.Path = function(offsetX,offsetY)
{
    this.offsetX = offsetX;
    this.offsetY = offsetY;
}

PlatformBuilder.Path.prototype.modifications = [];
PlatformBuilder.Path.prototype.points = [];
PlatformBuilder.Path.prototype.complete = false;

PlatformBuilder.Renderer.Renderer2D = function(canvas,width,height,depth)
{
    var maxWidth = 187;
    
    this.blockWidth = Math.max(1,Math.floor(maxWidth/width));
    this.blockHeight = this.blockWidth;
    
    this.mapWidth = this.blockHeight*depth + 10;
    this.canvas = canvas;
    this.canvas.width= width*this.blockWidth;
    this.canvas.height= this.mapWidth*height;
    this.context = canvas.getContext("2d");
}

PlatformBuilder.Renderer.Renderer2D.prototype.renderWorld = function(data)
{
    if (PlatformBuilder.debug>1)
	console.log("Rendering world");
    this.context.fillStyle = "#333";    
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    
    for (var j=0;j<data[0].length;j++)
    {
	this.context.fillStyle = "#fee";    
	this.context.fillRect(0, this.mapWidth*j, this.blockWidth*data.length, this.blockHeight*data[0].length);
	
	for (var i=0;i<data.length;i++)
	{
	    for (var k=0;k<data[0][0].length;k++)
	    {
		switch(data[i][j][k])
		{
		    case 1:
			this.context.fillStyle = "#000";  
			this.context.fillRect(i*this.blockWidth, k*this.blockHeight + j*this.mapWidth, this.blockWidth, this.blockHeight);
			break;
		    case 2:
			this.context.fillStyle = "#f00";  
			this.context.fillRect(i*this.blockWidth, k*this.blockHeight + j*this.mapWidth, this.blockWidth, this.blockHeight);
			break;
		    case 3:
			this.context.fillStyle = "#0f0";  
			this.context.fillRect(i*this.blockWidth, k*this.blockHeight + j*this.mapWidth, this.blockWidth, this.blockHeight);
			break;
		    case 4:
			this.context.fillStyle = "#00f";  
			this.context.fillRect(i*this.blockWidth, k*this.blockHeight + j*this.mapWidth, this.blockWidth, this.blockHeight);
			break;
		}
	    }
	}
    }
}

PlatformBuilder.Renderer.Renderer2D.prototype.renderPaths = function(paths,blockWidth=1, blockHeight=1)
{
      if (PlatformBuilder.debug>1)
	  console.log("Rendering paths");
      var halfWidth = Math.round(this.blockWidth/2);
      var halfHeight = Math.round(this.blockHeight/2);
      
      var modDotWidth = Math.round(this.blockWidth/5);
      var modDotHeight = Math.round(this.blockHeight/5);
      
      for (var p=0;p<paths.length;p++)
      {     
	  if (paths[p].complete)
	      this.context.strokeStyle="#f0f";
	  else
	      this.context.strokeStyle="#00f";
	  for (var i=paths[p].points.length-2;i>=0;i--)
	  {
	      this.context.beginPath();
	      this.context.moveTo(paths[p].offsetX+this.blockWidth*(paths[p].points[i+1].x)+halfWidth,
				  paths[p].offsetY+this.blockHeight*(paths[p].points[i+1].z)+halfHeight + paths[p].points[i+1].y*this.mapWidth);
	      this.context.lineTo(paths[p].offsetX+this.blockWidth*(paths[p].points[i].x)+halfWidth,
				  paths[p].offsetY+this.blockHeight*(paths[p].points[i].z)+halfHeight + paths[p].points[i].y*this.mapWidth);
	      this.context.stroke();
	  }
	  
	  // Draw a white dot where a path starts
	  if (paths[p].points.length > 0)
	  {
	      this.context.fillStyle="#fff";
	      this.context.fillRect(paths[p].points[paths[p].points.length-1].x*this.blockWidth+paths[p].offsetX+halfWidth-Math.round(modDotWidth/2),
			paths[p].points[paths[p].points.length-1].z*this.blockHeight+paths[p].offsetY+halfHeight-Math.round(modDotHeight/2)  + paths[p].points[paths[p].points.length-1].y*this.mapWidth,
			modDotWidth,
			modDotHeight);
	  }
	  
	  for (var i=paths[p].modifications.length-1;i>=0;i--)
	  {
	      if (paths[p].complete)
		  this.context.fillStyle="#f0f";
	      else
		  this.context.fillStyle="#00f";
	      this.context.fillRect(paths[p].modifications[i][0]*this.blockWidth+paths[p].offsetX+halfWidth-Math.round(modDotWidth/2), 
				    paths[p].modifications[i][2]*this.blockHeight+paths[p].offsetY+halfHeight-Math.round(modDotHeight/2) + paths[p].modifications[i][1]*this.mapWidth, modDotWidth,
				    modDotHeight);
	  }
      }
}
   
   
PlatformBuilder.Renderer.Renderer3D = function(container)
{
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    var width = 1000;
    var height = window.innerHeight-30;
    this.aspectRatio = width / height;
    this.renderer = new THREE.WebGLRenderer({antialias:true});
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);
}
		
PlatformBuilder.Renderer.Renderer3D.prototype.init = function(world) 
{
    if (PlatformBuilder.debug>0)
	console.log("3D Renderer Initialised");
    this.scene = new THREE.Scene();
    
    var angle = 45;
    var near = 0.1;
    var far = 20000;
    
    this.camera = new THREE.PerspectiveCamera(angle, this.aspectRatio, near, far);
    this.scene.add(this.camera);
    this.camera.position.set(0,200,0);
    this.camera.lookAt(this.scene.position);	
    
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff));
    this.createWorld(world);
}

PlatformBuilder.Renderer.Renderer3D.prototype.createWorld = function(world)
{
    var cubeMaterialArray = [];
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xff5500 } ) );
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xff0033 } ) );
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xff3333 } ) );
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xff1111 } ) );
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xff6622 } ) );
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xff3355 } ) );
    var cubeMaterials = new THREE.MeshFaceMaterial(cubeMaterialArray);
    
    var headroomMaterialArray = [];
    headroomMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x666666 } ) );
    headroomMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x999999 } ) );
    headroomMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xcccccc } ) );
    headroomMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x99cc99 } ) );
    headroomMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x669966 } ) );
    headroomMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xcc9966 } ) );
    var headroomMaterials = new THREE.MeshFaceMaterial(headroomMaterialArray);
	
    var goalMaterialArray = [];
    goalMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x3300ff } ) );
    goalMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x0033ff } ) );
    goalMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x3333ff } ) );
    goalMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x0000ff } ) );
    goalMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x6600ff } ) );
    goalMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x0066ff } ) );
    var goalMaterials = new THREE.MeshFaceMaterial(goalMaterialArray);
    
    var originMaterialArray = [];
    originMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x33ff00 } ) );
    originMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x00ff33 } ) );
    originMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x33ff33 } ) );
    originMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) );
    originMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x66ff00 } ) );
    originMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x00ff66 } ) );
    var originMaterials = new THREE.MeshFaceMaterial(originMaterialArray);
    var boxGeometry = new THREE.BoxGeometry( 5, 2, 5, 1, 1, 1 );

    var cube = null;
    
    for (var i=0;i<world.length;i++)
	for (var j=0;j<world[0].length;j++)
	  for (var k=0;k<world[0][0].length;k++)
	    if (world[i][j][k] > 0)
	    {
	      switch (world[i][j][k])
	      {
		  //case -1:
		  //    cube = new THREE.Mesh(boxGeometry,headroomMaterials);
		  //    break;
		  case 2:
		      cube = new THREE.Mesh(boxGeometry,cubeMaterials);
		      break;
		  case 3:
		      cube = new THREE.Mesh(boxGeometry,originMaterials);
		      break;
		  case 4:
		      cube = new THREE.Mesh(boxGeometry,goalMaterials);
		      break;
	      }
	      cube.position.set(5*i, 2*j, 5*k);
	      this.scene.add(cube);
	    }
}

PlatformBuilder.Renderer.Renderer3D.prototype.update = function()
{
    this.controls.update();
}

PlatformBuilder.Renderer.Renderer3D.prototype.render = function() 
{	
    this.renderer.render(this.scene, this.camera);
}
