---
title: 'Apache Hama Partitioning'
date: 2011-04-12T17:51:00.005+02:00
draft: false
aliases: [ "/2011/04/apache-hama-partitioning.html" ]
tags : [GSoC, bsp, graph, bulk synchronous parallel, exploration, graph exploration, apache, apache hama, partitioning]
---

Hello there!  
  
I was a bit busy today after I've read the Google Pregel paper. It described quite good "how to think like a vertex" and how they are partition data across their cluster.  
I wanted to share this new knowledge with you and I've shortly rewritten my Graph Exploration algorithm. It can be found as the post below or just following [this link](http://codingwiththomas.blogspot.com/2011/04/graph-exploration-using-apache-hama-and.html).  
  
Just a short summary of what we are going to change:  

*   Partition the vertices across the servers.
*   Messages that are related to a specific vertex will just go to the server the vertex was partitioned to.
*   The master task just keeps track of when the task is finished (no updates were made).
*   Each task has its own output.

**Partitioning**  
I really felt dumb today after I read the Pregel paper. They are just partitioning the data with a hashfunction. And I was like running several MapReduce jobs to determine the optimal distribution of an adjacency list. So scratch that, we just use a simple HashFunction that is none other than returning the id of the vertex. If you are having for example Vertex IDs' from 0-100 and you have to distribute it over 5 machines, just loop to 100 and modulo it with the 5 machines. Life can be so simple. sic!  
  
**How to distribute?**  
First off we share the common FileSystem across the servers. The idea is that every server get's its own SequenceFile where the data is stored in. Let's rush into the code that parses my AdjacencyList textfile into the SequenceFiles for the servers:  
  
```
public static List<Path> partitionAdjacencyTextFile(int sizeOfCluster,
  
   Map<String, String> groomNames, Path fileToPartition,
  
   Configuration conf) throws IOException {
  
  // setup the paths where the grooms can find their input
  
  List<Path> partPaths = new ArrayList<Path>(sizeOfCluster);
  
  List<SequenceFile.Writer> writers = new ArrayList<SequenceFile.Writer>(
  
    sizeOfCluster);
  
  FileSystem fs = FileSystem.get(conf);
  
  for (Entry<String, String> entry : groomNames.entrySet()) {
  
   partPaths.add(new Path(fileToPartition.getParent().toString()
  
     + Path.SEPARATOR + "parted" + Path.SEPARATOR
  
     + entry.getValue()));
  
  }
  
  // create a seq writer for that
  
  for (Path p : partPaths) {
  
   fs.delete(p, true);
  
   writers.add(SequenceFile.createWriter(fs, conf, p,
  
     IntWritable.class, IntWritable.class));
  
  }
  
  
  // parse our file
  
  FSDataInputStream data = fs.open(fileToPartition);
  
  BufferedReader br = new BufferedReader(new InputStreamReader(data));
  
  String line = null;
  
  while ((line = br.readLine()) != null) {
  
   String\[\] arr = line.split("\\t");
  
   int vId = Integer.parseInt(arr\[0\]);
  
   LinkedList<Integer> list = new LinkedList<Integer>();
  
   for (int i = 0; i < arr.length; i++) {
  
    list.add(Integer.parseInt(arr\[i\]));
  
   }
  
  
   int mod = vId % sizeOfCluster;
  
   System.out.println(vId + " goes to " + partPaths.get(mod));
  
   for (int value : list) {
  
    writers.get(mod).append(new IntWritable(vId),
  
      new IntWritable(value));
  
   }
  
  
  }
  
  data.close();
  
  
  for (SequenceFile.Writer w : writers)
  
   w.close();
  
  
  return partPaths;
  
 }
  
  

```  
Basically we are creating a SequenceFile for each Groom and writing the data with the modulo function into the SequenceFiles. Note that the names of the SequenceFiles are related to the name of the peer. That is because we can simply let each peer find its partition.  
  
**How to pass messages between vertices using partitioning?**  
If we know what kind of partition we used, this is very simple. Look at the layered send method.  
  
```
private void send(BSPPeerProtocol peer, BSPMessage msg) throws IOException {
  
  int mod = ((Integer) msg.getTag()) % peer.getAllPeerNames().length;
  
  peer.send(peer.getAllPeerNames()\[mod\], msg);
  
 }
  

```  
The only requirement is, that the indices of peer.getAllPeerNames() are the same we used in the partitioning phase, otherwise it will result in strange behaviour.  
  
With the help of these two methods we are now able to make the main algorithm use less master-slave communication and therefore use a more collective communication.  
But keep in mind that we have to use the master-slave communication to keep track of the main loop. The problem behind it is that if a slave breaks its calculation because there can't be more updates made in a superstep, the other peers will deadlock in the next sync phase because one slave already has finished.  
So we have to sync the updates with a master task and broadcast whether we can break the main loop altogether (if no task can update anymore) or we need another superstep.  
  
This is actually a bit hacky. In the Pregel paper it is called "voteToHalt". Have a look at my implementation of the same:  
```
private boolean voteForHalt(BSPPeerProtocol peer, String master)
  
   throws IOException, KeeperException, InterruptedException {
  
  peer.send(master, new IntegerMessage("", activeList.size()));
  
  peer.sync();
  
  if (peer.getPeerName().equals(master)) {
  
   boolean halt = true;
  
   IntegerMessage message;
  
   while ((message = (IntegerMessage) peer.getCurrentMessage()) != null) {
  
    message = (IntegerMessage) peer.getCurrentMessage();
  
    if (message.getData() != 0) {
  
     halt = false;
  
     break;
  
    }
  
   }
  
   peer.clear();
  
   for (String name : peer.getAllPeerNames()) {
  
    peer.send(name, new BooleanMessage("", halt));
  
   }
  
  }
  
  
  peer.sync();
  
  BooleanMessage message = (BooleanMessage) peer.getCurrentMessage();
  
  if (message.getData() == true) {
  
   return false;
  
  } else {
  
   return true;
  
  }
  
 }
  

```  
A bit more human readable it says: Every task sends how many vertices are stored in the activeList and a master decides whether to break or not. This decision is broadcasted again and a false return value will break the outer running loop.  
  
Keep in mind that this is **not** very very very optimal.  
  
**Output**  
Now we have multiple files in HDFS that can now be read or merged to get the classified components of the graph.  
  
This snippet is quite generic if you want to use it in your application: feel free to copy and paste ;)  
  
```
private static void printOutput(FileSystem fs, Configuration conf)
  
   throws IOException {
  
  System.out.println("-------------------- RESULTS --------------------");
  
  FileStatus\[\] stati = fs.listStatus(new Path(conf.get("out.path")
  
    + Path.SEPARATOR + "temp"));
  
  for (FileStatus status : stati) {
  
   Path path = status.getPath();
  
   SequenceFile.Reader reader = new SequenceFile.Reader(fs, path, conf);
  
   IntWritable key = new IntWritable();
  
   IntWritable value = new IntWritable();
  
   while (reader.next(key, value)) {
  
    System.out.println(key.get() + " | " + value.get());
  
   }
  
   reader.close();
  
  }
  
 }
  

```  
As you can see, it just fetches the parent directory of the outputs' and loops over the files while writing the content to STDOUT.  
Gladly this helped [a guy on Stackoverflow](http://stackoverflow.com/questions/5634137/programmatically-reading-the-output-of-hadoop-mapreduce-program) today. And helped me to get my 500 reputation :)  
  
Finally it gaves the same output as the other algorithms:  
```
\-------------------- RESULTS --------------------
  
0 | 0
  
1 | 1
  
2 | 2
  
3 | 2
  
4 | 1
  
5 | 2
  
6 | 2
  
7 | 1
  
8 | 2
  
9 | 0
  

```  
The new class is called: de.jungblut.hama.graph.BSPGraphExplorationPartitioned.  
Just execute the main method, it will run a local multithreaded BSP on your machine.  
This class is located in my Summer of Code repository under: [http://code.google.com/p/hama-shortest-paths/](http://code.google.com/p/hama-shortest-paths/)  
  
Star this project or vote for my [GSoC task](https://issues.apache.org/jira/browse/HAMA-359).  
  
The next week I'll go for a comparision between these three implementations: partitioned-BSP, BSP and MapReduce.  
But I guess before it I focus at PageRank. Some guys of Apache Nutch wanted a distributed PageRank in BSP, I'll go for a working example next time.  
The Pregel paper said something about 15 lines of code. Looks like a short task ;)  
  
**\[UPDATE\]**  
  
If you are interested in a more faster way to partition, check out the new blog post here:  
[http://codingwiththomas.blogspot.com/2011/08/apache-hama-partitioning-improved.html](http://codingwiththomas.blogspot.com/2011/08/apache-hama-partitioning-improved.html)  
  
bye!