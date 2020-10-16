---
title: 'Apache Hama upcoming features'
date: 2011-10-24T18:59:00.001+02:00
draft: false
aliases: [ "/2011/10/apache-hama-upcoming-features.html" ]
tags : [bsp, bulk synchronous parallel, apache hama]
---

Hi all,  
  
for me it is a pleasure to bring you a couple new things and announcements in this blog post.  
  
Apache Hama 4.0 is on its way, and I want to introduce several pieces of fancyness before we dive into the realtime processing (will be the follow up blog post).  

1.  Revised BSP execution flow
2.  Multiple Tasks per groom
3.  YARN integration 

**Revised BSP execution flow**  
  
The first point is a very good improvement. Writing BSP is totally convenient now.

Let's take a look at the implementation of a BSP in Hama 3.0:

  
```java
class OldBSP extends BSP{  
  
  @Override  
  public void bsp(BSPPeerProtocol arg0) throws IOException, KeeperException,  
      InterruptedException {  
    // TODO Auto-generated method stub  
  }  
  @Override  
  public void setConf(Configuration conf) {  
    // TODO Auto-generated method stub  
  }  
  @Override  
  public Configuration getConf() {  
    // TODO Auto-generated method stub  
    return null;  
  }  
}  
  

```  
You see it in my eclipse generated subclass. You **have to** override a plenty of methods.  
Two of them (if you are not familiar with Hadoop) seem to be very strange. What is that configuration? And why do I need to set this in my code?  
  
Well, this is now history. We have revised the design and now shipping with default implementations of every method in the BSP class.  
  
Additionally we have added a setup and a cleanup method. Setup is now called before the computation starts, cleanup after your computation has been done.  
  
Let's see:  
  
```java
public class NewBSP extends BSP{  
  
  @Override  
  public void setup(BSPPeer peer) throws IOException, KeeperException,  
      InterruptedException {  
    super.setup(peer);  
  }  
    
  @Override  
  public void bsp(BSPPeer peer) throws IOException, KeeperException,  
      InterruptedException {  
    super.bsp(peer);  
  }  
  
  @Override  
  public void cleanup(BSPPeer peer) {  
    super.cleanup(peer);  
  }  
  
}  

```  
It is a lot more intuitive isn't it? Now YOU can control the methods you need to override. And it is fully transparent when the methods are called.  
  
And the best side-effect is that you can send messages and trigger a barrier sync while in setup!  
This enables you now to send initial messages to other tasks and distributed information which hasn't been set in the configuration.  
BTW: Your jobs configuration can now be obtained via peer.getConfiguration().  
  
**Multiple Tasks per groom**  
  
Yeah, we made the step to multitasking. In Hama 3.0 we only had a single task inside the groom.  
This didn't really utilize the machines, because while executing a single BSP, other cores might be unused.  
Like in Hadoop this is now configurable per host. So you can set the number of tasks which should be executed on a machine.  
  
**YARN integration**  
  
If you don't know what YARN actually is, let me clarify a bit. YARN stands for **Y**et **A**nother **R**esource **N**egotiator.  
This is Hadoops new architecture. If you want to learn more, have a look at [Aruns](http://twitter.com/#!/acmurthy) slides [here](http://www.slideshare.net/hortonworks/nextgen-apache-hadoop-mapreduce).  
  
If you now know what the new Hadoop is, I'm proud to tell you that Apache Hama will be a part of it.  
We implemented our own application to fit with the new YARN module and bring Hama to your Hadoop 23.0 cluster.  
No more setup and configuration of additional daemons!  
  
We managed to get a first BSP (Serialize Printing) running on a YARN cluster.  

[![](http://1.bp.blogspot.com/-NUl3Y1C_CBk/TqWYTGdMXNI/AAAAAAAAAVs/v63UzshyjjQ/s400/yarn.png)](http://1.bp.blogspot.com/-NUl3Y1C_CBk/TqWYTGdMXNI/AAAAAAAAAVs/v63UzshyjjQ/s1600/yarn.png)

Serialize Printing on YARN

That is soo great!  
  
We are still in development, so please follow [HAMA-431](https://issues.apache.org/jira/browse/HAMA-431) if you are interested.  
  
Thanks for your attention, and please follow us on the [mailing list](http://incubator.apache.org/hama/mail-lists.html)! We are happy to answer your questions if you have one.