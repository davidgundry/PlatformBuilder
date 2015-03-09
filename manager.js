var debug = false;	

onmessage = function(e){
  if ( e.data === "start" ) {
    Manager.run();
  }
};

function Agent(id,origin,goal)
{
    this.id = id;
    this.planner = new Worker("builder.js");
    this.candidate = null;
    
    this.origin = origin;
    this.position = origin;
    this.goal = goal;
}

Agent.prototype.plan = function(world)
{
    this.planner.postMessage({msg:"start",id:this.id,world:world,origin:this.position,goal:this.goal});
}

function Manager()
{
    this.agents = Array(5);
    this.world = Manager.createWorld(100,100)
}

Manager.run = function()
{
    var m = new Manager();
    var builder;
    var origin;
    var goal;
    for (var i=0;i<m.agents.length;i++)
    {
	origin = {x:Math.round(Math.random()*(m.world.length-1)),y:Math.round(Math.random()*(m.world[0].length-1))};
	m.world[origin.x][origin.y]=3;
	goal = {x:Math.round(Math.random()*(m.world.length-1)),y:Math.round(Math.random()*(m.world[0].length-1))};
	m.world[goal.x][goal.y] = 4;
	m.agents[i] = new Agent(i,origin,goal);
	m.agents[i].planner.onmessage = function(e){
	    if (e.data.msg === "candidate")
		m.gotCandidate(e.data.id,e.data.candidate);
	    };
	m.agents[i].plan(m.world);
    }
    postMessage(m.world);
}

Manager.prototype.rePlanAgents = function()
{
    for (var i=0;i<this.agents.length;i++)
    {
	if (this.agents[i].candidate == null)
	{
	  this.agents[i].plan(this.world);
	  if (debug)
	      console.log("Started replanning agent "+i);
	}
    }
}

Manager.createWorld = function(width,height)
{
  var world = [];
  for (var i=0;i<height;i++)
  {
    world.push([]);
    for (var j=0;j<width;j++)
    {
      world[i][j] = Math.round(Math.random()*0.7);
    }
  }
  
  return world;
}

Manager.prototype.gotCandidate = function(workerIndex,candidate)
{
    if (debug)
    {
	console.log("Agent "+workerIndex+" has a candidate solution");
	console.log(candidate);
    }
    this.agents[workerIndex].candidate = candidate;
	    
    var finished = true;
    for (var i=0;i<this.agents.length;i++)
	if (this.agents[i].candidate == null)
	{
	    finished = false;
	    break;
	}
	
    if (finished)
	this.runAgents();
}

Manager.worldState = function(world,modifications,x,y)
{
  for (var i=0;i<modifications.length;i++)
  {
      if ((modifications[i][0] == x) && (modifications[i][1] == y))
	return true;
  }
  return world[x][y];
}

Manager.prototype.runAgents = function()
{
  var firstToFail = -1;
  var max = 1;
    for (var a=0;a<max;a++)
	for (var i=0;i<this.agents.length;i++)
	  if (this.agents[i].candidate != null)
	  {
	      if (this.agents[i].candidate.length > max)
		max = this.agents[i].candidate.length;
	      if (this.agents[i].candidate.length-1 >= a)
	      {
		  if (!this.action(this.agents[i].candidate[a],i))
		    firstToFail = i;
	      }
	  }
 
    if (firstToFail != -1)
    {
      postMessage(this.world);
      this.agents[firstToFail].candidate = null;
      this.rePlanAgents();
    }
    else
    {
	if (debug)
	  console.log("Returning final output");
	postMessage(this.world);
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
      if ((this.agents[agentID].position.y-1 < 0) || (this.agents[agentID].position.y-1 >= this.world[0].length))
	console.log("ERROR: tried to access world["+this.agents[agentID].position.x+"][" + (this.agents[agentID].position.y-1)+"]");
      else if (Manager.buildable(this.world[this.agents[agentID].position.x][this.agents[agentID].position.y-1]))
	  this.world[this.agents[agentID].position.x][this.agents[agentID].position.y-1] = 2;
      else
	  return false;
      break;
    case 5:
      if ((this.agents[agentID].position.x+1 < 0) || (this.agents[agentID].position.x+1 >= this.world.length))
	console.log("ERROR: tried to access world[" + (this.agents[agentID].position.x+1)+"]["+this.agents[agentID].position.y+"]");
      else if (Manager.buildable(this.world[this.agents[agentID].position.x+1][this.agents[agentID].position.y]))
	  this.world[this.agents[agentID].position.x+1][this.agents[agentID].position.y] = 2;
      else
	  return false;
      break;
    case 6:
       if ((this.agents[agentID].position.y+1 < 0) || (this.agents[agentID].position.y+1 >= this.world[0].length))
	console.log("ERROR: tried to access world["+this.agents[agentID].position.x+"][" + (this.agents[agentID].position.y+1)+"]");
      else if (Manager.buildable(this.world[this.agents[agentID].position.x][this.agents[agentID].position.y+1]))
	  this.world[this.agents[agentID].position.x][this.agents[agentID].position.y+1] = 2;
      else
	  return false;
      break;
    case 7:
      if ((this.agents[agentID].position.x-1 < 0) || (this.agents[agentID].position.x-1 >= this.world.length))
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