---
title: 'BSP k-means Clustering Benchmark'
date: 2012-01-02T19:23:00.001+01:00
draft: false
aliases: [ "/2012/01/bsp-k-means-clustering-benchmark.html" ]
tags : [bsp, k-means, apache hama, clustering]
---

Hey all,  
  
in my last post I already wrote about the kmeans clustering with Apache Hama and BSP.  
Now we have a detailed benchmark of my algorithm.  
  
Have a look here for the current state taken from here: [http://wiki.apache.org/hama/Benchmarks](http://wiki.apache.org/hama/Benchmarks)  
  
Because it will change during the lifetime of Apache Hama, I made a screenshot from the very first benchmark. Maybe to document performance improvements ;)  
  
Have a look here:  
[![](http://1.bp.blogspot.com/-_eRLxCTCbsM/TwH1LK9Y5XI/AAAAAAAAAXE/NLgNNl6FNZo/s400/bench.JPG)](http://1.bp.blogspot.com/-_eRLxCTCbsM/TwH1LK9Y5XI/AAAAAAAAAXE/NLgNNl6FNZo/s1600/bench.JPG)
  
**Is it faster than MapReduce?**  
Yes! I recently read in the new ["Taming Text" by Grant S. Ingersoll](http://www.manning.com/ingersoll/) that the same amount of workload takes the same time, but in minutes instead of seconds.  
  
However, I want to benchmark it against the same dataset and on the same machines to get a fully comparable result.  
  
**Future Work**  
Besides the benchmark against MapReduce and Mahout, I want to show the guys from Mahout that it is reasonable to use BSP as an alternative to MapReduce. I look forward that they use Apache Hama and BSP within the next year as an alternative to MapReduce implementations for various tasks.  
  
Thanks to [Edward](https://twitter.com/#!/eddieyoon) who made this possible!
