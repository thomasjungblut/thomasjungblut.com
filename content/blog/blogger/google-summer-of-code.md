---
title: 'Google Summer of Code'
date: 2011-05-01T18:02:00.002+02:00
draft: false
aliases: [ "/2011/05/google-summer-of-code.html" ]
tags : [GSoC, bsp, multithreading, bulk synchronous parallel, google summer of code, google, apache, SSSP, apache hama, dijkstra]
---

Hey all,  
  
maybe you've read it already on Twitter, I got picked for GSoC2k11 :D  
Of course I'm very proud and want to thank everybody who helped me across the way. Especially my mentor: Edward J. Yoon.  
  
If you don't know what my project actually was, have a look at [Development of Shortest Path Finding Algorithm.](https://issues.apache.org/jira/browse/HAMA-359)  
  
Basically I want to create a scalable solution, that takes a HUGE graph :) and and provides a fast solution of SSSP (single source shortest path) problems.  
Like I already told in the Apache's Jira issue, I focus on a distributed Dijkstra algorithm that uses an adjacency list. So at first I'll focus on sparse graphs. The adjacency list is stored into a BigTable structure, in my case this will be HBase.  
  
After I finished this, I will focus on a refinement of partitioning and if I have enough time I extend the Dijkstra with an A\* heuristic.  
  
These steps are basically my plan for this summer :)  
  
Right now I started my first commit of Dijkstra's algorithm, it currently contains the old BSP version which I started with weeks ago to get familiar with Apache Hama. It is actually a working example, so feel free to check out the code and run its main method. This will start a local multithreaded BSP with some sample data of the german wikipedia page of Dijkstra's algorithm.  
The class is located here: **de.jungblut.hama.bsp.BSPDijkstra**.  
The repository can be found here: [http://code.google.com/p/hama-shortest-paths/](http://code.google.com/p/hama-shortest-paths/)  
  
Please star this project and the jira issue :D  
  
I'll keep you updated on every change and thoughts I made.   
Thank you very much: Edward, Apache Software Foundation and Google!