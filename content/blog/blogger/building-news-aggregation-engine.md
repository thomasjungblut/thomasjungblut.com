---
title: 'Building a news aggregation engine'
date: 2013-01-01T15:34:00.000+01:00
draft: false
aliases: [ "/2013/01/building-news-aggregation-engine.html" ]
tags : [named entity recognition, news, crawler, clustering]
---

Hey all,  
  
first off- happy new year!  
It has been a few months now since I posted my last blog post. It wasn't just the stress (open source projects, work, study) that prevented me from writing, but more that I've found no really good topic to blog about.  
  
Personally, what I always found to be interesting are these news aggregation sites. You know them: [Google News](https://news.google.com/), [Yahoo News](http://news.yahoo.com/) etc. They are crawling the web, getting fresh articles about what happens in the world, group them together and present them. Also, they require a lot of machine learning and natural language processing- topics that most of my blogposts are already about.  
  
Since my last posts are more about distributing such algorithms, I want to focus alot more on the application of several algorithms and intentions in order to build up such a news aggregation engine. I know this is a topic where you can write several books about, but I think we can build a working application within three to five blog posts. My personal goal would be to derive a small Java application, that you just start with a seed of a few URLs and it is grouping the incoming pages in realtime- so you can watch the result in an embedded jetty web application by refreshing the site constantly. I currently have some simple parts of it clamped together, but they don't act as a single application so I will rewrite this for the public ;-)  
  
Here is a rough topic grind what we need to cover in order to plug the system together:  
  

1.  Crawling and extraction of news articles

1.  Detect text encodings while crawling (otherwise you'll get low quality results)
2.  Article Classification (you have to detect that a site contains an article)
3.  Boilerplate Removal (you don't care about the design, so remove it!)
4.  Page Deduplication (Archieves or mirrors host the same article, we want to sort out those fast)

3.  Topic modelling of news articles

1.  Named Entity Recognition (News are about people and events, so we have to detect them)

5.  Grouping News

1.  Hierarchical clustering with realtime extension

  

We will use frameworks for some parts of the task, some coursework from online courses, but the most things are written by myself. 

  

So stay tuned, I will start with basic crawling in the next post and how to detect encodings efficiently.