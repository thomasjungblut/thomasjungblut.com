---
title: 'Profiling Apache Hama BSP''s'
date: 2011-04-23T17:09:00.000+02:00
draft: false
aliases: [ "/2011/04/profiling-apache-hama-bsps.html" ]
tags : [bsp, yourkit, apache hama, profiling]
---

Hi all,  
  
sometimes you aren't aware of why your application is performing slow or slower than before and you need a profiler to know in which methods the most time is spent.  
  
**Which profiler should I use?**  
  
That depends on your needs, I prefer [YourKit](http://www.yourkit.com/). It has a fairly good thread monitoring and cool inspectations. Most of the time I'm searching for memory leaks or why a thread has deadlocked, so this profiler is a very helpful tool for these cases.  
  
This time we are focussing on the profiling of a BSP method / class. Or: How you can profile your own Hama application inside of a cluster.  
  
In my case I'm using VM's with Ubuntu, and Windows 7 on my host machine. This might be a common setup. YourKit itself is written in Java and it can be executed on Unix as well.  
We are going to start the application with the profiler agent and tunnel the profiler port with Putty to our host machine: in my case Windows.  
  
Let's go!  

1.  Download Yourkit [here](http://www.yourkit.com/download/index.jsp)
2.  Install Yourkit and [Putty](http://www.chiark.greenend.org.uk/%7Esgtatham/putty/download.html) (if you're running windows, otherwise you can just use your shell) on your host machine.
3.  Download Yourkit for the server machine and untar it
4.  Look for the shared object (libyjpagent.so) in the yjp-9.5.5/bin/linux-x86-32 directory. Note: Make sure you pick the right version for your JVM. 32 bit if you aren't sure, 64 bit else.
5.  Copy it under a path that is more readable like "/usr/local/yk/libyjpagent.so"

Now is YourKit setup properly and we have to set the agent to the Hama configuration on the BSPMaster.  
Look into your "hama-site.xml" and if the property key "bsp.child.java.opts" isn't set yet, you have to override it with that:  
  
>  <property>  
>     <name>bsp.child.java.opts</name>  
>     <value>-Xmx1024m -agentpath:/usr/local/yk/libyjpagent.so</value>  
> </property>

Sure you'll have to replace the agentpath with the path you copy your shared object to. Make sure you have chown'd it with the user that runs Hama. Note: The heap limit is just a copy of the default value in hama-default.xml. Anything configured in hama-default.xml will be overridden by the hama-site.xml configuration parameters.  
  
Now you have to make sure that this libyjpagent.so is on EVERY machine on your cluster. Hama currently can't just let a few tasks start with the profiler (Like Hadoop), you'll have to provide this for every groom.  
  
If this is working, you can just start DFS, start BSPMaster and the agent will be started within. You can see this in your groom's log by an entry like this:  

> 2011-04-22 17:45:53,104 INFO org.apache.hama.bsp.TaskRunner: attempt\_201104221744\_0001\_000001\_0 \[YourKit Java Profiler 9.5.5\] Loaded. Log file: /home/hadoop/.yjp/log/1864.log

Don't forget to take a look into the log file to determine on which port the agent is broadcasting information. This is necassary for the remote connection of Putty.  
In every cases yourkit will test your ports by starting with 10000, if its blocked, it picks 10001 and so on.  
In the log you should see something equal to this:  

> [YourKit Java Profiler 9.5.5] [0.539]: Profiler agent is listening on port **10001**

Ok now we have to setup our Putty on our Windows system.  
Enter all your information on the Session tab: like the hostname of the BSPMaster. In my case this is thomasjungblut@192.168.56.102 and port 22.  
  
Now switch to the Connection->SSH->Tunnels tab and add a new tunnel.  
For port 10001 it will be:  
Sourceport 10001, Destination raynor:10001, Local and Auto.  
The destination host:port pair is the host:port of your BSPMaster.  
  
Now open up the session, login and the profiling data will be tunneled over this port.  
  
Inside of YourKit you'll have to click: "Connect to remote application" and enter localhost:10001 (or the other port if YourKit gave you another).  
Congratulations, you connected to your running application inside of your cluster.  
  
Just a tip if you are profiling Hama. You'll have to deactivate the apache.org filter under Settings->Filter. Otherwise every method call will be filtered. BUT if you just want your own application to profile, this is just noise of the framework. So you can filter it.  
  
Good luck and have fun!