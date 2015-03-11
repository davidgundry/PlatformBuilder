var debug = 1;	

var builder = null

onmessage = function(e){
  if ( e.data.msg === "start" ) {
    builder = new Builder(e.data.world,e.data.origin,e.data.goal);
    Builder.run(e.data.id,e.data.updateCountdown);
  } 
  else if ( e.data.msg === "continue" ) {
    Builder.run(e.data.id,e.data.updateCountdown);
  }
  else if ( e.data.msg === "stop" ) {
    close();
  }
};

function Builder(world,origin,goal)
{
  if (debug > 0)
      this.time = performance.now();
  this.world = world;
  this.goal = goal;


  if (!Builder.inWorldBounds(origin.x,origin.y,origin.z,world) && (debug>0))
    console.log("ERROR: Origin " + origin.x +", "+origin.y +", "+origin.z + " not in world bounds.");
  if (!Builder.inWorldBounds(goal.x,goal.y,goal.z,world) && (debug>0))
    console.log("ERROR: Goal " + goal.x +", "+goal.y +", "+goal.z + " not in world bounds.");
  
  this.fringe = [new Builder.Node({p:origin,m:[]},0,null)];
  this.closedList = [];
  this.currentNode = this.fringe[0];
}
Builder.prototype.stepNo = 0;

Builder.inWorldBounds = function(x,y,z,world)
{
    return ((x < world.length) && (x >= 0) && (y < world[0].length) && (y >= 0) && (z < world[0][0].length) && (z >= 0));
}

Builder.run = function(id,updateCountdown)
{
    var countdown = updateCountdown;
    while (countdown >= 0)
    {
	builder.stepNo++;
	if (Builder.goalTest(builder.currentNode.state,builder.goal))
	  break;
	builder.step();
	if (countdown == 0)
	{
	    var c = Builder.createCandidate(builder.currentNode)
	    countdown=updateCountdown;
	    postMessage({id:id,msg:"current",candidate:c.a,points:c.p,modifications:c.m});
	    return;
	}
	else
	    countdown--;
    } 
    
    if (Builder.goalTest(builder.currentNode.state,builder.goal))
    {
	if (debug>0)
	{
	    builder.time = performance.now()-builder.time;
	    builder.summary(builder.currentNode,builder.stepNo,builder.time);
	}
	var c = Builder.createCandidate(builder.currentNode)
	postMessage({id:id,msg:"candidate",candidate:c.a,points:c.p,modifications:c.m});
	close();
    }
    else
	console.log("Builder failed to return candidate");
}

Builder.createCandidate = function(currentNode,closedList)
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
    return {a:actions,p:points,m:currentNode.state.m};
}

Builder.prototype.step = function()
{
    if (debug>1)
	console.log("Fringe length: "+this.fringe.length);
    
    if (this.currentNode != null)
    {
	if (debug>1)
	    console.log("p: "+this.currentNode.state.p.x+","+this.currentNode.state.p.y + ","+this.currentNode.state.p.z + " h: "+this.currentNode.heuristic + " m: "+this.currentNode.state.m.length);
	this.fringe.splice(this.fringe.indexOf(this.currentNode),1);
	this.closedList.push(this.currentNode);
	var newNodes = Builder.expand(this.currentNode,Builder.actions,this.goal,this.world);
	for (var i=newNodes.length-1;i>=0;i--)
	{
	  newNodes[i].heuristic = newNodes[i].cost + Builder.heuristic(newNodes[i].state,this.goal);
	  newNodes[i].parent = this.closedList[this.closedList.length-1];
	  for (var j=this.closedList.length-1;j>=0;j--)
	  {
	      if (Builder.Node.equals(newNodes[i],this.closedList[j]))
		if ((newNodes[i].heuristic) >= (this.closedList[j].heuristic))
		{
		    newNodes.splice(i,1);
		    break;
		}
	  }
		
	}
	this.fringe = Builder.sort(this.fringe,newNodes);
	this.currentNode = this.fringe[0];
    }
}

Builder.sort = function(fringe,newNodes)
{
    for (var i=newNodes.length-1;i>=0;i--)
    {
	for (var j=fringe.length-1;j>=0;j--)
	{
	    if (Builder.Node.equals(newNodes[i],fringe[j]))
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

Builder.expand = function(node,actions,goal,world)
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
    if (debug>1)
	console.log("Added "+children.length+" nodes");
    return children;
}

Builder.goalTest = function(state,goal)
{
  return ((state.p.x==goal.x) && (state.p.y==goal.y) && (state.p.z==goal.z));
}

Builder.Node = function(state,cost,action)
{
    this.state = state;
    this.cost = cost;
    this.action = action;
}

Builder.Node.equals = function(n1,n2)
{
  return ((n1.state.p.x == n2.state.p.x) && (n1.state.p.y == n2.state.p.y) && (n1.state.p.z == n2.state.p.z) && (n1.state.m == n2.state.m));
}

Builder.Node.prototype.heuristic = 0;
Builder.Node.prototype.parent = null;

Builder.heuristic = function(state,goal)
{
    var xdiff = goal.x - state.p.x;
    var ydiff = goal.y - state.p.y;
    var zdiff = goal.z - state.p.z;
    //return Math.sqrt(xdiff*xdiff+ydiff*ydiff);//* (0.5+Math.random()*0.5);
    return Math.abs(xdiff)+Math.abs(ydiff)+Math.abs(zdiff);
}

Builder.walkable = function(world,modifications,x,y,z)
{
  for (var i=0;i<modifications.length;i++)
  {
      if ((modifications[i][0] == x) && (modifications[i][1] == y) && (modifications[i][2] == z))
	return true;
  }
  return (!world[x][y][z]==0);
}

Builder.moveUp = function(node,world)
{
    if (node.state.p.z > 0)
	if (Builder.walkable(world,node.state.m,node.state.p.x,node.state.p.y,node.state.p.z-1))
	{
	  var p = {x:node.state.p.x,y:node.state.p.y,z:node.state.p.z-1};
	  return new Builder.Node({p:p,m:node.state.m},node.cost+1,0);
	}
    return null;
}

Builder.moveRight = function(node,world)
{
    if (node.state.p.x < world.length-1)
	if (Builder.walkable(world,node.state.m,node.state.p.x+1,node.state.p.y,node.state.p.z))
	{
	  var p = {x:node.state.p.x+1,y:node.state.p.y,z:node.state.p.z};
	  return new Builder.Node({p:p,m:node.state.m},node.cost+1,1);
	}
    return null;
}

Builder.moveDown = function(node,world)
{
    if (node.state.p.z < world[0][0].length-1)
	if (Builder.walkable(world,node.state.m,node.state.p.x,node.state.p.y,node.state.p.z+1))
	{
	  var p = {x:node.state.p.x,y:node.state.p.y,z:(node.state.p.z+1)};
	  return new Builder.Node({p:p,m:node.state.m},node.cost+1,2);
	}
    return null;
}

Builder.moveLeft = function(node,world)
{
    if (node.state.p.x > 0)
	if (Builder.walkable(world,node.state.m,node.state.p.x-1,node.state.p.y,node.state.p.z))
	{
	  var p = {x:node.state.p.x-1,y:node.state.p.y,z:node.state.p.z};
	  return new Builder.Node({p:p,m:node.state.m},node.cost+1,3);
	}
    return null;
}

Builder.buildUp = function(node,world)
{
    if (node.state.p.z > 0)
	if (!Builder.walkable(world,node.state.m,node.state.p.x,node.state.p.y,node.state.p.z-1))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x,node.state.p.y,node.state.p.z-1]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+Builder.buildCost,4);
	}
    return null;
}

Builder.buildRight = function(node,world)
{
    if (node.state.p.x < world.length-1)
	if (!Builder.walkable(world,node.state.m,node.state.p.x+1,node.state.p.y,node.state.p.z))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x+1,node.state.p.y,node.state.p.z]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+Builder.buildCost,5);
	}
    return null;
}

Builder.buildDown = function(node,world)
{
    if (node.state.p.z < world[0][0].length-1)
	if (!Builder.walkable(world,node.state.m,node.state.p.x,node.state.p.y,node.state.p.z+1))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x,node.state.p.y,node.state.p.z+1]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+Builder.buildCost,6);
	}
    return null;
}

Builder.buildLeft = function(node,world)
{
    if (node.state.p.x > 0)
	if (!Builder.walkable(world,node.state.m,node.state.p.x-1,node.state.p.y,node.state.p.z))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x-1,node.state.p.y,node.state.p.z]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+Builder.buildCost,7);
	}
    return null;
}

//----------------------------------------------
Builder.buildFloorUp = function(node,world)
{
    if ((node.state.p.z > 0) && (node.state.p.y > 0))
	if (!Builder.walkable(world,node.state.m,node.state.p.x,node.state.p.y-1,node.state.p.z-1))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x,node.state.p.y-1,node.state.p.z-1]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+Builder.buildCost,8);
	}
    return null;
}

Builder.buildFloorRight = function(node,world)
{
    if ((node.state.p.x < world.length-1) && (node.state.p.y > 0))
	if (!Builder.walkable(world,node.state.m,node.state.p.x+1,node.state.p.y-1,node.state.p.z))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x+1,node.state.p.y-1,node.state.p.z]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+Builder.buildCost,9);
	}
    return null;
}

Builder.buildFloorDown = function(node,world)
{
    if ((node.state.p.z < world[0][0].length-1) && (node.state.p.y > 0))
	if (!Builder.walkable(world,node.state.m,node.state.p.x,node.state.p.y-1,node.state.p.z+1))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x,node.state.p.y-1,node.state.p.z+1]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+Builder.buildCost,10);
	}
    return null;
}

Builder.buildFloorLeft = function(node,world)
{
    if ((node.state.p.x > 0) && (node.state.p.y > 0))
	if (!Builder.walkable(world,node.state.m,node.state.p.x-1,node.state.p.y-1,node.state.p.z))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x-1,node.state.p.y-1,node.state.p.z]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+Builder.buildCost,11);
	}
    return null;
}

Builder.buildCost = 3;


/**
 * moveUp = 0
 * moveRight = 1
 * moveDown = 2
 * moveLeft = 3
 * buildUp = 4
 * buildRight = 5
 * buildDown = 6
 * buildLeft = 7
 * buildFloorUp = 8
 * buildFloorRight = 9
 * buildFloorDown = 10
 * buildFloorLeft = 11
 */
Builder.actions = [Builder.moveRight,Builder.moveLeft,Builder.moveUp,Builder.moveDown,Builder.buildRight,Builder.buildLeft,Builder.buildUp,Builder.buildDown,Builder.buildFloorRight,Builder.buildFloorLeft,Builder.buildFloorUp,Builder.buildFloorDown];


Builder.prototype.summary = function(solution,steps,time)
{
  if (solution != null)
  {
    if (solution.state != null)
      console.log(time + "ms Solution: p x:"+solution.state.p.x+" y:"+solution.state.p.y + " z:"+solution.state.p.z +" in "+steps+" steps. Fringe length: "+ this.fringe.length + ". Closed list length: "+ this.closedList.length);
  }
  else
    console.log("Failure. Fringe length: "+ this.fringe.length + ". Closed list length: "+ this.closedList.length);

}