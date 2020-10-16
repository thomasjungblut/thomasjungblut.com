---
title: 'k-Means Clustering with MapReduce'
date: 2011-05-25T16:45:00.016+02:00
draft: false
aliases: [ "/2011/05/k-means-clustering-with-mapreduce.html" ]
tags : [mapreduce, vertex, hadoop, k-means, algorithm, vector, clustering, Apache Hadoop]
---

Hi all,  
  
just finished the MapReduce side implementation of k-Means clustering. Notice that this is a series that contains this post and a follow-up one which implements the same algorithm using BSP and Apache Hama.  
  
Note that this is just an example to explain you k-means clustering and _how_ it can be easily solved and implemented with MapReduce.  
If you want to use a more generic version of k-means, you should head over to [Apache Mahout](http://mahout.apache.org/). Mahout provides k-means clustering and other fancy things on top of Hadoop MapReduce. **This code is also not thought for production usage, you can cluster quite small datasets from 300m to 10g very well with it, for lager sets please take the Mahout implementation.**  
  
**The clustering itself**  
  
We need some vectors (which dimension doesn't matter, hopefully they have all the same dimension). These vectors representing our data, and then we need k-centers. These centers are vectors too, sometimes they are just a subset of the input vectors, but sometimes they are random points or points-of-interest to which we are going to cluster them.  
  
Since this is a MapReduce version I tell you what keys and values we are using. This is really simple, because we are just using a vector, a vector can be a clustercenter as well. So we treat our clustercenter-vectors always like keys, and the input vectors are simple values.  
  
The clustering itself works like this then:  

*   In the map step
*   Read the cluster centers into memory from a sequencefile
*   Iterate over each cluster center for each input key/value pair. 
*   Measure the distances and save the nearest center which has the lowest distance to the vector
*   Write the clustercenter with its vector to the filesystem.

>

*   In the reduce step (we get associated vectors for each center)
*   Iterate over each value vector and calculate the average vector. (Sum each vector and devide each part by the number of vectors we received).
*   This is the new center, save it into a SequenceFile.
*   Check the convergence between the clustercenter that is stored in the key object and the new center.
*   If it they are not equal, increment an update counter

>

*   Run this whole thing until nothing was updated anymore.

Pretty easy, isn't it?:D  
  
  
**Model**  
  
Let's have a look at the involved models:  
  
Vector class:  
  
```java
public class Vector implements WritableComparable<Vector> {  
  
 private double[] vector;  
  
 public Vector() {  
  super();  
 }  
  
 public Vector(Vector v) {  
  super();  
  int l = v.vector.length;  
  this.vector = new double[l];  
  System.arraycopy(v.vector, 0, this.vector, 0, l);  
 }  
  
 public Vector(double x, double y) {  
  super();  
  this.vector = new double[] { x, y };  
 }  
  
 @Override  
 public void write(DataOutput out) throws IOException {  
  out.writeInt(vector.length);  
  for (int i = 0; i < vector.length; i++)  
   out.writeDouble(vector[i]);  
 }  
  
 @Override  
 public void readFields(DataInput in) throws IOException {  
  int size = in.readInt();  
  vector = new double[size];  
  for (int i = 0; i < size; i++)  
   vector[i] = in.readDouble();  
 }  
  
 @Override  
 public int compareTo(Vector o) {  
  
  boolean equals = true;  
  for (int i = 0; i < vector.length; i++) {  
     int c = vector[i] - o.vector[i];  
     if (c != 0.0d) {  
     return c;  
  }  
  return 0;  
 }  
   // get and set omitted  
  
}  
```

You see everything is pretty standard. The _compareTo_ method is just checking equality, just because we don't need an inner ordering- but we want the same keys to get in the same chunk. Be aware that we are returning 1 if they are not equal. Hadoop's quicksort is only swapping the element if it is greater than the other one. <- This is a great tip ;)  
  
If you are not sure aware about this hack, please reimplement this correctly.  
  
The cluster center is basically just an "has-a-vector" class that just delegates the read/write/compareTo method to the vector. It is just devided so we can exactly differ between a center and a vector, altough it is the same.  
  
**The distance measurement**  
  
I've spoken in the algorithm-description about a distance measuring. But I left this open. Let's declare some things:  
  
We need a measurement of a distance between two vectors, especially between a center and a vector.  
I've came up with the manhattan distance because it doesn't require much computation overhead like square-rooting (Euclidian distance) and it is not too complex.  
Let's have a look:  
  
```java
public static final double measureDistance(ClusterCenter center, Vector v) {  
  double sum = 0;  
  int length = v.getVector().length;  
  for (int i = 0; i < length; i++) {  
   sum += Math.abs(center.getCenter().getVector()[i]  
     - v.getVector()[i]);  
  }  
  
  return sum;  
 }  
  
```

As you can see, just a sum of each part of the vectors difference. So easy!!! Let's head to the map implementation...  
  
**The Mapper**  
  
Let's assume that there is a list or a list-like sequencefile-iterating interface that is called centers. It contains ClusterCenter objects that represent the current centers. The DistanceMeasurer class contains the static method we defined in the last part.  

```java
// setup and cleanup stuffz omitted  
@Override  
 protected void map(ClusterCenter key, Vector value, Context context)  
   throws IOException, InterruptedException {  
  
  ClusterCenter nearest = null;  
  double nearestDistance = Double.MAX\_VALUE;  
  for (ClusterCenter c : centers) {  
   double dist = DistanceMeasurer.measureDistance(c, value);  
   if (nearest == null) {  
    nearest = c;  
    nearestDistance = dist;  
   } else {  
    if (nearestDistance > dist) {  
     nearest = c;  
     nearestDistance = dist;  
    }  
   }  
  }  
  context.write(nearest, value);  
 }
```  

Like told in the introduction, it's just a looping and a measuring. Always keeping a reference to the nearest center. Afterwards we are writing it out.   
  
**The Reducer**  
  
Once again let's have a list or a list-like sequencefile-iterating interface that is called centers. Here we need it for storage reasons.  

```java
// setup and cleanup stuffz omitted once again  
@Override  
 protected void reduce(ClusterCenter key, Iterable<Vector> values,  
   Context context) throws IOException, InterruptedException {  
  
  Vector newCenter = new Vector();  
  List<Vector> vectorList = new LinkedList<Vector>();  
  int vectorSize = key.getCenter().getVector().length;  
  newCenter.setVector(new double[vectorSize]);  
  for (Vector value : values) {  
   vectorList.add(new Vector(value));  
   for (int i = 0; i < value.getVector().length; i++) {  
    newCenter.getVector()[i] += value.getVector()[i];  
   }  
  }  
  
  for (int i = 0; i < newCenter.getVector().length; i++) {  
   newCenter.getVector()[i] = newCenter.getVector()[i]  
     / vectorList.size();  
  }  
  
  ClusterCenter center = new ClusterCenter(newCenter);  
  centers.add(center);  
  for (Vector vector : vectorList) {  
   context.write(center, vector);  
  }  
  
  if (center.converged(key))  
   context.getCounter(Counter.CONVERGED).increment(1);  
  
 }  
  

```

So sorry, but this got a bit more bulky than I initially thought it could be. Let me explain: The first loop only dumps the values in the iterable into a list and sums up each component of the vector in a newly created center. Then we are averaging it in another loop and we are writing the new center along with each vector we held in memory the whole time. Afterwards we are just checking if the vector has changed, this method is just a delegating to the underlying vectors compareTo. If the centers are not equal it returns true. And therefore it updates an counter. Actually the name of the counter is misleading, it should be named "updated". If you are now asking how we are controlling the recursion part, head over here and look how it should work: [Controlling Hadoop MapReduce recursion](http://codingwiththomas.blogspot.com/2011/04/controlling-hadoop-job-recursion.html).  
  
  
**Example**  
  
I don't want anyone to leave without a working example ;) SO here is our 2-dimensional input: k-Centers:  

```
(1,1);(5,5)  

```Input vectors:  
Vector [vector=[16.0, 3.0]]  
Vector [vector=[7.0, 6.0]]  
Vector [vector=[6.0, 5.0]]  
Vector [vector=[25.0, 1.0]]  
Vector [vector=[1.0, 2.0]]  
Vector [vector=[3.0, 3.0]]  
Vector [vector=[2.0, 2.0]]  
Vector [vector=[2.0, 3.0]]  
Vector [vector=[-1.0, -23.0]]  

```

Now the jobs getting scheduled over and over again and the output looks like this:  

```
ClusterCenter [center=Vector [vector=[13.5, 3.75]]] / Vector [vector=[16.0, 3.0]]  
ClusterCenter [center=Vector [vector=[13.5, 3.75]]] / Vector [vector=[7.0, 6.0]]  
ClusterCenter [center=Vector [vector=[13.5, 3.75]]] / Vector [vector=[6.0, 5.0]]  
ClusterCenter [center=Vector [vector=[13.5, 3.75]]] / Vector [vector=[25.0, 1.0]]  
ClusterCenter [center=Vector [vector=[1.4, -2.6]]] / Vector [vector=[1.0, 2.0]]  
ClusterCenter [center=Vector [vector=[1.4, -2.6]]] / Vector [vector=[3.0, 3.0]]  
ClusterCenter [center=Vector [vector=[1.4, -2.6]]] / Vector [vector=[2.0, 2.0]]  
ClusterCenter [center=Vector [vector=[1.4, -2.6]]] / Vector [vector=[2.0, 3.0]]  
ClusterCenter [center=Vector [vector=[1.4, -2.6]]] / Vector [vector=[-1.0, -23.0]]
```  
  
So we see that the two initial centers were moved to (1.4,-2.6) and to (13.5,3.75). Cool thing :D  
  
  
Here is the code:  
[https://github.com/thomasjungblut/mapreduce-kmeans](https://github.com/thomasjungblut/mapreduce-kmeans)  
  
The code is located in the _de.jungblut.clustering.mapreduce_ package, if you click run on the KMeansClusteringJob the example data is getting loaded and you can step through the code if you are interested. If you want to run it on your cluster, I assume that you're using 2.2, if not, then you have to take care of the up/downgrade for yourself.  
  
**Note** that if you are submitting this to a real cluster files like _logs or _SUCCESS may be in the directory of your job. This will break the outputter at the end of the Job.  
Either remove the files or modify the method.  
Also note that if you run this with a large file, the number of reducers should be set to 1, otherwise there will be file collisions (See the reducer's cleanup method). This can be done better, but I'll leave this to you ;)  
  
Thank you very much.