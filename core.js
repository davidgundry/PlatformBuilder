function PlatformBuilder(){}

PlatformBuilder.debug = 0;

PlatformBuilder.CoreAgent = function(origin,goal)
{
    this.origin = origin;
    this.goal = goal;
}

PlatformBuilder.Core = function(width,height,depth,updateCountdown,activityTime,canvas,container)
{
    this.debug = true;

    this.width = width;
    this.height = height;
    this.depth = depth;
    /**
     * Planners should send their current best solution every this many steps
     */
    this.updateCountdown = updateCountdown;
    /**
     * The number of milliseconds after which the manager will enact the best plan each agent has provided
     */
    this.activityTime = activityTime;
    
    this.manager = new Worker("manager.js");
    this.paused = false;
    this.canvas = canvas;
    this.container = container;
}

PlatformBuilder.Core.prototype.pause = function()
{
    if (PlatformBuilder.debug>0)
	console.log("paused/unpaused");
    this.paused = !this.paused;
    this.manager.postMessage({msg:"pause"});
}

PlatformBuilder.Core.prototype.run = function(agents)
{
    var renderer = new PlatformBuilder.Renderer.Renderer2D(this.canvas,this.width,this.height,this.depth);
    var renderer3D = new PlatformBuilder.Renderer.Renderer3D(this.container);
    
    var animate = function()
    {
	requestAnimationFrame(animate);
	renderer3D.render();		
	renderer3D.update();
    }
    
    var agentPaths = [];
    for (var i=0;i<agents.length;i++)
    {	  
	var offsetX = Math.round(Math.random()*renderer.blockWidth/3 - renderer.blockWidth/3);
	var offsetY = Math.round(Math.random()*renderer.blockHeight/3 - renderer.blockHeight/3);
	agentPaths.push(new PlatformBuilder.Path(offsetX,offsetY));
    }
    var world = null;
    
    this.manager.onmessage = function(e){
	if ((e.data.msg==="world") || (e.data.msg==="done"))
	{
	    if (PlatformBuilder.debug>1)
	    {
		console.log("Recieved data to render");
	    }

	    world = e.data.world;
	    renderer.renderWorld(world);
	    if (e.data.msg==="done")
	    {
		renderer3D.init(world);
		animate();
	    }
	}
	else if (e.data.msg==="agentpath")
	{		
	    if (PlatformBuilder.debug>1)
		console.log("Recieved path to render");
	    agentPaths[e.data.agent].points = e.data.points;
	    agentPaths[e.data.agent].complete = e.data.complete;
	    agentPaths[e.data.agent].modifications = e.data.modifications;
	    if (world != null)
		renderer.renderWorld(world);
	    renderer.renderPaths(agentPaths)
	}
    };
    
    this.manager.postMessage({msg:"start",agents:agents,width:this.width,height:this.height,depth:this.depth,updateCountdown:this.updateCountdown,activityTime:this.activityTime});
    
    if (PlatformBuilder.debug>1)
      console.log("Started Manager");
  
}


    


    
    