---
title: 'Shortest Path Finding with Apache Hama'
date: 2011-05-07T11:30:00.001+02:00
draft: false
aliases: [ "/2011/05/shortest-path-finding-with-apache-hama.html" ]
tags : [bsp, graph, vertex, bulk synchronous parallel, google summer of code, apache, SSSP, apache hama, partitioning, Apache Hadoop]
---

Hi guys,  
  
I've finished my Google Summer of Code task. Really! Remember today is the 7th of may. And the actualy coding period goes until mid September.  
  
Okay obviously I've just finished the task itself, developing a new example with BSP. Since Hama does not require HBase anymore I have decided to split the tasks.  
One example (which I have submitted) is a straight single source shortest path implementation described in Google Pregel's paper.  
The second one will be a HBase version using Dijkstra and its extend A\*. The second won't be committed to the codebase of Hama, just because I don't want to add the old HBase dependency once again.  
  
So in the end everyone won: I used HBase to get more familiar with BigTable, Hama has a shortest path example and I can code the whole summer long knowing that I've finished my task ;D  
  
Okay 'nuff talked, let's dive into the algorithm!  
  
Like in [PageRank](http://codingwiththomas.blogspot.com/2011/04/pagerank-with-apache-hama.html) you should be familiar withthe idea behind the partitioning, read the Pregel paper and this time you should be familiar with (single source) shortest path finding.  
  
  
**Short summary of the algorithm**  
  
First off I just briefly describe how it should work, and then how I solved it.  
  

*   Initialize all vertices' cost to reach it to INFINITY, just the start vertex will have cost 0
*   initially send the new cost to all adjacent vertex containing the new cost plus the edge weight between them
*   Reviewing messages: if the cost coming from a message is lower than the actual cost, update the cost and send a message to the adjacent vertices, containing the new cost plus the edge weight between them (similar to the last step)
*   Repeat the last step until no updates can be made anymore.

That is pretty much it.  
  
**How we do it!**  
  
First we need a model class that represents a shortest path vertex. It has a name/ID, a weight and a cost. The cost is the cost with the vertex can be reached from our starting vertex.  
A vertex will have an ID, that is just the hashcode of the name. I wanted a common way to partition a vertex so I've just set this based on the name called it ID. Watch out, when adding e.G. cities with the same name.  
  
I will skip the whole partitioning step, you can read the other posts to learn more about it, shortly described it is just a modulo function that will spread the vertices to different sequencefiles. These sequencefiles will get read during job initilization and mapped into memory.  
  
So let's step into the code...  
  
**Fields we need**  
  
Because we store this time the cost and weights into a modelling vertex we just need a adjacency list and a lookup map.  
This looks like this:  
  
```java
private Map<ShortestPathVertex, List<ShortestPathVertex>> adjacencyList = new HashMap<ShortestPathVertex, List<ShortestPathVertex>>();  
private Map<String, ShortestPathVertex> vertexLookupMap = new HashMap<String, ShortestPathVertex>();  
```  

Basically we are storing a vertex to its adjacents and the name to the vertex itself. I'll tell you later why we need a lookup map.  
  
**Initialization**  
  
In the init phase we need to map our adjacency list into ram, get our start vertex (just create it, we need it for equality check in the following loop which will just check the name)  
The following loop will just init the costs and send it to the adjacents.  
  
```java
@Override  
  public void bsp(BSPPeerProtocol peer) throws IOException, KeeperException,  
      InterruptedException {  
    // map our input into ram  
    mapAdjacencyList(conf, peer);  
    // get the start vertex  
    ShortestPathVertex start = new ShortestPathVertex(0,  
        conf.get("shortest.paths.start.vertex.id"));  
    // get our master groom  
    String master = conf.get(MASTER_TASK);  
    // init the vertices  
    for (ShortestPathVertex v : adjacencyList.keySet()) {  
      if (v.equals(start)) {  
        v.setCost(0);  
      } else {  
        // INF  
        v.setCost(Integer.MAX_VALUE);  
      }  
      // initial message bypass  
      sendMessageToNeighbors(peer, v);  
    }  
  

```  
**The send method**  
  
The send method takes advantage of the partitioning, to get the target groom where the vertex is actually stored.  
It will bascially send a message containing the name of the vertex it targets and the cost it can be reached through the vertex in the parameter line.  
  
```java
private void sendMessageToNeighbors(BSPPeerProtocol peer,  
      ShortestPathVertex id) throws IOException {  
  
    List outgoingEdges = adjacencyList.get(id);  
    for (ShortestPathVertex adjacent : outgoingEdges) {  
      int mod = Math.abs((adjacent.getId() % peer.getAllPeerNames().length));  
      peer.send(peer.getAllPeerNames()[mod],  
          new IntegerMessage(adjacent.getName(),  
              id.getCost() == Integer.MAX_VALUE ? id.getCost() : id.getCost()  
                  + adjacent.getWeight()));  
    }  
  }
```  

**Main Loop**  
  
Very simple is the main loop, it is a while(true) loop that will break if no updates can be made anymore.  
So we are just parsing incoming messages, comparing the cost with the current cost. If the new cost is lower, then update it, put it into a queue and increment a local update counter.  
  
Now we need the lookup map, to get fast access to the actual cost in the vertex.  
  
```java
boolean updated = true;  
    while (updated) {  
      int updatesMade = 0;  
      peer.sync();  
  
      IntegerMessage msg = null;  
      Deque<ShortestPathVertex> updatedQueue = new LinkedList<ShortestPathVertex>();  
      while ((msg = (IntegerMessage) peer.getCurrentMessage()) != null) {  
        ShortestPathVertex vertex = vertexLookupMap.get(msg.getTag());  
        // check if we need an distance update  
        if (vertex.getCost() > msg.getData()) {  
          updatesMade++;  
          updatedQueue.add(vertex);  
          vertex.setCost(msg.getData());  
        }  
      }  
      // synchonize with all grooms if there were updates  
      updated = broadcastUpdatesMade(peer, master, updatesMade);  
      // send updates to the adjacents of the updated vertices  
      for (ShortestPathVertex vertex : updatedQueue) {  
        sendMessageToNeighbors(peer, vertex);  
      }  
    }  
  

```  
Afterwards we are sending the updatecounter to a master groom that will evaluate and check if updates can be applied. I leave this method out, you can check out the pagerank error method. It is roughly the same.  
  
If we have updates to apply, we just send them to the neighbor edges again.  
Then we are just repeating until the master says: no updates can occur anymore.  
  
**Submit your own SequenceFile adjacency list**  
  
This is of course an example, so you can submit this to your own cluster and give it the input you like. I have designed the input like this:  
  

> The adjacencylist contains two text fields on each line. The key  
> component is the name of a vertex, the value is a ":" separated Text  
> field that contains the name of the adjacent vertex leftmost and the  
> weight on the rightmost side.  
> ```
> K            /                V   
> Vertex[Text] / AdjacentVertex : Weight [Text]
> ```

So you can setup a sequencefile like this (obviously I won't write any binary code here :p ):  

> Berlin /  Paris : 25  
> Berlin / London : 40  
> London / Paris : 10  
> etc.

  
The basic usage of the command line arguments are:  

> <name of the start vertex> <optional: output path> <optional: path of your own sequencefile>

So you can run this with:  

> hama/bin/hama jar ../hama-0.x.0-examples.jar sssp Berlin /srv/tmp/ /home/user/myOwnGraph.seq

  
I've submitted this as a patch here: [https://issues.apache.org/jira/browse/HAMA-359](https://issues.apache.org/jira/browse/HAMA-359)  
So feel free to check it out, I hope it will get comitted soon. Never the less, it is contained also in my trunk on google code: [http://code.google.com/p/hama-shortest-paths/](http://code.google.com/p/hama-shortest-paths/)  
Class is called: **de.jungblut.hama.bsp.ShortestPaths**  
Just run the main method ;)  
  
Have fun with it!