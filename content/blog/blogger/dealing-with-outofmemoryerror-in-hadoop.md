---
title: 'Dealing with "OutOfMemoryError" in Hadoop'
date: 2011-07-09T12:51:00.000+02:00
draft: false
aliases: [ "/2011/07/dealing-with-outofmemoryerror-in-hadoop.html" ]
tags : [oom, out of memory, Apache Hadoop]
---

Hey all,  
  
some of you may have seen some kind of OutOfMemoryError in your Hadoop jobs, which looks like this:  


> **java.lang.OutOfMemoryError: unable to create new native thread**  
>     at java.lang.Thread.start0(Native Method)  
>     at java.lang.Thread.start(Thread.java:597)

  
This is mainly what is the theme of today's blog post. I'll be writing about what causes this to happen and how to solve it.  
  
As it is currently Juli 2011, I refer to Hadoop 0.20.2 since this is the latest stable release.  
  
**The Cause**  
  
I've seen many OutOfMemoryErrors in my short life. But this error isn't a "my jvm run out of heap" error. We'll usually see this in deeper in the stacktrace, in my case this was caused by _FileSystem.create()_. So this error is causing a OOM(will refer to it for OutOfMemory), but not in your JVM. The process that gets started by Hadoop which will execute your task, can't allocate more memory on your host-system.  
  
What does _FileSystem.create()_ do to let your host system get out of memory?  
Well, I laughed at it first, too. It was setting the permissions with CHMOD.  
  
The first time I've seen this error in the logs, I googled it. I came across a blogpost which rants about several concerns with Hadoop I come across every day (e.G. Zombie Tasks, XCievers), but it tells the truth.  
  
Let's see what they wrote on this kinds of error:  
  

> **Terrible with memory usage**  
>   
> We used to have problems with Hadoop running out of memory in various contexts. Sometimes our tasks would randomly die with out of memory exceptions, and sometimes reducers would error during the shuffle phase with "Cannot allocate memory" errors. These errors didn't make a lot of sense to us, since the memory we allocated for the TaskTrackers, DataNodes, and tasks was well under the total memory for each machine.  
>   
> We traced the problem to a sloppy implementation detail of Hadoop. It turns out that Hadoop sometimes shells out to do various things with the local filesystem.  
> [...]

Source: [http://tech.backtype.com/the-dark-side-of-hadoop](http://tech.backtype.com/the-dark-side-of-hadoop)  
  
What I've seen is that the _RawLocalFileSystem_ is going to create a file on the disk and is setting the permission on it with a given FSPermission object which will represent an equal call to CHMOD "XXX" on your system's shell.  
In fact, Hadoop is going to launch a process using the ProcessBuilder, to just CHMOD the file it just created.  
  
I guess you are now asking yourself, why this is going to cause an OOM error. If you not already followed the link I've provided above, I recommend to do so.  
But I'm going to clarify this a bit more.  
  
The ProcessBuilder in Java under linux will fork a child process. This process is allocating the same amount of memory as its parent process did. So for example you've provided your Hadoop Job to allocate 1G of Heap per Task, you'll end up temporary using 2G of your hostsystem when calling _FileSystem.create()_.  
  
Let me explain a bit more about the fork() in linux.  
When calling fork(), linux is going to setup a new task-structure which is going to be a full copy of the parent process. The process is going to get a new process-id and is using the same memory as its parent process. Everything seems fine, but if one of them is going to modify or write something in the memory, the memory will be duplicated. This is called **copy on write**.  
  
If you're able to read german, I recommend you the book "C und Linux" of "Martin Gräfe". It is very well explained there (although it is in a C context).  
  
I had a job which downloads lots (millions) of files and creates a new file for it inside a mapper. This is going to be parallized so we have multiple task per host machine. The funny thing is, that each task is going to shell-out and CHMOD'ing the file it just created, if other jobs are going to run then, they are simply failing, because they cannot allocate enough memory for their JVM. So did the tasks itself.  
  
The worst thing is to confuse this with JVM OOM's, they are dependend on what you're task is doing. So if you're having a 2GB HashMap to compute things faster in RAM, but your JVM has only 1GB Heap, this is clearly a JVM OOM since no more Heap can be allocated INSIDE.  
A usual fix for this is to increase the heapsize of the JVM with -Xmx2G or -Xmx2048M. **Don't do this in this case of Host-OOMs!** This will even worse the problem. Especially in this specific problem, a child process will then allocate even more RAM, which probably yields in faster failure.  
  
Now let's see how to solve this.  
  
**Solve the problem**  
  
"tech.backtype.com" is saying, that adding a lot of swap space is going to solve the problem. I am not a fan of lot's of swap space on Hadoop nodes, mainly because there is a high chance that tasks are getting swapped (due to misconfiguration, other processes etc). And JVM's are not constructed to work correctly when swapped. So you can think of really degrading performance once a task gets swapped. I was suprised that they told that everything got far more stable afterwards. Hell they must have the worst problems on their cluster.  
  
I've backtracked the problem to FileSyste.create(). Actually it was _create(FileSystem fs, Path file, FsPermission permission)_.  
  
Actually, this will cause CHMOD to be forked twice. So the first fix was to use the non-static methods.  
Using the non-setting FSPermission methods like _create(Path path)_ will cause a process to be forked anyways.  
So you have to call the abstract method in FileSystem directly. It has this signature:  
  
```java
create(Path f,  
  FsPermission permission,  
  boolean overwrite,  
  int bufferSize,  
  short replication,  
  long blockSize,  
  Progressable progress)
```

The way I prevent Hadoop from forking the process is going to set the permission to _null_.  
This will cause a NullPointerException in the NameNode while setting the permission in the distributed FileSystem (the permissions you can see in the webfrontend). This is because the DFSClient is going to RPC the NameNode to register the new created file in the NameNode.  
So you have to patch your NameNode by adding a null-check in the setPermission method.  
Like this:  

```java
public void setPermission(String src, FsPermission permissions) throws IOException {  
    if(permissions == null){  
       permissions = FsPermission.getDefault();  
    }  
    namesystem.setPermission(src, permissions);  
  }  
```  

**Note** that this is going to not work if you're running Hadoop with lots of different users. I have just one user, which is also the user on the host-system. So this won't cause any problems in my case.  
  
And be aware that adding this nifty "hack" to your code will cause your job to not run on the LocalFileSystem, since this isn't null-safe, too.  
  
Now each task is not going to fork any process at all.