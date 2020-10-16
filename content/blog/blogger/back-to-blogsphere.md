---
title: 'Back to Blogsphere and how BSP works'
date: 2011-04-08T00:41:00.007+02:00
draft: false
aliases: [ "/2011/04/back-to-blogsphere.html" ]
tags : [mapreduce, hama, dfs, GSoC, testberichte.de, bsp, graph, hadoop, exploration, hdfs, apache, google wave, java]
---

Hey guys,  
  
I'm back! For those of you that do not remember me: I did some cool [Robots for Google Wave](http://botsbytj.blogspot.com/).  
Maybe you remember the times where no export function was in Google Wave, I targeted it with my bot called "PorteXy". It was a Java portation of the existing Google example called ["Exporty"](http://wave-samples-gallery.appspot.com/about_app?app_id=75018). From the count in the AppEngine database table I know a lot of you used it and I wanted to thank you all for your support!  
Now we all now that Google Wave passed by and gets an Apache Incubator project, I have to focus on other themes that could potentially be interesting for you. Since the last time, a lot has happened.  
I am no pupil anymore, I started working at [testberichte.de](http://testberichte.de/), recently got my [OCP](http://education.oracle.com/pls/web_prod-plq-dad/db_pages.getpage?page_id=41&p_exam_id=1Z0_851) in Java and in the mean time I am studying [Computer Sciences at HWR Berlin](http://www.hwr-berlin.de/en/department-of-cooperative-studies/study-programmes/computer-science/).  
You must be thinking: "Oh he must be really busy" - in fact I am not. School kinda sucks, because it is too boring and I have to do something useful. So you've probably heard that Google is offering a new Summer of Code this year: [GSoC2011.](http://www.google-melange.com/gsoc/homepage/google/gsoc2011) And I decided to apply to it, my first thought was that I am going to apply for the Apache Software Foundation.  
Mainly because I worked a lot with [Hadoop](http://hadoop.apache.org/) and Distributed Systems in general and loved to use the Apache2 server running my PHP applications or my Tomcat running my Java applications. But Hadoop wasn't a project eligible for GSoC (Why? I know it has a really large codebase, but there are so many cool task that can be done by students too!), so I had to look for another project. Then I've seen Mahout, I used Mahout for k-means clustering recently and looked at the task offering: [Support more data import mechanisms](https://issues.apache.org/jira/browse/MAHOUT-621). Are they serious? Just importing raw data into SequenceFiles? Seriously, you can't use 12(!) weeks for that task coding 40h/week. This would be a task for a weekend, if at all. So I was looking for something more cool and complex, but this should be in Java and somehow related to distributed systems.  
  
So I came across [Apache Hama](http://incubator.apache.org/hama/) and this task is smiling at me: [Development of Shortest Path Finding Algorithm](https://issues.apache.org/jira/browse/HAMA-359). This was the task I've searched for, I love distributed Computing and I love Graphs.  
You probably know that Hama uses [BSP (Bulk synchronous parallel)](http://en.wikipedia.org/wiki/Bulk_synchronous_parallel) for its computing.  
This is actually an abstraction to MapReduce. Have a look at this picture on wikipedia:  
  

[![BSP](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Bsp.wiki.fig1.svg/1024px-Bsp.wiki.fig1.svg.png)](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Bsp.wiki.fig1.svg/1024px-Bsp.wiki.fig1.svg.png)

  
  
If you translate MapReduce into BSP, then your map-phase will be the local computation-phase. After that you are going to merge the map output and sort it. That would be the communication phase. Now comes the Barrier Synchronisation: You know that no reducer can run if not all map task completed. So this step is a bit merged with the communication phase, but after that it is entering a new local computation phase: the reduce-phase.  
So you see, BSP is not the same like MapReduce, but you can actually describe MapReduce with BSP.  
  
What is the advantage of using BSP instead of MapReduce in Graph Processing:  
Those of you who implemented graph algorithms with MapReduce probably know what a pain it is to pass messages through HDFS and process them in several chained jobs. I believe it was this paper here, what described very well how this works: [http://www.umiacs.umd.edu/~jimmylin/publications/Lin\_Schatz\_MLG2010.pdf](http://www.umiacs.umd.edu/%7Ejimmylin/publications/Lin_Schatz_MLG2010.pdf)  
  
Even if you don't know it how to implement them (maybe I'll go for a tutorial later on) believe me: this is not optimal!  
Why should we pass messages through DFS? Well, just communicate the messages!  
And that is the real advantage of BSP, you having less sync (in MapReduce you have 3 major sync steps in a job: the beginning, the reducer and the end. The end, because you can't run a follow-up job before the last one finishes, and therefore the beginning too) and a more "real-time" messaging than MapReduce.  
  
BSP is actually used at Google too: [http://googleresearch.blogspot.com/2009/06/large-scale-graph-computing-at-google.html](http://googleresearch.blogspot.com/2009/06/large-scale-graph-computing-at-google.html), you can google for the Pregel paper for further reading.  
  
In my opinion Apache Hama has a great perspective, because there is no other OpenSource alternative for BSP processing and the best thing of all: I'll be part of it.  
  
Back to the shortest path finding. As you can see, I already started to implement a basic Dijkstra and made some thoughts on how this is going to work within a large cluster, mainly in terms of scalability.  
If you are interested in shortest paths in large graphs you should definitely bookmark this issue or at least vote it up.  
  
The application deadline of GSoC is in approx. 10 hours and I hope ASF will pick me :-)  
  
This was a really large first posting and I want to thank especially **Edward J. Yoon**, he is my mentor at Apache Hama and told me that I should blog again. This is part of his "young open source stars"-support ;) Visit his [blog](http://blog.udanax.org/) or follow him on [twitter](http://twitter.com/#%21/eddieyoon), he is a real genius!  
  
Obviously you can also follow me on twitter, look at the sidebar on the right side.  
  
Greetings from Germany!