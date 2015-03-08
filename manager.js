var debug = true;	

onmessage = function(e){
  if ( e.data === "start" ) {
    Manager.run();
  }
};

function Manager()
{
    this.workers = Array(1);
    this.candidates = Array(this.workers.length);
    
    this.world = Manager.createWorld(100,100)
}

Manager.run = function()
{
    var m = new Manager();
    for (var i=0;i<m.workers.length;i++)
    {
	m.workers[i] = new Worker("builder.js");
	m.workers[i].onmessage = function(e){
	    if (e.data.msg === "candidate")
	      m.getData(e.data.id,e.data.candidate);
	};
	m.workers[i].postMessage({msg:"start",id:i,world:m.world});
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
      world[i][j] = Math.round(Math.random()*3)!=1;
    }
  }
  
  return world;
}

Manager.prototype.getData = function(workerIndex,candidate)
{
    if (debug)
      console.log("Worker "+workerIndex+" returned with candidate solution");
    this.candidates[workerIndex] = candidate;
    var finished = true;
    for (var i=0;i<this.candidates.length;i++)
	if (this.candidates[i] == null)
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
     for (var i=0;i<this.candidates.length;i++)
            for (var j=0;j<this.candidates[i].state.m.length;j++)
		  this.world[this.candidates[i].state.m[j][0]][this.candidates[i].state.m[j][1]] = true;
	   
    //On Completion
    if (debug)
      console.log("Returning final output");
    postMessage(Manager.output(this.world));
}

Manager.output = function(world)
{
    var html = "";

    for (var i=0;i<world.length;i++)
    {
	for (var j=0;j<world[0].length;j++)
	{
	    if (world[i][j])
		html += "_";
	    else
		html += "#";
	}
	html += "<br />";
    }
    return html;
}