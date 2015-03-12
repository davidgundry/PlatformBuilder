var debug = 1;

var m = null;

onmessage = function(e){
  if ( e.data.msg === "start" ) {
    Manager.run(e.data.numAgents,e.data.width,e.data.height,e.data.depth,e.data.updateCountdown,e.data.activityTime);
  }
  else if ( e.data.msg === "pause" ) {
    m.pause();
  }
};

function Agent(id,origin,goal)
{
    this.id = id;   
    this.origin = origin;
    this.position = {x:this.origin.x,y:this.origin.y,z:this.origin.z};
    this.goal = goal;
}

Agent.prototype.points = [];
Agent.prototype.modifications = [];
Agent.prototype.complete = false;
Agent.prototype.planner = null;
Agent.prototype.candidate = null;

Agent.prototype.plan = function(world,updateCountdown)
{
    this.planner.postMessage({msg:"start",id:this.id,world:world,origin:this.position,goal:this.goal,updateCountdown:updateCountdown});
}

Agent.prototype.stop = function()
{
    this.planner.postMessage({msg:"stop"});
}

Agent.createPlanner = function(m)
{
      var planner = new Worker("builder.js");
      planner.onmessage = function(e){
	  if (e.data.msg === "candidate")
	  {
	      m.gotCandidate(e.data.id,e.data.candidate,e.data.points,e.data.modifications,true);    postMessage({msg:"agentpath",agent:e.data.id,points:e.data.points,modifications:e.data.modifications,complete:true});
	  }
	  else if (e.data.msg === "current")
	  {
	      m.gotCandidate(e.data.id,e.data.candidate,e.data.points,e.data.modifications,false);
	      postMessage({msg:"agentpath",agent:e.data.id,points:e.data.points,modifications:e.data.modifications,complete:false});
	      if (!m.paused)
		  planner.postMessage({msg:"continue",id:e.data.id,updateCountdown:m.updateCountdown});
	  }
      };
      return planner;
}

function Manager(numAgents,width,height,depth)
{
    this.agents = Array(numAgents);
    this.world = Manager.createWorld(width,height,depth)
}

Manager.prototype.paused = false;

Manager.run = function(numAgents,width,height,depth,updateCountdown,activityTime)
{
    m = new Manager(numAgents,width,height,depth);
    m.updateCountdown = updateCountdown;
    var builder;
    var origin;
    var goal;
    for (var i=0;i<m.agents.length;i++)
    {
	origin = {x:Math.round(Math.random()*(m.world.length-1)),
	  y:0,//Math.round(Math.random()*(m.world[0].length-1)),
	  z:Math.round(Math.random()*(m.world[0][0].length-1))};
	m.world[origin.x][origin.y][origin.z]=3;
	goal = {x:Math.round(Math.random()*(m.world.length-1)),
	  y:4,//Math.round(Math.random()*(m.world[0].length-1)),
	  z:Math.round(Math.random()*(m.world[0][0].length-1))};
	m.world[goal.x][goal.y][goal.z] = 4;
	m.agents[i] = new Agent(i,origin,goal);
	m.agents[i].planner = Agent.createPlanner(m);
	m.agents[i].plan(m.world,updateCountdown);
    }
    postMessage({msg:"world",world:m.world});
    setInterval(function() {
      m.runAgents();
    },activityTime);
}

Manager.prototype.pause = function()
{
    if (debug>0)
	console.log("Manager paused/unpaused");
    this.paused = !this.paused;
}

Manager.prototype.rePlanAgents = function()
{
    for (var i=0;i<this.agents.length;i++)
    {
	if (this.agents[i].candidate == null)
	{
	    this.agents[i].complete = false;
	    this.agents[i].plan(this.world,this.updateCountdown);
	    if (debug>1)
		console.log("Started replanning agent "+i);
	}
	else if (!this.agents[i].complete)
	{
	    //if (this.agents[i].planner != null)
		//this.agents[i].planner.terminate();  
	    //this.agents[i].planner = Agent.createPlanner(this);
	    this.agents[i].candidate = null;
	    this.agents[i].plan(this.world,this.updateCountdown);
	    if (debug>1)
		console.log("Continued planning agent "+i);
	}
    }
}

Manager.createWorld = function(width,height,depth)
{
  var world = [];
  for (var i=0;i<width;i++)
  {
      world.push([]);
      for (var j=0;j<height;j++)
      {
	  world[i].push([]);
	  for (var k=0;k<depth;k++)
	  {
	      world[i][j][k] = 0;//Math.min(1,Math.round(Math.random()*4*(j/height)*(j/height)));
	  }
      }
  }
  
  return world;
}

Manager.prototype.gotCandidate = function(workerIndex,candidate,points,modifications,complete)
{
    this.agents[workerIndex].candidate = candidate;
    this.agents[workerIndex].points = points;
    this.agents[workerIndex].modifications = modifications;
    this.agents[workerIndex].complete = complete;
	    
    if (debug>1)
    {
	if (complete)
	    console.log("Agent "+workerIndex+" has a candidate solution");
	else
	    console.log("Agent "+workerIndex+" has a current-best solution");
    }
    
    if (Manager.agentsAllComplete(this.agents))
	this.runAgents();
}

Manager.worldState = function(world,modifications,x,y,z)
{
  for (var i=0;i<modifications.length;i++)
  {
      if ((modifications[i][0] == x) && (modifications[i][1] == y) && (modifications[i][z] == z))
	return true;
  }
  return world[x][y][z];
}

Manager.agentsAllComplete = function(agents)
{
    var allComplete = true;
    for (var i=0;i<agents.length;i++)
    {
	if (!agents[i].complete)
	{
	  allComplete = false;
	  break;
	}
    }
    return allComplete;
}

Manager.prototype.runAgents = function()
{
    if (!this.paused)
    {
	var firstToFail = -1;
	var stillActive = true;
	while ((firstToFail == -1) && (stillActive))
	{
	    stillActive = false;
	    for (var i=0;i<this.agents.length;i++)
		if (this.agents[i].candidate != null)
		{
		    if (this.agents[i].candidate.length > 0)
		    {
			if (!this.action(this.agents[i].candidate.pop(),i))
			{
			    firstToFail = i;
			    break;
			}
			else
			    stillActive = true;
		    }
		}
	}
    
	if (firstToFail != -1)
	{
	    postMessage({msg:"world",world:this.world});
	    this.agents[firstToFail].candidate = null;
	    this.rePlanAgents();
	}
	else if (!Manager.agentsAllComplete(this.agents))
	{
	    postMessage({msg:"world",world:this.world});
	    this.rePlanAgents();
	}
	else
	    this.complete();
    }
}

Manager.prototype.complete = function()
{
    if (debug>0)
	console.log("Returning final output");
    for (var i=0;i<this.agents.length;i++)
	this.agents[i].stop();
    postMessage({msg:"done",world:this.world});
    close();
}

Manager.inWorldBounds = function(x,y,z,world)
{
    return ((x < world.length) && (x >= 0) && (y < world[0].length) && (y >= 0) && (z < world[0][0].length) && (z >= 0));
}

Manager.walkable = function(world,x,y,z)
{
    if (!Manager.inWorldBounds(x,y,z,world))
      return false;
    
    var floor = false;
    var headroom = true;

    if (world[x][y][z]>0)
	floor = true;
    if (y+1<world[0].length)
	if (world[x][y+1][z]>0)
	    headroom = false;
    if (y+2<world[0].length)  
	if (world[x][y+2][z]>0)
	    headroom = false;
	
    return (floor && headroom);
}

Manager.buildable = function(world,x,y,z)
{
    if (!Manager.inWorldBounds(x,y,z,world))
      return false;
    
    if ((z >= 0) && (z < world[0][0].length))
      	return world[x][y][z] == 0;
    else if (debug>0)
	console.log("ERROR: tried to access world["+x+"]["+y+"][" +z+"]");
    return false;
}

Manager.prototype.action = function(actionID,agentID)
{
    switch (actionID)
    {
	case 0:
	    if (!this.moveUp(agentID))
		return false;
	    break;
	case 1:
	    if (!this.moveRight(agentID))
		return false;
	    break;
	case 2:
	    if (!this.moveDown(agentID))
		return false;
	    break;
	case 3:
	    if (!this.moveLeft(agentID))
		return false;
	    break;
	case 4:
	    if (!this.buildUp(agentID))
		return false;
	    break;
	case 5:
	    if (!this.buildRight(agentID))
		return false;
	    break;
	case 6:
	    if (!this.buildDown(agentID))
		return false;
	    break;
	case 7:
	    if (!this.buildLeft(agentID))
		return false;
	    break;
	case 8:
	    if (!this.buildStepUp(agentID))
	      return false;
	    break;
	case 9:
	    if (!this.buildStepRight(agentID))
	      return false;
	    break;
	case 10:
	    if (!this.buildStepDown(agentID))
	      return false;
	    break;
	case 11:
	    if (!this.buildStepLeft(agentID))
	      return false;
	    break;
    }
    return true;
}

Manager.prototype.moveBy = function(agentID,x,z)
{
    if (Manager.walkable(this.world,this.agents[agentID].position.x+x,this.agents[agentID].position.y,this.agents[agentID].position.z+z))
    {
      	this.agents[agentID].position.x+=x;
	this.agents[agentID].position.z+=z;
    }
    else if (Manager.walkable(this.world,this.agents[agentID].position.x+x,this.agents[agentID].position.y-1,this.agents[agentID].position.z+z))
    {
	this.agents[agentID].position.x+=x;
	this.agents[agentID].position.z+=z;
	this.agents[agentID].position.y--;
    }
    else if (Manager.walkable(this.world,this.agents[agentID].position.x+x,this.agents[agentID].position.y+1,this.agents[agentID].position.z+z))
    {
      	this.agents[agentID].position.x+=x;
	this.agents[agentID].position.z+=z;
	this.agents[agentID].position.y++;
    }
    else
      return false;
    this.keepClear(this.agents[agentID].position.x,this.agents[agentID].position.y+1,this.agents[agentID].position.z);
    this.keepClear(this.agents[agentID].position.x,this.agents[agentID].position.y+2,this.agents[agentID].position.z);
    return true;
}

Manager.prototype.keepClear = function(x,y,z)
{
    if (Manager.inWorldBounds(x,y,z,this.world))
    {
	this.world[x][y][z] = -1;
    }
}

Manager.prototype.buildDirection = function(agentID,x,y,z)
{
    if (Manager.buildable(this.world,this.agents[agentID].position.x+x,this.agents[agentID].position.y+y,this.agents[agentID].position.z+z))
    {
	this.world[this.agents[agentID].position.x+x][this.agents[agentID].position.y+y][this.agents[agentID].position.z+z] = 2;
	return true;
    }
    return false; 
}

Manager.prototype.moveUp = function(agentID)
{
    return this.moveBy(agentID,0,-1);
}

Manager.prototype.moveRight = function(agentID)
{
    return this.moveBy(agentID,1,0);
}

Manager.prototype.moveDown = function(agentID)
{
    return this.moveBy(agentID,0,1);
}

Manager.prototype.moveLeft = function(agentID)
{
    return this.moveBy(agentID,-1,0);
}

Manager.prototype.buildUp = function(agentID)
{
    return this.buildDirection(agentID,0,0,-1);
}

Manager.prototype.buildRight = function(agentID)
{
    return this.buildDirection(agentID,1,0,0);
}

Manager.prototype.buildDown = function(agentID)
{
    return this.buildDirection(agentID,0,0,1);
}

Manager.prototype.buildLeft = function(agentID)
{
    return this.buildDirection(agentID,-1,0,0);
}

Manager.prototype.buildStepUp = function(agentID)
{
    return this.buildDirection(agentID,0,1,-1);
}

Manager.prototype.buildStepRight = function(agentID)
{
    return this.buildDirection(agentID,1,1,0);
}

Manager.prototype.buildStepDown = function(agentID)
{
    return this.buildDirection(agentID,0,1,1);
}

Manager.prototype.buildStepLeft = function(agentID)
{
    return this.buildDirection(agentID,-1,1,0);
}