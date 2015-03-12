function PlatformBuilder(){};

PlatformBuilder.debug = 0;

var builder = null

onmessage = function(e){
  if ( e.data.msg === "start" ) {
        if (PlatformBuilder.debug>2)
	console.log("Builder id " + e.data.id + " recieved start message");
    builder = new PlatformBuilder.Builder(e.data.world,e.data.origin,e.data.goal);
    PlatformBuilder.Builder.run(e.data.id,e.data.updateCountdown);
  } 
  else if ( e.data.msg === "continue" ) {
    PlatformBuilder.Builder.run(e.data.id,e.data.updateCountdown);
  }
  else if ( e.data.msg === "stop" ) {
    close();
  }
};

PlatformBuilder.Builder = function(world,origin,goal)
{
  if (PlatformBuilder.debug > 0)
      this.time = performance.now();
  this.world = world;
  this.goal = goal;


  if (!PlatformBuilder.Builder.inWorldBounds(origin.x,origin.y,origin.z,world) && (PlatformBuilder.debug>0))
    console.log("ERROR: Origin " + origin.x +", "+origin.y +", "+origin.z + " not in world bounds.");
  if (!PlatformBuilder.Builder.inWorldBounds(goal.x,goal.y,goal.z,world) && (PlatformBuilder.debug>0))
    console.log("ERROR: Goal " + goal.x +", "+goal.y +", "+goal.z + " not in world bounds.");
  
  this.fringe = [new PlatformBuilder.Builder.Node({p:origin,m:[],e:[]},0,null)];
  this.closedList = [];
  this.currentNode = this.fringe[0];
}

PlatformBuilder.Builder.costWeight = 0.3;
PlatformBuilder.Builder.heuristicWeight = 0.7;
PlatformBuilder.Builder.buildCost = 3;

PlatformBuilder.Builder.prototype.stepNo = 0;

PlatformBuilder.Builder.inWorldBounds = function(x,y,z,world)
{
    return ((x < world.length) && (x >= 0) && (y < world[0].length) && (y >= 0) && (z < world[0][0].length) && (z >= 0));
}

PlatformBuilder.Builder.run = function(id,updateCountdown)
{
    if (PlatformBuilder.debug>2)
	console.log("Builder started on id " + id);
    var countdown = updateCountdown;
    while (countdown >= 0)
    {
	builder.stepNo++;
	if (!builder.step())
	  break;
	if (countdown == 0)
	{
	    var c = PlatformBuilder.Builder.createCandidate(builder.currentNode)
	    countdown=updateCountdown;
	    postMessage({id:id,msg:"current",candidate:c.a,points:c.p,modifications:c.m,empties:c.e});
	    return;
	}
	else
	    countdown--;
    } 
    
    if (PlatformBuilder.Builder.goalTest(builder.currentNode.state,builder.goal))
    {
	if (PlatformBuilder.debug>0)
	{
	    builder.time = performance.now()-builder.time;
	    builder.summary(builder.currentNode,builder.stepNo,builder.time);
	}
	var c = PlatformBuilder.Builder.createCandidate(builder.currentNode)
	postMessage({id:id,msg:"candidate",candidate:c.a,points:c.p,modifications:c.m,empties:c.e});
    }
    else
	console.log("Builder failed to return candidate");
}

PlatformBuilder.Builder.createCandidate = function(currentNode,closedList)
{
    var actions = [];
    var points = [];
    var n = currentNode;
    while (n != null)
    {
	actions.push(n.action);
	points.push(n.state.p);
	n = n.parent;
    }
    return {a:actions,p:points,m:currentNode.state.m,e:currentNode.state.e};
}

PlatformBuilder.Builder.prototype.step = function()
{
    if (PlatformBuilder.debug>1)
	console.log("Fringe length: "+this.fringe.length);
    
    if (this.currentNode != null)
    {
	if (PlatformBuilder.Builder.goalTest(builder.currentNode.state,builder.goal))
	    return false;
	if (PlatformBuilder.debug>1)
	    console.log("p: "+this.currentNode.state.p.x+","+this.currentNode.state.p.y + ","+this.currentNode.state.p.z + " h: "+this.currentNode.heuristic + " m: "+this.currentNode.state.m.length + " e: "+this.currentNode.state.e.length);
	this.fringe.splice(this.fringe.indexOf(this.currentNode),1);
	this.closedList.push(this.currentNode);
	var newNodes = PlatformBuilder.Builder.expand(this.currentNode,PlatformBuilder.Builder.actions,this.goal,this.world);
	for (var i=newNodes.length-1;i>=0;i--)
	{
	  newNodes[i].heuristic = PlatformBuilder.Builder.costWeight*newNodes[i].cost + PlatformBuilder.Builder.heuristicWeight*PlatformBuilder.Builder.heuristic(newNodes[i].state,this.goal);
	  newNodes[i].parent = this.closedList[this.closedList.length-1];
	  for (var j=this.closedList.length-1;j>=0;j--)
	  {
	      if (PlatformBuilder.Builder.Node.equals(newNodes[i],this.closedList[j]))
		if ((newNodes[i].heuristic) >= (this.closedList[j].heuristic))
		{
		    newNodes.splice(i,1);
		    break;
		}
	  }
		
	}
	this.fringe = PlatformBuilder.Builder.sort(this.fringe,newNodes);
	this.currentNode = this.fringe[0];
	return true;
    }
    console.log("Current Node is null");
    return false;
}

PlatformBuilder.Builder.sort = function(fringe,newNodes)
{
    for (var i=newNodes.length-1;i>=0;i--)
    {
	for (var j=fringe.length-1;j>=0;j--)
	{
	    if (PlatformBuilder.Builder.Node.equals(newNodes[i],fringe[j]))
	    {
		if ((newNodes[i].heuristic) < (fringe[j].heuristic))
		    fringe.splice(j,1);
		else
		{
		    newNodes.splice(i,1);
		    break;
		}
	    }
	}
    }
    
    fringe = fringe.concat(newNodes);
    fringe = fringe.sort(function(a,b){return (a.heuristic)-(b.heuristic);});
    
    return fringe;
}

PlatformBuilder.Builder.expand = function(node,actions,goal,world)
{
    var children = [];
    for (var i=0;i<actions.length;i++)
    {
	var child = actions[i](node,world);
	if (child != null)
	{
	    children.push(child);
	}
    }
    if (PlatformBuilder.debug>1)
	console.log("Added "+children.length+" nodes");
    return children;
}

PlatformBuilder.Builder.goalTest = function(state,goal)
{
  return ((state.p.x==goal.x) && (state.p.y==goal.y) && (state.p.z==goal.z));
}

PlatformBuilder.Builder.Node = function(state,cost,action)
{
    this.state = state;
    this.cost = cost;
    this.action = action;
}

PlatformBuilder.Builder.Node.equals = function(n1,n2)
{
  return ((n1.state.p.x == n2.state.p.x) && (n1.state.p.y == n2.state.p.y) && (n1.state.p.z == n2.state.p.z) && (n1.state.m == n2.state.m));
}

PlatformBuilder.Builder.Node.prototype.heuristic = 0;
PlatformBuilder.Builder.Node.prototype.parent = null;

PlatformBuilder.Builder.heuristic = function(state,goal)
{
    var xdiff = goal.x - state.p.x;
    var ydiff = goal.y - state.p.y;
    var zdiff = goal.z - state.p.z;
    //return Math.sqrt(xdiff*xdiff+ydiff*ydiff);//* (0.5+Math.random()*0.5);
    return Math.abs(xdiff)+Math.abs(ydiff)+Math.abs(zdiff);
}

PlatformBuilder.Builder.walkable = function(world,modifications,x,y,z)
{
    if (!PlatformBuilder.Builder.inWorldBounds(x,y,z,world))
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
    if (!headroom)
	return false;
    else
	for (var i=0;i<modifications.length;i++)
	{
	    if ((modifications[i][0] == x) && (modifications[i][1] == y) && (modifications[i][2] == z))
		floor = true;
	    if ((modifications[i][0] == x) && (modifications[i][1] == y+1) && (modifications[i][2] == z))
		headroom = false;
	    if ((modifications[i][0] == x) && (modifications[i][1] == y+2) && (modifications[i][2] == z))
		headroom = false;
	}
	
    return (floor && headroom);
}

PlatformBuilder.Builder.buildable = function(world,modifications,empties,x,y,z)
{
  if (PlatformBuilder.Builder.inWorldBounds(x,y,z,world))
  {
      for (var i=0;i<modifications.length;i++)
      {
	  if ((modifications[i][0] == x) && (modifications[i][1] == y) && (modifications[i][2] == z))
	    return false;
      }
      for (var i=0;i<empties.length;i++)
      {
	  if ((empties[i][0] == x) && (empties[i][1] == y) && (empties[i][2] == z))
	    return false;
      }
      return (world[x][y][z]==0);
  }
  return false;
}

PlatformBuilder.Builder.moveBy = function(node,world,x,z,actionCode)
{
    var n = [];
    if (PlatformBuilder.Builder.walkable(world,node.state.m,node.state.p.x+x,node.state.p.y,node.state.p.z+z))
    {
      var p = {x:node.state.p.x+x,y:node.state.p.y,z:node.state.p.z+z};
      for (var i=0;i<node.state.e.length;i++)
	  n.push(node.state.e[i]);
      n.push([node.state.p.x+x,node.state.p.y+1,node.state.p.z+z]);
      n.push([node.state.p.x+x,node.state.p.y+2,node.state.p.z+z]);
      return new PlatformBuilder.Builder.Node({p:p,m:node.state.m,e:n},node.cost+1,actionCode);
    }
    else if (PlatformBuilder.Builder.walkable(world,node.state.m,node.state.p.x+x,node.state.p.y-1,node.state.p.z+z))
    {
      var p = {x:node.state.p.x+x,y:node.state.p.y-1,z:node.state.p.z+z};
      for (var i=0;i<node.state.e.length;i++)
	  n.push(node.state.e[i]);
      n.push([node.state.p.x+x,node.state.p.y,node.state.p.z+z]);
      n.push([node.state.p.x+x,node.state.p.y+2,node.state.p.z+z]);
      n.push([node.state.p.x+x,node.state.p.y+3,node.state.p.z+z]);
      return new PlatformBuilder.Builder.Node({p:p,m:node.state.m,e:n},node.cost+1,actionCode);
    }
    else if (PlatformBuilder.Builder.walkable(world,node.state.m,node.state.p.x+x,node.state.p.y+1,node.state.p.z+z))
    {
      var p = {x:node.state.p.x+x,y:node.state.p.y+1,z:node.state.p.z+z};
      for (var i=0;i<node.state.e.length;i++)
	  n.push(node.state.e[i]);
      n.push([node.state.p.x+x,node.state.p.y+1,node.state.p.z+z]);
      n.push([node.state.p.x+x,node.state.p.y+2,node.state.p.z+z]);
      n.push([node.state.p.x+x,node.state.p.y+3,node.state.p.z+z]);
      return new PlatformBuilder.Builder.Node({p:p,m:node.state.m,e:n},node.cost+1,actionCode);
    }
    return null;
}

PlatformBuilder.Builder.buildDirection = function(node,world,x,y,z,actionCode)
{
    if (PlatformBuilder.Builder.buildable(world,node.state.m,node.state.e,node.state.p.x+x,node.state.p.y+y,node.state.p.z+z))
    {
	var n = [];
	for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	n.push([node.state.p.x+x,node.state.p.y+y,node.state.p.z+z]);
	return new PlatformBuilder.Builder.Node({p:node.state.p,m:n,e:node.state.e},node.cost+PlatformBuilder.Builder.buildCost,actionCode);
    }
    return null;
}

PlatformBuilder.Builder.moveUp = function(node,world)
{
    return PlatformBuilder.Builder.moveBy(node,world,0,-1,0);
}

PlatformBuilder.Builder.moveRight = function(node,world)
{
    return PlatformBuilder.Builder.moveBy(node,world,1,0,1);
}

PlatformBuilder.Builder.moveDown = function(node,world)
{
    return PlatformBuilder.Builder.moveBy(node,world,0,1,2);
}

PlatformBuilder.Builder.moveLeft = function(node,world)
{
    return PlatformBuilder.Builder.moveBy(node,world,-1,0,3);
}

PlatformBuilder.Builder.buildUp = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,0,0,-1,4);
}

PlatformBuilder.Builder.buildRight = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,1,0,0,5);
}

PlatformBuilder.Builder.buildDown = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,0,0,1,6);
}

PlatformBuilder.Builder.buildLeft = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,-1,0,0,7);
}

PlatformBuilder.Builder.buildStepUp = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,0,1,-1,8);
}

PlatformBuilder.Builder.buildStepRight = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,1,1,0,9);
}

PlatformBuilder.Builder.buildStepDown = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,0,1,1,10);
}

PlatformBuilder.Builder.buildStepLeft = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,-1,1,0,11);
}

PlatformBuilder.Builder.buildDropUp = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,0,-1,-1,12);
}

PlatformBuilder.Builder.buildDropRight = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,1,-1,0,13);
}

PlatformBuilder.Builder.buildDropDown = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,0,-1,1,14);
}

PlatformBuilder.Builder.buildDropLeft = function(node,world)
{
    return PlatformBuilder.Builder.buildDirection(node,world,-1,-1,0,15);
}

/**
 * moveUp = 0
 * moveRight = 1
 * moveDown = 2
 * moveLeft = 3
 * buildUp = 4
 * buildRight = 5
 * buildDown = 6
 * buildLeft = 7
 * buildStepUp = 8
 * buildStepRight = 9
 * buildStepDown = 10
 * buildStepLeft = 11
 * buildDropUp = 8
 * buildDropRight = 9
 * buildDropDown = 10
 * buildDropLeft = 11
 */
PlatformBuilder.Builder.actions = [PlatformBuilder.Builder.moveRight,PlatformBuilder.Builder.moveLeft,PlatformBuilder.Builder.moveUp,PlatformBuilder.Builder.moveDown,PlatformBuilder.Builder.buildRight,PlatformBuilder.Builder.buildLeft,PlatformBuilder.Builder.buildUp,PlatformBuilder.Builder.buildDown,PlatformBuilder.Builder.buildStepRight,PlatformBuilder.Builder.buildStepLeft,PlatformBuilder.Builder.buildStepUp,PlatformBuilder.Builder.buildStepDown,PlatformBuilder.Builder.buildDropRight,PlatformBuilder.Builder.buildDropLeft,PlatformBuilder.Builder.buildDropUp,PlatformBuilder.Builder.buildDropDown];


PlatformBuilder.Builder.prototype.summary = function(solution,steps,time)
{
  if (solution != null)
  {
    if (solution.state != null)
      console.log(time + "ms Solution: p x:"+solution.state.p.x+" y:"+solution.state.p.y + " z:"+solution.state.p.z +" in "+steps+" steps. Fringe length: "+ this.fringe.length + ". Closed list length: "+ this.closedList.length);
  }
  else
    console.log("Failure. Fringe length: "+ this.fringe.length + ". Closed list length: "+ this.closedList.length);

}