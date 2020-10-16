---
title: 'Apache Hama network throughput'
date: 2011-04-17T14:05:00.002+02:00
draft: false
aliases: [ "/2011/04/apache-hama-network-throughput.html" ]
tags : [hama, bsp, graph, bulk synchronous parallel, apache, apache hama, network, throughput]
---

Hey I've read about a new task: [Improve output of RandBench example](https://issues.apache.org/jira/browse/HAMA-377)  
This is basically about some more output. But this actually caused me to measure the throughput of my virtual Hama cluster.  
  
**My cluster**  
  
Some months ago I decided to get rid of my real hardware server and just go along with [one massive machine](http://www.xtremeforum.de/index.php?page=Attachment&attachmentID=131&h=0cd80e1236c15326fdebdd9ee9d5d53648cdf9d4) that will host multiple virtual machines. I have now two different virtual hosts (virtualbox ftw) with 2 cores and 1gig of memory each.  
The hosts are connected by a virtual Intel PRO/1000 MT Desktop card.  
On server is configured as a namenode, datanode, bspmaster and groom. The other machine is just a datanode and a groom.  
  
**RandBench**  
  
Randbench is just a simple looping utility that will send a constant size data packet randomly across your cluster.  
If you are familiar with BSP you know that you can put messages into a local queue, which is nothing else than storing the packet into the local random access memory. This doesn't really need to be benchmarked. So we can assume that if we run this on a two host cluster there is a 50% probability that the message will be send to the other host over the network. Every host executing its BSP method will actually twice the data send.  
On a two host cluster you can actually assume that the size of the data we are giving at startup will be send to the other host.  
  
**Startup Options**  
  
In my little test we are going to use these parameters: bench 524288 100 2000.  
The first number represents the message size in bytes (so this is 512kb), the second argument telling the benchmark how often we are sending this message in a superstep. And the last argument is the number of supersteps.  
This will sum up to a total size of 97,65625gb. Note that the benchmark is also sending a string as the message tag which tells where the message comes from and goes to. This will cause the data send to be a bit higher.  
In my case this is 30 bytes ("karrigan:61000 to raynor:61000", yea my vhosts are starcraft characters:P) for each messages that has been sent. So 100 \* 2k supersteps will result in 200000 messages with 30 bytes each will sum up to 6000000 bytes, that is roughly 5,7 mb. This won't be a great deal compared to the 97g of byte arrays.  
  
**Result**  
  
Afterwards the benchmark tells you how much time this test took:  

> 11/04/17 13:07:57 INFO bsp.BSPJobClient: The total number of supersteps: 2000  
> Job Finished in 1502.107 seconds

Now we can calculate the average networking throughput, because we know how much data we've sent in a delta of time.  
97gb / 1502.107s = 66mb/s  
  
Note that...  

*   these timings are VM based so I will disclaim a conclusion here
*   the data send is a dummy data array filled with zeros
*   we can therefore greatly run into caching