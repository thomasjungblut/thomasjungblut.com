---
title: 'Set-intersection and -difference with Hadoop'
date: 2011-06-25T19:01:00.002+02:00
draft: false
aliases: [ "/2011/06/set-intersection-and-difference-with.html" ]
tags : [mapreduce, difference, set, intersection, Apache Hadoop]
---

Hi there,  
  
first off a short message:  
I am currently a bit busy so I need a bit of time for the BSP K-Means-Clustering I promised in one of the previous posts. I am going to contribute this as an example for Apache Hama and not for my GSoC trunk (where to you can find a link now on the right below the twitter box!). Although I am going to setup a github to store my new code things. I'll link this on the sidebar, too.  
  
**The real beginning**  
  
So I came across [a question on stackoverflow](http://stackoverflow.com/questions/6469171/computing-set-intersection-and-set-difference-of-the-records-of-two-files-with-ha) some days ago. It was about computing the set-intersection and -difference with Hadoop's MapReduce. I simply wanted to share my solution with you, this is the main reason of this blog post.  
  
The question was about only two files, we are going to scale this up to "n"-files since this is why we need hadoop ;)  
  
**The input**  
  
Let's assume (like in the question) that we have a file that is looking like this:  
  

> _File 1 contains following lines:_  
> 
> > a  
> > b  
> > c  
> 
> _File 2 contains following lines:_  
> 
> > a  
> > d  

  
Actually it is pretty simple, we have to make sure that these lines are stored in different text files.  
  
**The Mapper**  
  
The main focus and trick in the mapper is how to get the name of the file the task is currently working on.  
Let's have a look at my mapper implementation, called FileMapper:  
  
```java
public class FileMapper extends Mapper<LongWritable, Text, Text, Text> {  
  static Text fileName;  
  
  @Override  
  protected void map(LongWritable key, Text value, Context context)  
          throws IOException, InterruptedException {  
       context.write(value, fileName);  
  }  
  
  @Override  
  protected void setup(Context context) throws IOException,  
          InterruptedException {  
       String name = ((FileSplit) context.getInputSplit()).getPath().getName();  
       fileName = new Text(name);  
       context.write(new Text("a"), fileName);  
  }  
}  

```  
The trick is that when we are importing textfiles, the input split is of the type filesplit which let's you get the path and the name of the file.  
  
The main problem is here to know how many files you've got at all. There can be a nifty hack to just emit the first line of the mapper output with a key that is guranteed to be the first input in our reducer like a plain "a". This is the last line in the setup method.  
  
Now we are going to emit each text line as the key and the filename as the value.  
Then we get a bunch of key / values that look like this, key and value are seperated by space and assuming the files names are File1 and File2:  
  
```
    a File1 // nifty haxx  
    b File1  
    c File1  
    d File1  
  
    a File2 // nifty haxx  
    d File2  
    e File2  

```  
Obviously reducing them will get you an input like this:  
```
    a File1,File2 // our nifty hack :))  
    b File1  
    c File1  
    d File1,File2  
    e File2  

```  
Once again pretty straightforward. Now we can see a clear structure and know what we have to do in our reducer.  
  
**The Reducer**  
  
Now let's have a look at our reducer:  
  
```java
public class FileReducer extends Reducer<Text, Text, Text, Text> {  
  
    private final HashSet<String> fileNameSet = new HashSet<String>();  
      
    enum Counter {  
        LINES_IN_COMMON  
    }  
  
    @Override  
    protected void reduce(Text key, Iterable<Text> values, Context context)  
            throws IOException, InterruptedException {  
        // add for our first key every file to our set  
        // make sure that this action is the first of the entire reduce step  
        if(key.toString.equals("a")){  
            for (Text t : values) {  
                fileNameSet.add(t.toString());  
            }  
        } else {  
            // now add evey incoming value to a temp set  
            HashSet<String> set = new HashSet<String>();  
            for (Text t : values) {  
                set.add(t.toString());  
            }  
              
            // perform checks  
            if(set.size() == fileNameSet.size()){  
                // we know that this must be an intersection of all files  
                context.getCounter(Counter.LINES_IN_COMMON).increment(1);  
            } else {  
                // do anything what you want with the difference  
            }  
   
        }  
    }  
}  

```  
As you can see we are just using our "hack" to build a set of files we had in our input. And now we are just checking if we have full intersection over all files and incrementing a counter on that.  
  
What you're doing with the set difference is left up to you, maybe you want to ignore them and do something with the intersecting lines.  
Have a try with some files on project gutenberg! I would be pretty interested how many lines are equal in different books.  
  
Here in germany were some discussions about plagiarism, maybe this can be helpful to find intersection of many books / papers very fast.  
  
I've just wanted to point out a possible solution of how to deal with such a problem in mapreduce.  
  
Thanks for your attention and support :)