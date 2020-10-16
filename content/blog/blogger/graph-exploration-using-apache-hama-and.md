---
title: 'Graph Exploration with Apache Hama'
date: 2011-04-10T10:43:00.002+02:00
draft: false
aliases: [ "/2011/04/graph-exploration-using-apache-hama-and.html" ]
tags : [hama, bsp, graph, bulk synchronous parallel, exploration, apache hama]
---

Hey guys,  
I've been busy for a tiny bit of time, but I finished the graph exploration algorithm with [Apache Hama](http://incubator.apache.org/hama/) recently. This post is about the BSP portation of [this post](http://codingwiththomas.blogspot.com/2011/04/graph-exploration-with-hadoop-mapreduce.html).  
So I already told in [this post](http://codingwiththomas.blogspot.com/2011/04/back-to-blogsphere.html) how BSP basically works. Now I'm going to tell you what you can do with it in terms of graph exploration. Last post I did this with MapReduce, so let's go and get into Hama!  
  
**As of today** this is merely outdated, since Hama 0.5.0, you can use the Pregel-like Graph API and run the connected components example shipped. This will do everything this code below did a year ago.  
I just keep that as a part of history, some of the statements still hold true, some parts needs to be updated though.  
  
**BSP Class**  
Like coding a mapper you'll need to inherit from a baseclass. In Hama this is the BSP class, it is abstract and implements a interface called BSPInterface. BSPInterface has a method that you are going to implement for yourself:  

```java
public void bsp(BSPPeerProtocol bspPeer)  
```  

**What is BSPPeerProtocol and how is it getting executed?**  
The BSPPeerProtocol is nothing else than a reference to your local running Groom server. A Groom is similar to Hadoop's tasktracker. This is also a hint on how your own BSP get's executed. Hama will launch several tasks inside a Groom and create a new instance of your BSP class per task.  
  
**Syncing**  
In BSP it is necessary to synchronize the Grooms' in order to introduce the messaging phase described [here](http://codingwiththomas.blogspot.com/2011/04/back-to-blogsphere.html). You can simply call the sync() method from your BSPPeerProtocol reference.  
  
**Letting code be executed on only one Server / Groom / Task**  
This is actually pretty easy, you could take a look at the [PiEstimator example.](http://wiki.apache.org/hama/PiEstimator)  
  
Okay I guess this is enough, let's step into the code. The thoughts are the same like in the MapReduce example:  

1.  Initialize the datasets, we have several maps' storing active vertices, the adjacency list and a map which holds the minimal vertices for each vertex.
2.  In the first iteration, send a message for each adjacent of a vertex containing the id of the adjacent vertex and it's currently minimal vertex to a master task. If we are not in the first iteration we are going to loop through the active vertices and their adjacent vertices, broadcasting to every adjacent vertex what the new minimal id is.
3.  Sync so that every task receives the messages.
4.  A master task is fetching the results and updating the minimal vertex ids. If a vertex has been updated, we put its id into the "activeVertexMap". Sending the active vertices to all existing peers.
5.  Sync again: if we received nothing, just break the main loop resulting in exiting the bsp. If we receive new active vertices, increment the iteration and continue with point 2. 

**Input / Output System**  
Maybe you know that Hama has currently no real Input and Output system. So you have to take care for yourself: Manage the data the grooms need for their computation, partitioning and updating.  
I hope hat [this issue](https://issues.apache.org/jira/browse/HAMA-258) will be resolved soon, so that this whole management will be inside Hama and is not blowing up your BSP class.  
For this example we need two major files: The actual adjacency list and the map that keeps track of the current minimas. If you are a wondering why, the last time we saved this up into a vertex itself. This is true, but I don't want to add another model for a vertex. This is just a personal reason, so feel free to fork and build your own ;)  
Both files are in HDFS, a far more scalable solution would be to store these into a HBase table. But since Hama doesn't require HBase anymore, I'll go for a FileSystem-way of storing data.  
  
**Source Code**  
If you want to see the full implementation, check it out at [http://code.google.com/p/hama-shortest-paths/](http://code.google.com/p/hama-shortest-paths/)  
  
Let's start with the initialization phase in the bsp method:  
  
```java
String master = conf.get(MASTER\_TASK);  
  fs = FileSystem.get(getConf());  
  
  // setup the datasets  
  adjacencyList = mapAdjacencyList(getConf());  
  // setup the local minimas  
  if (peer.getPeerName().equals(master)) {  
   // init the minimum map  
   for (Entry<Integer, List<Integer>> row : adjacencyList.entrySet()) {  
    int localAdjacentMinimum = row.getValue().get(0);  
    for (int adjacent : row.getValue()) {  
     if (adjacent < localAdjacentMinimum)  
      localAdjacentMinimum = adjacent;  
    }  
    minimalMap.put(row.getKey(), localAdjacentMinimum);  
   }  
   // save our minimal map to HDFS so that every task can read this  
   saveMinimalMap();  
  }  
```  

As you can see, we are getting from our configuration which groom is currently the master server, aftwards we are initializing the FileSystem and map our adjacency list file into RAM. After that follows code that is only executed by the master.  
It simply loops through the list and setups the currently minimum adjacent vertex.  
Only the master has write access to the minimalmap file and updates it after each iteration.  
That's it. Let's step to the main loop.  
  
```java
// real start  
  boolean updated = true;  
  int iteration = 0;  
  while (updated) {  
   // sync so we can receive the new active messages  
   peer.sync();  
   List<Integer> activeQueue = new LinkedList<Integer>();  
   if (peer.getNumCurrentMessages() > 0) {  
    IntegerMessage message = (IntegerMessage) peer  
      .getCurrentMessage();  
    if (message.getTag().equals("size") && message.getData() == 0)  
     break;  
    BSPMessage msg = null;  
    while ((msg = peer.getCurrentMessage()) != null) {  
     message = (IntegerMessage) msg;  
     activeQueue.add(message.getData());  
    }  
   }  
   // apply updates on the minimal map  
   applyMinimalMap();  
...  
```  

First off we are syncing in this loop, in the first iteration it is obvious that nobody would receive a message, but you can also use the sync to keep the grooms at the same line of code. Maybe you already seen this: a server is ahead in computation and the master hadn't finished writing the map into the HDFS. This groom is no longer consistent to the rest of the cluster.  
So we are going to prevent this using sync, in the following iterations this is used to receive the active vertices.  
If the list of active vertices is empty we are going to break this while loop- the algorithm is done. Otherwise we are updating the activeQueue with the vertex ids we got. Then we are applying the changes the master could have done to the minimal map (method applyMinimalMap()).  
  
Let's advance to the main algorithm.  
```java
// main algorithm  
  if (iteration == 0) {  
    for (Entry<Integer, List<Integer>> row : adjacencyList  
      .entrySet()) {  
      int min = minimalMap.get(row.getKey());  
      for (int adjacent : row.getValue()) {  
        peer.send(master, new FullIntegerMessage(adjacent, min));  
      }  
    }  
  } else {  
    for (int active : activeQueue) {  
      int min = minimalMap.get(active);  
      for (int l : adjacencyList.get(active)) {  
        if (l != min){
          peer.send(master, new FullIntegerMessage(l, min));  
        }  
      }  
    }
  }  

  peer.sync();  
```  

I guess this is pretty good described in the listing, if we are in the first iteration we are going to send messages to every adjacent of a vertex in the adjacency list. In the following iterations we are just going to loop over the active vertices and sending messages of the new minimum to every adjacent except for the vertex itself.  
\> Sync step for sending and receiving messages  
Don't worry, now comes the last part ;)  
  
```java
// only the master keeps track of the minimal  
  if (peer.getPeerName().equals(master)) {  
    FullIntegerMessage msg = null;  
    List<Integer> activeList = new LinkedList<Integer>();  
    while ((msg = (FullIntegerMessage) peer.getCurrentMessage()) != null) {  
      if (minimalMap.get(msg.getTag()) > msg.getData()) {  
      minimalMap.put(msg.getTag(), msg.getData());  
      // flag as active  
      activeList.add(msg.getTag());  
      }  
    }  
    // save to hdfs for next iteration  
    saveMinimalMap();  
    // send messages to all peers containing the size of the  
    // activelist and the content  
    for (String peerName : peer.getAllPeerNames()) {  
      peer.send(peerName,  
        new IntegerMessage("size", activeList.size()));  
      for (int active : activeList)  
      peer.send(peerName, new IntegerMessage("", active));  
    }  
    // increment the iteration  
    iteration++;  
    }  
}  

```  

This part is only executed by a master groom. We receiving every message and updating the minimalmap. If we updated a vertex we are going to put them into the list of active vertices. Afterwards we are saving our minimal map so the grooms have a fresh state of minimum in their RAM.  
Then we are going to send the size of this list along with it's content. This is necessary for the breaking condition. And don't forget to increment the iteration variable.  
  
That's it. It is the same algorithm we used in MapReduce- translated to BSP.  
Wasn't that difficult, was it?  
  
If you want to take a close look at how this works, I already posted the project site of my GSoC project above. Feel free to check it out and play a little. The class we were talking about can be found here: de.jungblut.hama.graph.BSPGraphExploration  
It comes along with the latest Hama build out of the trunk, it also has a local bsp runner that will multithread grooms on your local machine. Just run the main method as a java application and you'll see. So be aware when you are running this on your Hama Cluster, there could be some problems with the compatibilty to version 0.2.