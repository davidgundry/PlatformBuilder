var debug = 1;

var m = null;

onmessage = function(e){
  if ( e.data.msg === "start" ) {
    Manager.run(e.data.numAgents,e.data.width,e.data.height,,e.data.depth,e.data.updateCountdown,e.data.activityTime);
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
	origin = {x:Math.round(Math.random()*(m.world.length-1)),y:Math.round(Math.random()*(m.world[0].length-1)),z:Math.round(Math.random()*(m.world[0][0].length-1))};
	m.world[origin.x][origin.y][origin.z]=3;
	goal = {x:Math.round(Math.random()*(m.world.length-1)),y:Math.round(Math.random()*(m.world[0].length-1)),z:Math.round(Math.random()*(m.world[0][0].length-1))};
	m.world[goal.x][goal.y][goal.y] = 4;
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
    
    var finished = true;
    for (var i=0;i<this.agents.length;i++)
	if (!this.agents[i].complete)
	{
	    finished = false;
	    break;
	}

    if (finished)
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
	{
	    if (debug>0)
	      console.log("Returning final output");
	    for (var i=0;i<this.agents.length;i++)
	      this.agents[i].stop();
	    postMessage({msg:"done",world:this.world});
	    close();
	}
    }
}

Manager.buildable = function(tile)
{
    if (tile ==0)
      return true;
    return false;
}

Manager.prototype.action = function(actionID,agentID)
{
  switch (actionID)
  {
    case 0:
      this.agents[agentID].position.y--;
      break;
    case 1:
      this.agents[agentID].position.x++;
      break;    
    case 2:
      this.agents[agentID].position.y++;
      break;
    case 3:
      this.agents[agentID].position.x--;
      break;
    case 4:
      if (((this.agents[agentID].position.y-1 < 0) || (this.agents[agentID].position.y-1 >= this.world[0].length)) && (debug>0))
	console.log("ERROR: tried to access world["+this.agents[agentID].position.x+"][" + (this.agents[agentID].position.y-1)+"]");
      else if (Manager.buildable(this.world[this.agents[agentID].position.x][this.agents[agentID].position.y-1]))
	  this.world[this.agents[agentID].position.x][this.agents[agentID].position.y-1] = 2;
      else
	  return false;
      break;
    case 5:
      if (((this.agents[agentID].position.x+1 < 0) || (this.agents[agentID].position.x+1 >= this.world.length)) && (debug>0))
	console.log("ERROR: tried to access world[" + (this.agents[agentID].position.x+1)+"]["+this.agents[agentID].position.y+"]");
      else if (Manager.buildable(this.world[this.agents[agentID].position.x+1][this.agents[agentID].position.y]))
	  this.world[this.agents[agentID].position.x+1][this.agents[agentID].position.y] = 2;
      else
	  return false;
      break;
    case 6:
       if (((this.agents[agentID].position.y+1 < 0) || (this.agents[agentID].position.y+1 >= this.world[0].length)) && (debug>0))
	console.log("ERROR: tried to access world["+this.agents[agentID].position.x+"][" + (this.agents[agentID].position.y+1)+"]");
      else if (Manager.buildable(this.world[this.agents[agentID].position.x][this.agents[agentID].position.y+1]))
	  this.world[this.agents[agentID].position.x][this.agents[agentID].position.y+1] = 2;
      else
	  return false;
      break;
    case 7:
      if (((this.agents[agentID].position.x-1 < 0) || (this.agents[agentID].position.x-1 >= this.world.length)) && (debug>0))
	console.log("ERROR: tried to access world[" + (this.agents[agentID].position.x-1)+"]["+this.agents[agentID].position.y+"]");
      else if (Manager.buildable(this.world[this.agents[agentID].position.x-1][this.agents[agentID].position.y]))
	  this.world[this.agents[agentID].position.x-1][this.agents[agentID].position.y] = 2;
      else
	  return false;
      break;
  }
  return true;
}

Manager.moveUp = function(world)
{
 
  return world;
}

/*Manager.output = function(world)
{
    var html = "";

    for (var i=0;i<world[0].length;i++)
    {
	for (var j=0;j<world.length;j++)
	{
	    switch (world[j][i])
	    {
	      case 0:
		html += "&nbsp;";
		break;
	      case 1:
		html += "▒";
		break;
	      case 2:
		html += "█";
		break;
	      case 3:
		html += "S";
		break;
	      case 4:
		html += "E";
		break;
	    }
	}
	html += "<br />";
    }
    return html;
}*/