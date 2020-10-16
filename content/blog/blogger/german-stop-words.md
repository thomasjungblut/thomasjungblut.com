---
title: 'German Stop Words'
date: 2012-01-24T12:56:00.003+01:00
draft: false
aliases: [ "/2012/01/german-stop-words.html" ]
tags : [java, stop words]
---

Hey all,  
  
I'm doing some text mining in the last time, so I needed a reliable list of german stop words.  
The only real advanced version I have found was the lucene "[GermanAnalyzer](http://lucene.apache.org/java/3_0_1/api/all/org/apache/lucene/analysis/de/GermanAnalyzer.html)". That is the seed of the following list I wanted to share with you.  
  
I already formatted this as an array that is put into a HashSet, so you can easily use it within your Java code via HashSet#contains(token).  
  
```java
public final static HashSet<String> GERMAN_STOP_WORDS = new HashSet<String>(  
     Arrays.asList(new String[] { "and", "the", "of", "to", "einer",  
      "eine", "eines", "einem", "einen", "der", "die", "das",  
      "dass", "daß", "du", "er", "sie", "es", "was", "wer",  
      "wie", "wir", "und", "oder", "ohne", "mit", "am", "im",  
      "in", "aus", "auf", "ist", "sein", "war", "wird", "ihr",  
      "ihre", "ihres", "ihnen", "ihrer", "als", "für", "von",  
      "mit", "dich", "dir", "mich", "mir", "mein", "sein",  
      "kein", "durch", "wegen", "wird", "sich", "bei", "beim",  
      "noch", "den", "dem", "zu", "zur", "zum", "auf", "ein",  
      "auch", "werden", "an", "des", "sein", "sind", "vor",  
      "nicht", "sehr", "um", "unsere", "ohne", "so", "da", "nur",  
      "diese", "dieser", "diesem", "dieses", "nach", "über",  
      "mehr", "hat", "bis", "uns", "unser", "unserer", "unserem",  
      "unsers", "euch", "euers", "euer", "eurem", "ihr", "ihres",  
      "ihrer", "ihrem", "alle", "vom" }));  

```  
Note that there are some english words as well, if you don't need them, they are just in the first section of the array. So you can easily remove them ;)  
  
If you have a good stemmer, you can remove other words as well.  
  
**How did I extract them?**  
  
These words are the words that had the highest word frequency in a large set (> 10 Mio.) of text and html documents.  
  
Have fun and good luck!
