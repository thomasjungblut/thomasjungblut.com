---
title: 'Series: K-Means Clustering (MapReduce | BSP)'
date: 2011-05-21T09:07:00.000+02:00
draft: false
aliases: [ "/2011/05/series-k-means-clustering-mapreduce-bsp.html" ]
tags : [mapreduce, bsp, bulk synchronous parallel, k-means, apache hama, clustering, Apache Hadoop, pagerank]
---

Hi all,  
  
I was a bit busy last time so I hadn't that much time to blog.  
Several days ago after PageRank I had an idea to implement k-means clustering with Apache Hama and BSP.  
Now I've decided to first implement a MapReduce implementation of it, since this is very simple: Reading the centers in setup's method and calculate the distance from each vector to the centers in map phase. In the reduce phase we are going to calculate new cluster centers.  
  
This is very very straightforward. So this will be a series about a MapReduce implementation and a better one with BSP.  
  
'till then!  
  
Greetzz