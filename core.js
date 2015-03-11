function Core(width=5,height=5,depth=5,agents=1,updateCountdown=100,activityTime=10000000)
{
    this.debug = true;

    this.numAgents = agents;
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
}

Core.prototype.pause = function()
{
    if (this.debug)
	console.log("paused/unpaused");
    this.paused = !this.paused;
    this.manager.postMessage({msg:"pause"});
}

Core.prototype.run = function(canvas)
{
    var maxWidth = window.innerWidth;
    var maxHeight = window.innerHeight;
    maxWidth = Math.min(maxWidth,maxHeight)/2;
    maxHeight = maxWidth;
    
    var blockWidth = Math.max(1,Math.floor(maxWidth/this.width));
    var blockHeight = Math.max(1,Math.floor(maxHeight/this.depth));
    var renderer = new Renderer(canvas,this.width,this.height,this.depth,blockWidth,blockHeight);
    
    var agentPaths = [];
    for (var i=0;i<this.numAgents;i++)
    {	  
	var offsetX = Math.round(Math.random()*blockWidth/3 - blockWidth/3);
	var offsetY = Math.round(Math.random()*blockHeight/3 - blockHeight/3);
	agentPaths.push(new Path(offsetX,offsetY));
    }
    var world = null;
    
    this.manager.onmessage = function(e){
	if ((e.data.msg==="world") || (e.data.msg==="done"))
	{
	    if (debug)
	    {
		console.log("Recieved data to render");
		console.log(e.data)
	    }

	    world = e.data.world;
	    renderer.renderWorld(world);
	}
	else if (e.data.msg==="agentpath")
	{		
	    if (debug)
		console.log("Recieved path to render");
	    agentPaths[e.data.agent].points = e.data.points;
	    agentPaths[e.data.agent].complete = e.data.complete;
	    agentPaths[e.data.agent].modifications = e.data.modifications;
	    if (world != null)
		renderer.renderWorld(world);
	    renderer.renderPaths(agentPaths)
	}
    };
    
    this.manager.postMessage({msg:"start",numAgents:this.numAgents,width:this.width,height:this.height,depth:this.depth,updateCountdown:this.updateCountdown,activityTime:this.activityTime});
    
    if (debug)
      console.log("Started Manager");
  
}


    


    
    