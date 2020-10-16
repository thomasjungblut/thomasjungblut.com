---
title: 'Extracting articles from crawled HTML sites'
date: 2013-01-01T17:27:00.001+01:00
draft: false
aliases: [ "/2013/01/extracting-articles-from-crawled-html.html" ]
tags : [machine learning, boilerplate removal, crawler]
---

So welcome to our second part of [Building a news aggregation engine](http://codingwiththomas.blogspot.de/2013/01/building-news-aggregation-engine.html)!  
If you don't know how crawlers work, have a look into the last part of the series: [Build a basic crawler](http://codingwiththomas.blogspot.de/2013/01/build-basic-crawler.html).  
  
This time we will talk about how to get the actual raw content of a site. Something that we humans see on a newspage isn't visible for an algorithm, because it just has to look at the code- not the actual rendered page. Therefore I will introduce you with a technique called **Boilerplate removal**.  
  
**What is this "Boilerplate"?**  
  
Boilerplate is everything, but the content of the page you are seeking for. Some people call it: "design" or "nagivation" and in their first attempts they try to parse websites with XPath expressions to get their content. But that is not necessary and an unsual pain if the design really shifts.  
  
So the lesson learned is (like in the last blog post as well): IGNORE. Yes you have to ignore the parts you don't want to have. That doesn't mean that we don't take the parts to make decisions- in fact we need those to decide whether a block of html code belongs to the IGNORE- or the content-part.  
Therefore I want to introduce to you the [boilerpipe framework](http://code.google.com/p/boilerpipe/). Boilerpipe is written in Java by Christian Kohlschütter and it is licensed with Apache 2.0.  
  
It uses some really simple machine learning algorithm (a small decision tree) to classify whether a given block of html is content or not. You can read the details in his research paper ["Boilerplate Detection using Shallow Text Features](http://www.l3s.de/~kohlschuetter/publications/wsdm187-kohlschuetter.pdf)["](http://www.l3s.de/~kohlschuetter/publications/wsdm187-kohlschuetter.pdf) which is a really good read.  
In short, it analyses the amount of tokens and links in the previous, current and next block of HTML. It is the same idea we will use later in sequence-learning when we deal with **Named Entity Recognition** in order to get people and events from the article.  
  
In Java, you can use it like this:  
  
```Java
final BoilerpipeExtractor extractor = ArticleExtractor.getInstance();  
String text = extractor.getText(html);  
```  

It is sooo simple and you have the content of a webpage in a string. Of course, this only applies for news articles, since they are shaped really consistent over many news sites therefore the name **Article**Extractor.  
  
But in real world, if we crawl the web, most of the sites we examine with our crawlers won't be news- so the content in the resulting text string might not be a news article. Maybe it is just the imprint or privacy statement that **looks** like an article, but isn't.  
  
**Classifying News sites**  
  
Since I faced this issue while crawling, I had to train some machine learning algorithm on the output of boilerpipe to detect news accurately.  
  
Here is what I did:  

*   Let the crawler run on the top 40 news sites in germany (hand seeded list) for 100k sites
*   Write a small python application to loop over all files and ask me if it was news or not
*   After 1k hand-classified items (was just 1h of work!), train a classifier.

I found out that training a Multilayer Perceptron with a single hidden layer gives arround 93% accuracy with very small number of features, since this is enough for my purposes I stopped there. But I believe that you can get alot more (99% should be really do-able) with ensembling and better features.  
  
But many people don't tell what kind of features they used, so here are mine:  

*   Length of the extracted text
*   URL ends with '/'
*   Length of the extracted title
*   Number of '\\n' in the extracted text
*   Text mention of "impressum","haftung","agb","datenschutz","nutzungsbedingungen" (imprint, authors etc.)
*   Title mention of "impressum","haftung","agb","datenschutz","nutzungsbedingungen" (imprint, authors etc.)
*   Number of upper case letters in the text

It is a mixture of text level features that can be expanded and meta features like lengths.  
I trained a neural net (7-35-1) with sigmoid activations (and 1.0 as regularization) for 10k epochs with Conjugate Gradient. Here are the average results from a 10 fold crossvalidation:  

> Accuracy: 0.9259259259259259  
> Precision: 0.9173553719008265  
> Recall: 0.9823008849557522  
> F1 Score: 0.9487179487179487

That is pretty good for such simple methods! And I didn't even used HTML features like boilerpipe does ;-)  
  
If you want to have some data of my crawl, I have ~1500 classified news articles and 16.5k unclassified- so if you need a bit of german news data for whatever research: let me know via email!  
  
Congratz! We can now crawl the world wide web and classify news sites very accurately. Our next step will be to develop a named entity recognition engine that allows us to extract the keywords we need from our text in order to group them efficiently.
