var debug = true;	

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
    this.position = this.origin;
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
    var builder,origin,goal;
    for (var i=0;i<m.agents.length;i++)
    {
	m.agents[i] = new Agent(i,{x:Math.round(Math.random()*(m.world.length-1)),y:Math.round(Math.random()*(m.world[0].length-1))},{x:Math.round(Math.random()*(m.world.length-1)),y:Math.round(Math.random()*(m.world[0].length-1))});
	m.agents[i].planner.onmessage = function(e){
	    if (e.data.msg === "candidate")
		m.gotCandidate(e.data.id,e.data.candidate);
	    };
	m.agents[i].plan(m.world);
    }
}

Manager.prototype.startNullCandidates = function()
{
    var n=0;
    for (var i=0;i<this.agents.length;i++)
    {
	if (this.agents[i] == null)
	{
	  this.agents[i].plan(this.world);
	  n++;
	}
    }
    if (debug)
      console.log("Started "+n+" agent planners");
}

Manager.createWorld = function(width,height)
{
  var world = [];
  for (var i=0;i<height;i++)
  {
    world.push([]);
    for (var j=0;j<width;j++)
    {
      world[i][j] = Math.round(Math.random());
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
	this.runCandidates();
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

Manager.prototype.runCandidates = function()
{
  var firstToFail = -1;
    for (var a=0;a<1000;a++)
	for (var i=0;i<this.agents.length;i++)
	  if (this.agents[i].candidate != null)
	      if (this.agents[i].candidate.length-1 >= a)
	      {
		  if (!this.action(this.agents[i].candidate[a],i))
		    firstToFail = i;
	      }
 
    if (firstToFail != -1)
    {
      this.candidates[failedCandidate] = null;
      this.startNullCandidates();
    }
    else
    {
	if (debug)
	  console.log("Returning final output");
	postMessage(Manager.output(this.world));
    }
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
      this.world[this.agents[agentID].position.x][this.agents[agentID].position.y-1] = 2;
      break;
    case 5:
      this.world[this.agents[agentID].position.x+1][this.agents[agentID].position.y] = 2;
      break;
    case 5:
      this.world[this.agents[agentID].position.x][this.agents[agentID].position.y+1] = 2;
      break;
    case 5:
      this.world[this.agents[agentID].position.x-1][this.agents[agentID].position.y] = 2;
      break;
  }
  return true;
}

Manager.moveUp = function(world)
{
 
  return world;
}

Manager.output = function(world)
{
    var html = "";

    for (var i=0;i<world.length;i++)
    {
	for (var j=0;j<world[0].length;j++)
	{
	    switch (world[i][j])
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
	    }
	}
	html += "<br />";
    }
    return html;
}