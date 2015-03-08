var debug = false;	

onmessage = function(e){
  if ( e.data.msg === "start" ) {
    postMessage(Builder.run(e.data.id,e.data.world,e.data.origin,e.data.goal));
  }
};

function Builder(world,origin,goal)
{
  this.world = world;
  this.goal = goal;

  this.fringe = [new Builder.Node({p:origin,m:[]},0)];
  this.candidate = this.fringe[0];
}

Builder.run = function(id,world,origin,goal)
{
    var builder = new Builder(world,origin,goal);
    var i=0;
    while (true)
    {
	i++;
	builder.step();
	if (Builder.goalTest(builder.candidate.state,builder.goal))
	  break;
    } 
    builder.summary(builder.candidate,i);
    return {id:id,msg:"candidate",candidate:builder.candidate};
    //Builder.output(b.world,b.candidate);
}

Builder.prototype.step = function()
{
    if (debug)
	console.log("Fringe length: "+this.fringe.length);
    
    if (this.candidate != null)
    {
	if (debug)
	{
	    console.log(this.candidate.state.p);
	    console.log(this.candidate.heuristic);
	    console.log("m length:"+this.candidate.state.m.length);
	}
	this.fringe.splice(this.fringe.indexOf(this.candidate),1);
	var newNodes = Builder.expand(this.candidate,Builder.actions,this.goal,this.world);
	for (var i=0;i<newNodes.length;i++)
	  newNodes[i].heuristic = Builder.heuristic(newNodes[i].state,this.goal);
	this.fringe = Builder.sort(this.fringe.concat(newNodes));
	this.candidate = this.fringe[0];
    }
}

Builder.sort = function(fringe)
{
    fringe = fringe.sort(function(a,b){return a.heuristic-b.heuristic;});
    
    for (var i=1;i<fringe.length;i++)
	if (fringe[0] == fringe[i])
	{
	    if (debug)
		console.log("duplicate removed");
	    fringe.splice(i,1);
	}
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
    if (debug)
	console.log("Added "+children.length+" nodes");
    return children;
}

Builder.goalTest = function(state,goal)
{
  return ((state.p.x==goal.x) && (state.p.y==goal.y));
}

Builder.Node = function(state,cost)
{
    this.state = state;
    this.cost = cost;
}

Builder.Node.prototype.heuristic = 0;

Builder.heuristic = function(state,goal)
{
    var xdiff = goal.x - state.p.x;
    var ydiff = goal.y - state.p.y;
    return Math.sqrt(xdiff*xdiff+ydiff*ydiff);//* (0.5+Math.random()*0.5);
}

Builder.walkable = function(world,modifications,x,y)
{
  for (var i=0;i<modifications.length;i++)
  {
      if ((modifications[i][0] == x) && (modifications[i][1] == y))
	return true;
  }
  return world[x][y]==1;
}

Builder.moveRight = function(node,world)
{
    if (node.state.p.x < world.length-1)
	if (Builder.walkable(world,node.state.m,node.state.p.x+1,node.state.p.y))
	{
	  var p = {x:node.state.p.x+1,y:node.state.p.y};
	  return new Builder.Node({p:p,m:node.state.m},node.cost+1);
	}
    return null;
}

Builder.moveLeft = function(node,world)
{
    if (node.state.p.x > 0)
	if (Builder.walkable(world,node.state.m,node.state.p.x-1,node.state.p.y))
	{
	  var p = {x:node.state.p.x-1,y:node.state.p.y};
	  return new Builder.Node({p:p,m:node.state.m},node.cost+1);
	}
    return null;
}

Builder.moveUp = function(node,world)
{
    if (node.state.p.y > 0)
	if (Builder.walkable(world,node.state.m,node.state.p.x,node.state.p.y-1))
	{
	  var p = {x:node.state.p.x,y:node.state.p.y-1};
	  return new Builder.Node({p:p,m:node.state.m},node.cost+1);
	}
    return null;
}

Builder.moveDown = function(node,world)
{
    if (node.state.p.y < world[0].length-1)
	if (Builder.walkable(world,node.state.m,node.state.p.x,node.state.p.y+1))
	{
	  var p = {x:node.state.p.x,y:(node.state.p.y+1)};
	  return new Builder.Node({p:p,m:node.state.m},node.cost+1);
	}
    return null;
}


Builder.buildRight = function(node,world)
{
    if (node.state.p.x < world.length-1)
	if (!Builder.walkable(world,node.state.m,node.state.p.x+1,node.state.p.y))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x+1,node.state.p.y]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+20);
	}
    return null;
}

Builder.buildLeft = function(node,world)
{
    if (node.state.p.x > 0)
	if (!Builder.walkable(world,node.state.m,node.state.p.x-1,node.state.p.y))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x-1,node.state.p.y]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+20);
	}
    return null;
}

Builder.buildUp = function(node,world)
{
    if (node.state.p.y > 0)
	if (!Builder.walkable(world,node.state.m,node.state.p.x,node.state.p.y-1))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x,node.state.p.y-1]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+20);
	}
    return null;
}

Builder.buildDown = function(node,world)
{
    if (node.state.p.y < world[0].length-1)
	if (!Builder.walkable(world,node.state.m,node.state.p.x,node.state.p.y+1))
	{
	  var n = [];
	  for (var i=0;i<node.state.m.length;i++)
	    n.push(node.state.m[i]);
	  n.push([node.state.p.x,node.state.p.y+1]);
	  return new Builder.Node({p:node.state.p,m:n},node.cost+20);
	}
    return null;
}

Builder.actions = [Builder.moveRight,Builder.moveLeft,Builder.moveUp,Builder.moveDown,Builder.buildRight,Builder.buildLeft,Builder.buildUp,Builder.buildDown];

Builder.prototype.summary = function(solution,steps)
{
  console.log("Steps to completion: "+ steps);
  if (solution != null)
  {
    if (solution.state != null)
      console.log("Solution: p x:"+solution.state.p.x+" y:"+solution.state.p.y);
  }
  else
    console.log("Failure");

  console.log("Fringe length: "+ this.fringe.length);
}