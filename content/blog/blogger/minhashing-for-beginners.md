---
title: 'MinHashing for Beginners'
date: 2015-03-05T22:36:00.002+01:00
draft: false
aliases: [ "/2015/03/minhashing-for-beginners.html" ]
tags : [minhash, java]
---

Due to popular demand of my MinHashing class in my common library, I decided to do a quick and dirty walkthrough of how to vectorize, MinHash and lookup your data!  
  
**What is MinHashing good for?**  
MinHashing in the first place is used to speed up nearest neighbour lookups. Think of having this huge terabyte sized dataset of movie reviews and you want to find similar reviews (either for deduplication or for recommendation).  
  
Now MinHashing will give you a very small and dense representation of your data by hashing values of a vectorized representation of your data. [You can read more about the theory and some details behind it on Wikipedia.](http://en.wikipedia.org/wiki/MinHash)  
  
**Example Data**  
  
To get some base-line data, let's grab a dataset from Kaggle. [This example uses the 50k movie reviews from IMDB](http://www.kaggle.com/c/word2vec-nlp-tutorial/data), namely the "unlabeledTrainData.tsv". Sign-in and get the data from there- alternatively any data will do if it has the same columnar TSV style formatting, here is an example:  

```
id review  
"9999\_0" "Watching Time Chasers, it obvious that it was made by a bunch of friends. Maybe they were sitting around one day in film school and said, \\"Hey, let's pool our money together and make a really bad movie!\\" Or something like that. What ever they said, they still ended up making a really bad movie--dull story, bad script, lame acting, poor cinematography, bottom of the barrel stock music, etc. All corners were cut, except the one that would have prevented this film's release. Life's like that."  
"45057\_0" "I saw this film about 20 years ago and remember it as being particularly nasty. I believe it is based on a true incident: a young man breaks into a nurses' home and rapes, tortures and kills various women.<br /><br />It is in black and white but saves the colour for one shocking shot.<br /><br />At the end the film seems to be trying to make some political statement but it just comes across as confused and obscene.<br /><br />Avoid."  

```

  
We need to do some massaging here, since there are some HTML parts in it, but for this example we can simply get away with lower casing and removing everything that isn't alphanumeric.  
  
**Tokenization and Vectorization**  
  
The main part here is to normalize and tokenize the data into bigrams that we can use our vectorizer to build TF-IDF or bag-of-word-frequency vectors out of it. Using my common library and Java 8 streams this looks like this:  

```java
Stream<String> lines = Files.lines(  
    Paths.get("unlabeledTrainData.tsv"))  
    .skip(1); // skip the header  
  
// normalization and bigram tokenization  
List<String[]> documents = lines  
    .map((line) -> TokenizerUtils.normalizeString(line))  
    .map((normalized) -> TokenizerUtils.whiteSpaceTokenizeNGrams(normalized, 2))  
    .collect(Collectors.toList());  
  
// every token that occurs more often than 50% in the corpus and less than twice will be discarded  
String[] dict = VectorizerUtils.buildDictionary(documents.stream(), 0.5f, 2);  
List<DoubleVector> vectors = VectorizerUtils.wordFrequencyVectorize(documents.stream().parallel(), dict).collect(Collectors.toList());  
```  

**MinHashing**  
  
Now that we have the vectors, we can MinHash them.  
  
```java
MinHash hasher = MinHash.create(20, HashType.MURMUR128);  
List<int[]> minHashes = vectors.stream().map((v) -> hasher.minHashVector(v)).collect(Collectors.toList());  
```  

In this case, we go for 20 minhashes and a rather strong murmur 128 bit hash. This is usually the default I try out for various text tasks.  
  
**Finding Similar Documents**  
  
To find similar documents, we have two ways: brute force or using an inverted index. Let's start using brute force by finding the top five similar elements to the third (index = 2) movie review in our list.  
  
```java
final int sourceDocIndex = 2;  

// document index  
LimitedPriorityQueue<Integer> queue = new LimitedPriorityQueue<>(5);  

int[] first = minHashes.get(sourceDocIndex);  

Stopwatch watch = Stopwatch.createStarted();  
for (int i = 0; i < minHashes.size(); i++) {  
  if (i != sourceDocIndex) {  
    int[] reference = minHashes.get(i);  
    double similarity = hasher.measureSimilarity(first, reference);  
    if (similarity > 0.1) {  
      queue.add(i, similarity);  
    }  
  }  
}  

System.out.println("Done finding similar docs in "  
    + watch.elapsed(TimeUnit.MILLISECONDS) + "ms!");  

System.out.println("document:");  
System.out.println(lines.get(sourceDocIndex));  
while (!queue.isEmpty()) {  
  double similarity = queue.getMaximumPriority();  
  int index = queue.poll();  
  System.out.println(similarity + " -> " + lines.get(index));  
}  
```

This will output a very interesting pattern:  
  
```
Done finding similar docs in 146ms!  
document:  
"15561_0" "Minor Spoilers<br /><br />In New York, Joan Barnard (Elvire Audrey) is informed that her husband, the archeologist Arthur Barnard (John Saxon), was mysteriously murdered in Italy while searching an Etruscan tomb. Joan decides to travel to Italy, in the company of her colleague, who offers his support. Once in Italy, she starts having visions relative to an ancient people and maggots, many maggots. After shootings and weird events, Joan realizes that her father is an international drug dealer, there are drugs hidden in the tomb and her colleague is a detective of the narcotic department. The story ends back in New York, when Joan and her colleague decide to get married with each other, in a very romantic end. Yesterday I had the displeasure of wasting my time watching this crap. The story is so absurd, mixing thriller, crime, supernatural and horror (and even a romantic end) in a non-sense way. The acting is the worst possible, highlighting the horrible performance of the beautiful Elvire Audrey. John Saxon just gives his name to the credits and works less than five minutes, when his character is killed. The special effects are limited to maggots everywhere. The direction is ridiculous. I lost a couple of hours of my life watching 'Assassinio al Cimitero Etrusco'. If you have the desire or curiosity of seeing this trash, choose another movie, go to a pizzeria, watch TV, go sleep, navigate in Internet, go to the gym, but do not waste your time like I did. My vote is two.<br /><br />Title (Brazil): 'O Mistério Etrusco' ('The Etruscan Mystery')"  
0.9047619047619048 -> "15556_0" "Minor Spoilers<br /><br />In New York, Joan Barnard (Elvire Audrey) is informed that her husband, the archaeologist Arthur Barnard (John Saxon), was mysteriously murdered in Italy while searching an Etruscan tomb. Joan decides to travel to Italy, in the company of her colleague, who offers his support. Once in Italy, she starts having visions relative to an ancient people and maggots, many maggots. After shootings and weird events, Joan realizes that her father is an international drug dealer, there are drugs hidden in the tomb and her colleague is a detective of the narcotic department. The story ends back in New York, when Joan and her colleague decide to get married with each other, in a very romantic end. Yesterday I had the displeasure of wasting my time watching this crap. The story is so absurd, mixing thriller, crime, supernatural and horror (and even a romantic end) in a non-sense way. The acting is the worst possible, highlighting the horrible and screaming performance of the beautiful Elvire Audrey. John Saxon just gives his name to the credits and works less than five minutes, when his character is killed. The special effects are limited to maggots everywhere. The direction is ridiculous. I lost a couple of hours of my life watching 'Assassinio al Cimitero Etrusco'. My suggestion is that if you have the desire or curiosity of seeing this trash, choose another movie, go to a pizzeria, watch TV, go sleep, navigate in Internet, go to the gym, but do not waste your time like I did. My vote is two.<br /><br />Title (Brazil): 'O Mistério Etrusco' ('The Etruscan Mystery')"  
0.9047619047619048 -> "15555_0" "Minor Spoilers<br /><br />In New York, Joan Barnard (Elvire Audrey) is informed that her husband, the archeologist Arthur Barnard (John Saxon), was mysteriously murdered in Italy while searching an Etruscan tomb. Joan decides to travel to Italy, in the company of her colleague, who offers his support. Once in Italy, she starts having visions relative to an ancient people and maggots, many maggots. After shootings and weird events, Joan realizes that her father is an international drug dealer, there are drugs hidden in the tomb and her colleague is a detective of the narcotic department. The story ends back in New York, when Joan and her colleague decide to get married with each other, in a very romantic end. Yesterday I had the displeasure of wasting my time watching this crap. The story is so absurd, mixing thriller, crime, supernatural and horror (and even a romantic end) in a non-sense way. The acting is the worst possible, highlighting the horrible and screaming performance of the beautiful Elvire Audrey. John Saxon just gives his name to the credits and works less than five minutes, when his character is killed. The special effects are limited to maggots everywhere. The direction is ridiculous. I lost a couple of hours of my life watching 'Assassinio al Cimitero Etrusco'. If you have the desire or curiosity of seeing this trash, choose another movie, go to a pizzeria, watch TV, go sleep, navigate in Internet, go to the gym, but do not waste your time like I did. AVOID IT! My vote is two.<br /><br />Title (Brazil): 'O Mistério Etrusco' ('The Etruscan Mystery')"  
```
  
It found two near duplicates to the source document we provided!

Please find the full code [as a gist here.](https://gist.github.com/thomasjungblut/e4759797f5a52d78e06d)  
  
Thanks for reading,  
Thomas