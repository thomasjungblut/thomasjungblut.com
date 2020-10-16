---
title: 'Controlling Hadoop MapReduce Job recursion'
date: 2011-04-09T09:58:00.003+02:00
draft: false
aliases: [ "/2011/04/controlling-hadoop-job-recursion.html" ]
tags : [graph, hadoop, exploration, recursion, counter, Apache Hadoop]
---

This post is related to the [previous post](http://codingwiththomas.blogspot.com/2011/04/graph-exploration-with-hadoop-mapreduce.html).  
  
Sometimes you coming along problems that need to be solved in a recursive manner. For example the graph exploration algorithm in my previous post.  
You have to chain the jobs and let the next job work on the output of the previous job. And of course you need a breaking condition. This could either be a fixed limit of "how many recursions it should do" or "how many recursion it really does".  
Let me focus at the second breaking condition along with my graph exploration example.  
  
**Counter**  
First off you should know that in Hadoop you have counters, you may see them after a job ran or in the Webinterface of the Jobtracker. "Famous" counters are the "Map input records" or the "Reduce output records".  
The best of all is that we can setup our own counters, just with the use of enums.  
  
**How to setup Counter?**  
The simplest approach is to just define an enum like this:  
  
```java
public enum UpdateCounter {  
  UPDATED  
 }  

```  
Now you can manipulate the counter using:  
  
```java
context.getCounter(UpdateCounter.UPDATED).increment(1);  
```  

"context" is the context object you get from your mapper or your reducer.  
This line will obviously increment your update counter by 1.  
  
**How to fetch the counter?**  
  
This is as easy as setting up an enum. You are submitting a job like this:  
```java
Configuration conf = new Configuration();  
Job job = new Job(conf);  
job.setJobName("Graph explorer");  

job.setMapperClass(DatasetImporter.class);  
job.setReducerClass(ExplorationReducer.class);  
// leave out the stuff with paths etc.  
job.waitForCompletion(true);  
```  

Be sure that the job has finished, using waitForCompletion is recommended. Querying the counter during runtime can end in strange results ;)  
You can access your counter like this:  

```java
long counter = job.getCounters().findCounter(ExplorationReducer.UpdateCounter.UPDATED)  
    .getValue();  
```  

**How to get the recursion running?**  
  
Now we know how to get the counter. Now setting up a recursion is quite simple. The only thing that you should watch for is already existing paths from older job runs.  
Look at this snippet:  
```java
// variable to keep track of the recursion depth  
int depth = 0;  
// counter from the previous running import job  
long counter = job.getCounters().findCounter(ExplorationReducer.UpdateCounter.UPDATED)  
    .getValue();  
  
  depth++;  
  while (counter > 0) {  
   // reuse the conf reference with a fresh object  
   conf = new Configuration();  
   // set the depth into the configuration  
   conf.set("recursion.depth", depth + "");  
   job = new Job(conf);  
   job.setJobName("Graph explorer " + depth);  
  
   job.setMapperClass(ExplorationMapper.class);  
   job.setReducerClass(ExplorationReducer.class);  
   job.setJarByClass(ExplorationMapper.class);  
   // always work on the path of the previous depth  
   in = new Path("files/graph-exploration/depth\_" + (depth - 1) + "/");  
   out = new Path("files/graph-exploration/depth\_" + depth);  
  
   SequenceFileInputFormat.addInputPath(job, in);  
   // delete the outputpath if already exists  
   if (fs.exists(out))  
    fs.delete(out, true);  
  
   SequenceFileOutputFormat.setOutputPath(job, out);  
   job.setInputFormatClass(SequenceFileInputFormat.class);  
   job.setOutputFormatClass(SequenceFileOutputFormat.class);  
   job.setOutputKeyClass(LongWritable.class);  
   job.setOutputValueClass(VertexWritable.class);  
   // wait for completion and update the counter  
   job.waitForCompletion(true);  
   depth++;  
   counter = job.getCounters().findCounter(ExplorationReducer.UpdateCounter.UPDATED)  
     .getValue();  
  }  
```  

Note that if you never incremented your counter it will be always 0. Or it could be null of you never used it in your mapper or reducer.  
  
Full sourcecodes can always be found here:  
[http://code.google.com/p/hama-shortest-paths/](http://code.google.com/p/hama-shortest-paths)

