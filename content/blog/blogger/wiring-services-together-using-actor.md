---
title: 'Wiring services together using the actor model'
date: 2013-06-08T18:42:00.000+02:00
draft: false
aliases: [ "/2013/06/wiring-services-together-using-actor.html" ]
tags : [soa, actor model, actors, java]
---

Hey folks,  
  
I had a lot of stuff to do in my last semester, thus I couldn't write up the post about news clustering completely yet. The stress will keep constant until my study is finally over, I guess until arround the beginning of october. Then I will have more time to explain this topic more thoroughly, of course with lots of pictures ;)  
  
But today I have a bit of time and wanted to share a smart idea of joining two cool things together: **Service Oriented Architectures** (SOA) and the **Actor Model**. We will go through a small definition of both, why we should join these technologies and at the end have a small look on how to implement such an architecture with plain Java.  

### Why Sevice Oriented Architectures?

Service Oriented Architecture is a design pattern based on chunking a large software system into smaller and discrete modules called services. The goal is to design services solely based on their functionality and thus decouple them from other services. The result should be an ensemble of services that are only defined by their simplistic interfaces that offer functionality to the outside world. 

A pretty intuitive example is a checkout process in ecommerce systems: it is a large and complicated process that can be chunked into simpler parts. At the beginning of your internet shopping trip you are likely to visit a few products. Retrieving products and their information is also a good candicate for a service, because it has a defined behaviour and its functionality can be reused very well for other purposes. The corresponding interface could be something like this:

```Java
// could directly retrieve objects from a database   
public Product getProduct(long productId);   
// could be a proxy to another service  
public Opinions getUserOpinions(long productId);    
// could be a filesystem call  
public Images getProductImages(long productId);   
```  
For many of you, this might look like a data access object (DAO) that is going to ask an underlying database implementation about the concrete values. This is **not** what the goal of the service itself should be: a service defines just the _functionality_ and not how it transports the information (whether there is a RPC call or an Oracle database in the back shouldn't be part of your interface/service design).  
Thus the user should never care about the underlying complexity or the implementation of the system. That is a similar statement like in _Object Oriented Programming_ that naturally yields to polymorphism (multiple implementations of an interface).  
  
**But how to wire services together?**

Imagine a computing cluster where a scheduler is a service that looks at the resources in the cluster and makes decisions on where to place your application best. How does it communicate the result of its computation to the next service- say the service that handles allocation of those resources?  
  
There are basically few ways to handle this:  

1.  Just call the next service via its interface methods (synchronous call)
2.  Send a message to the other service and continue (asynchronous call)
3.  A superviser/manager that calls services after each other (supervised call)

[I'm no async evangelist](http://www.youtube.com/watch?v=bzkRVzciAZg), but I will try to tell you about my experiences and why I think that asynchronous messaging is a much more viable way in highly concurrent scenarios.  
  
Consider the following most simplistic scenario when dealing with services:  
[![](http://2.bp.blogspot.com/-urjjXzppRbc/UbM_ekkcYdI/AAAAAAAABzE/tOT1sKsAq_8/s400/super_simple_service_chain.PNG)](http://2.bp.blogspot.com/-urjjXzppRbc/UbM_ekkcYdI/AAAAAAAABzE/tOT1sKsAq_8/s1600/super_simple_service_chain.PNG)

Super simple service chain

In this case the services form a simple chaining, so calls from Service A can only reach B, and B can only reach C. Clearly, there is no need for anything spectacular- if I were in that situation I would put those services in a list and call them after each other:  
  
```Java
List<Service> services = ... some list ...;  
Result lastResult = null;  
for(Service service : services){  
    lastResult = service.call(lastResult);  
}  
// go further down the road with the final service result  
```  

This is what is called the Pipeline pattern, because you feed the result of the stage before to the next one and enhance/filter/modify the results. This is a supervised architecture, because you are controlling how the data flows by hardcoding the control flow in the above loop.  
  
**But what happens when we want to process requests through the services concurrently?**  
  
Now that is where the problems usually begins. The above architecture will work in a concurrent environment without any problems, as long as the code that is calling the services in sequence is thread-safe **and** all the services are designed thread-safe. That means, if your service has state (for example our scheduler that has information about the current cluster resources), it needs to lock all access to it while modifying it. This is not a big deal for someone who worked with threads already and is familiar with standard libraries like in Java (see for example a [ReadWriteLock](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/locks/ReadWriteLock.html)).  
  
However, think of what complexity you are imposing to your software in that moment:  

*   Every service needs to handle the locks for itself and must be thread-safe
*   Even with standard library support you clutter your code with try/finally unlock statements
*   The performance is likely to suffer in high concurrency/throughput environments

Overall, this is a complexity nightmare (have you ever traced down a race condition?) and exactly what we wanted to avoid when choosing a SOA.

It just begins to get worse:

[![](http://3.bp.blogspot.com/-D4QsvJH2n7E/UbNEudeh04I/AAAAAAAABzU/GpqzEr2yR1Y/s400/slightly_more_complex_service_chain.PNG)](http://3.bp.blogspot.com/-D4QsvJH2n7E/UbNEudeh04I/AAAAAAAABzU/GpqzEr2yR1Y/s1600/slightly_more_complex_service_chain.PNG)

What do you want to do when Service B locks it's state for a long time (e.g. our scheduler just received a big update from a rack that just got back online)? Clearly other services will have to wait and throughput and responsiveness starts to suffer severely. You can spin this even a tick further: What if you're in a distributed environment and Service B just doesn't exist anymore (server goes down, netlink breaks)? Services A\_\[1-n\] will have to wait until B comes back online and can't do anything else than wait. Always note that those are the easiest service architectures! In reality your call graph looks much more connected throughout all services.  
  
All that is an issue if you're relying on synchronous communication between services. What we need is to define a decoupling between the services- not of their functionality, but this time of the communication between them.  
  

### The Actor Model

The most intuitive way to make asynchronous communication to happen is to send a message! 

If I want Bob to work on issue X in our bug tracker, I write him an email that he should have a look at issue X soon. Now Bob can decide on his own when he looks into his mailbox (for example when he is finished with the current task) and also when he wants to start working on issue X. Transferred to computer science: you don't disturb the service in doing its job as you would with locking or interrupts.

The intuition is the same behind the actor model, here Bob would be the actor and emails would be some kind of messages that land in an actors' inbox. Normally we want to have many more actors that can interact with each other and provide functionality. That's where we come back to services: so actors and services both provide functionality / behaviour and messaging between actors helps us to solve the synchronous comunication problems. 

While you can use a framework like [Akka](http://akka.io/) for the actor model, it is very easy to implement in Java using the standard API:  
  
```java
public class SimpleActor<MSG_TYPE> implements Runnable {  
  
  public static interface Service<MSG_TYPE> {  
  
    void onMessage(MSG_TYPE message);  
  
  }  
  
  private final LinkedBlockingQueue<MSG_TYPE> inbox = new LinkedBlockingQueue<>();  
  private Service<MSG_TYPE> messageListener;  
  
  public SimpleActor(Service<MSG_TYPE> listener) {  
    this.messageListener = listener;  
  }  
  
  public void message(MSG_TYPE message) {  
    inbox.add(message);  
  }  
  
  @Override  
  public void run() {  
    while (!Thread.currentThread().isInterrupted()) {  
        // blocks until we have a new message  
        MSG_TYPE take = inbox.take();  
        messageListener.onMessage(take);  
        // interrupted exception omitted  
    }  
  }  
  
}
```  

As you can see, it is super easy to setup a producer/consumer inbox within a thread and use the service as a callback listener. All concurrency and signalling is the problem of the underlying implementation of the inbox, here a [LinkedBlockingQueue](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/LinkedBlockingQueue.html) is used.  
  
Now your Service can easily implement the callback, with the guarantee that every message that arrives will be processed sequentially (because your run method takes only one message at a time from the queue). So you will never have to worry about explicit locking in your code, you just have to react to events that happen.  
  
A simplistic and fictitious variant of a scheduler that reacts can look like this:  
  
```Java
Service<SchedulingEvent> scheduler = new Service<SchedulingEvent>() {  
    
  @Override  
  public void onMessage(SchedulingEvent message) {  
    if(message.isSchedulingMessage()){  
      if(cluster.getFreeMemory() > message.memoryNeeded()){  
        // tell the allocation actor to run that   
        message(Allocator.class, new Allocation(message));  
      }  
    } else if(message.isUpdateMessage()){  
      cluster.update(message.getFreeMemory());  
    }  
      
  }  
};  

```  
You can see, the logic is very clean, no locking is needed and you can react on specific events- or ignore them if you don't care about them. In a real-life scenario I would add an _ActorManager_ that helps messaging by a defined name or class, or you can design actors as singletons and directly access their messaging methods.  
  
Let's get back to our problems we had with the synchronous and supervised calls and see if we solved them:  
  

*   Locking complexity
*   Best case: no locking anymore in the service code itself
*   Code clutter
*   Everything looks very clean and tied to the servers functionality
*   Performance
*   Every service can work at its own speed/pace, no polling is involved
*   What if the **inbox fills up** faster than the messages can be consumed?
*   **Is it really faster?**
*   Availability
*   When a service goes down, it is up to the messaging implementation to buffer those messages in a secondary storage so they can be retrieved after a crash. But certainly this is now easier to implement and maintain.

Seems we have a few open questions that definitely must be addressed by the engineer. To make a good decision you will need architecture knowledge on how the services interact with each other, but in the end it looks like a very nice model for the communication between services.  
  
**But what are the clear disadvantages of this actor model?**  
  
Of course there is no silver bullet in such technology. The actor model also has drawbacks, here are a few that I have observed when working with event driven actor architectures:  

*   You have no explicit returns, e.g. if an exception happens you will be notified long time afterwards via message that comes back
*   Debugging is the hell if you don't optimize readability for it

The first bullet point is problematic, yet another example: what if you want to get a return value for a query that is part of our service functionality? It sounds like a huge detour to send messages when all you could do is to call a function. Always keep your goal in mind:   
Do you want to create a service for functionality? Or do you want to create services that interact with each other? Both are (by definition) service oriented architectures and both can be used in conjunction with each other - choose wisely which one you need to use.  
  
The second bullet point is something that will drive developers nuts in their daily lifes. When writing an actor model, be sure that your actors are named accordingly to their usecase. Nobody wants to send a message not knowing whose inbox to reach. So make it clear to which destination you're sending a message to.  
Something that I have employed to neglect this was to use classnames as the address and make all services singletons. This helps to write code like this:  

```java
// class name based routing  
message(Allocator.class, new Allocation(message));  
// singleton based routing  
message(Allocator.getInstance(), new Allocation(message));  
// singleton based direct messaging, NOTE getInstance() is a  
// convention, not a defined interface!  
Allocator.getInstance().message(new Allocation(message));
```  

People working with that will immediately know, that they can click on the class entry in their IDE and get to the implementation fast and will always know where the message will end up.  
Still the amount of scrolling to be done is too damn high! I hope that the IDEs will soon catch up on those paradigms (especially when lambdas and function pointers come with Java8) and make it easy to navigate to callback/listener methods.  
  
So thank you very much for reading, you've definitely won a cookie for reading the whole article.
