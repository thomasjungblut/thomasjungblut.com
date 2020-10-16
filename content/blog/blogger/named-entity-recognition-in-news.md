---
title: 'Named Entity Recognition in News Articles'
date: 2013-01-27T13:54:00.000+01:00
draft: false
aliases: [ "/2013/01/named-entity-recognition-in-news.html" ]
tags : [named entity recognition, news]
---

Hello,  
  
been a while since the last post. Was into a lot of work- couldn't really get up on the weekend to write about   named entity recognition in news articles. But today we can finally talk about it.  
  
This post is about a few things:  

1.  What is named entity recognition?
2.  How do we model it as a machine learning problem?
3.  What features to extract for our learner?

So let's dive in, if you have taken the Natural Language Processing (NLP) class on Coursera, you will be familiar with the topic already and should start with the features we use in the third paragraph.  
  
**What is named entity recognition (NER)?**  

The most easiest explanation is to find word level concepts like a location or person in an unstructured text file. Let's say we have the following snippet of text, shamelessly stolen from Wikipedia:  

> _Jim bought 300 shares of Acme Corp. in 2006._

The idea is to tag parts of this sentence with tuples of concepts and their value, such that we get this:  

> _**<PERSON, "Jim">** bought 300 shares of **<CORP,"Acme Corp">** in 2006._

So we detected _Jim_ as a person and the _Acme Corp_ as a corporation in this sentence.  
But how do we need this for our news aggregation engine? A very simple assumption: News are about people, what they did and where they did it. A simple example would be:  

> _"David Cameron talks in Davos about the EU"_

The topic is clearly about the person _David Cameron_\- the action of talking and a location namely _Davos_ in Switzerland. This is needed for our news aggregation engine to cluster topics together, even if their content is slightly different. We will talk about this in one of the following blog posts.  
  
**How do we model this as a machine learning problem?**  
  
Basically, it is nothing else than a (multiclass) classification problem. Namely classifying if a token belongs to the class PERSON, LOCATION- or O which is none of the ones before.  
  
The main difference to other NLP tasks is that we need the context of a token, because the meaning of the current token is depending on the previous or the following token/class. So let's have a look at another example:  

> _It did not, and most of Mr. Cameron’s European partners do not wish to revisit that fundamental question._

How do we recognize Cameron in this case here? There are two cases that are representative for english. First the "Mr." is a strong indicator that there is following a name, second the "'s" is a strong indicator that the previous token was a name. Also prepositions like "of", "to", "in" or "for" are likely indicators for names or locations. The trick that I learned from the NLP class on coursera was the encoding of the text as a sequence of unigrams. The previous text would look like this:  

> most O  
> of O  
> Mr. O  
> Cameron PERSON  
> 's O

So what we do is predicting the label of the current unigram, by looking at the previous and following unigram and maybe also at the previous label. The reason we need to look at the previous label is that names could be composed of name and surname like _David Cameron_. So if the last class was a person, in many cases the current class might also be a person.  
  
So what kind of classifier do we use? I used a self-written version of the **Maximum Entropy Markov Model** supplied in week four of the NLP class exercise optimizable with normal Gradient Descent or Conjugate Gradient (or even with the given quasi newton minimizer supplied in the class). Also I written some utilities to extract sparse feature vectors as conveniently as in NLP class.  

[You can browse some more code in my common repository's NER package](https://github.com/thomasjungblut/thomasjungblut-common/tree/master/src/main/java/de/jungblut/ner).
  
**What features to extract for our learner?**  
  
Features are pretty important, they must cover structural as well as dictionary features. Here is my feature set for dictionary features:  
*   current word
*   last word
*   next word

And for structural features:

*   previous class label
*   current word upper case start character
*   last word upper case start character
*   current word length
*   current word containing only alphabetic characters  (1=true or 0=false)
*   next word containing only alphabetic characters  (1=true or 0=false)
*   was the last word a preposition
*   was the last word a special character like dot, comma or question mark
*   last word ending with "ing"
*   previous/current/next words POS tag

POS tags are pretty important as nouns are more likely to be a person or location. Also other POS tags might lead to one of those classes by the previous word or next word, e.G. verbs are pretty likely to follow a name. All these features are pretty sparse, thus we are building a dictionary of all possible features we observed during training time and encode a dictionary of features we have seen.  
For example the feature _prevPosTag_ could have value _"prevPosTag=NN"_. This is a rare occation as we have a unigram encoded as a feature vector, so it totally makes sense to encode them with a sparse vector.  
  
Now that we have our text encoded as a list of vectors (a sparse vector for each unigram we observe) we can optimize the vectors and their outcome by minimizing a conditional likelyhood costfunction to be used in the Markov Model. This will learn conditional probabilities between features and the outcomes, describing when we are observing a feature- how likely is that the PERSON class occurs, for math lovers this can be described as P(class | features). I optimized my model for 1k iterations using conjugate gradient and obtained a very low training error of arround 5%. To obtain the class for a feature vector we are doing a viterbi decoding on the learned weights. The trick here is that you need to encode the feature vector for all the possible classes, only that way the viterbi can decode the probabilities correctly.  
  
So yeah, that is basically what it's all that named entity recognition is about. The next blog post will most probably be about how to cluster the news together using the information we gathered through this post.  
  
Bye!