---
title: 'Build a basic crawler'
date: 2013-01-01T16:37:00.001+01:00
draft: false
aliases: [ "/2013/01/build-basic-crawler.html" ]
tags : [encoding, crawler]
---

So welcome to our first part of [Building a news aggregation engine](http://codingwiththomas.blogspot.de/2013/01/building-news-aggregation-engine.html)!  
This time we talk about how we build a really simple crawler, that crawls us some sites. 
The (more or less) [formal definition of a crawler is stated in Wikipedia](http://en.wikipedia.org/wiki/Web_crawler):

> A **Web crawler** is a computer program that browses the [World Wide Web](http://en.wikipedia.org/wiki/World_Wide_Web "World Wide Web") in a methodical, automated manner or in an orderly fashion.

The basic workflow looks like that:  

*   Seed some URLs and **queue** them up
*   Keep a **set** about what URLs were visited
*   While our **queue** is not empty (or we reached some maximum amounts of sites)
  *  Get the first URL from the **queue**, put it into the visited **set**
  *   Query the URL, obtain some HTML
  *   Extract new URLs from the HTML and **queue** them up if they are not in the visited **set** yet

A small Java program could look like this:

```Java
String[] seedUrl = new String[]{"http://www.wikipedia.com/"};  
final Deque<String> linksToCrawl = new ArrayDeque<>();  
final HashSet<String> visited = new HashSet<>();  
  
linksToCrawl.addAll(Arrays.asList(seedUrl));  
visited.addAll(Arrays.asList(seedUrl));  
  
while (fetches < 100 && !linksToCrawl.isEmpty()) {  
      String urlToCrawl = linksToCrawl.poll();  
      // open a connection and parse HTML  
      ...  
      // loop over all links we found on that page  
      for (String outlink : extractedResult.outlinks) {  
         if (visited.add(outlink))  
            linksToCrawl.add(outlink);  
      }  
      fetches++;  
}  

```

It looks really simple, but tell you what? It is more difficult than it looks.  
Once you started with it, you wish you never started with that- the web is ugly. I'm working in the backend team at work and I'm surrounded by a lot of garbage from various data sources, but the web is a whole new level. Just a small excerpt of what you need to deal with:  

*   Encoding issues (we will fix them later on in this post)
*   Link expansions (relative vs. absolute URLs vs. JavaScript URLs like void(0); ) 
*   Not parsable stuff like videos or images

So for example, how do you deal with data you can't handle (which don't contain HTML)? You IGNORE it.  For this kind of purpose I've clamped together a bunch of suffixes that can happen within links and they guard against running into not parsable binary data:  
  

```Java
Pattern IGNORE_SUFFIX_PATTERN = Pattern  
      .compile(".\*(\\\\.(css|js|bmp|gif|jpe?g|png|tiff?|mid|mp2|mp3|mp4|wav|avi|mov|mpeg|ram|m4v|pdf|iso|rm|smil|wmv|swf|wma|zip|rar|gz))$");
```  
So as you can see, I'm guarding against anything here. Of course they are completely useless if someone does not supply a suffix of the filetype. In the latter case, you will need to get on the stream and look for a html or body tag to verify it is really a website (which is the worst case, because you're wasting bandwidth and time the crawler could use to do something else).  
  
Something that poked me for quite a while were encoding issues. As a german, umlauts like _öäüß_ are completely garbled if you read them with the wrong encoding. So most of the time, germany news look really bad and you can directly throw them into the next trash bin.  
  
I ran across a project of the Mozilla foundation called **universalchardet** (abbrev. for universal charset detector) and [its Java descendent called **juniversalchardet**](http://code.google.com/p/juniversalchardet/). It detects encodings with really high accuracy and helps you to get the content of your crawl correct like you would browse the site.  
  
In Java you have to obtain the site via streams, so let me show you a small example of **juniversalchardet** and how to read a stream into a string of HTML with NIO.  
  
```Java
  String someURLAsString = "http://www.facebook.com";  
  URL url = new URL(someURLAsString);  
  InputStream stream = url.openStream();  
  String html = consumeStream(stream);  
    
// the helper methods  
public static String consumeStream(InputStream stream) throws IOException {  
  try {  
    // setup the universal detector for charsets  
    UniversalDetector detector = new UniversalDetector(null);  
    ReadableByteChannel bc = Channels.newChannel(stream);  
    // allocate a byte buffer of BUFFER\_SIZE size   
    // 1mb is enough for every usual webpage  
    ByteBuffer buffer = ByteBuffer.allocate(BUFFER\_SIZE);  
    int read = 0;  
    while ((read = bc.read(buffer)) != -1) {  
      // let the detector work on the downloaded chunk  
      detector.handleData(buffer.array(), buffer.position() - read, read);  
      // check if we found a larger site, then resize the buffer  
      buffer = resizeBuffer(buffer);  
    }  
    // finish the sequence  
    detector.dataEnd();  
    // copy the result back to a byte array  
    String encoding = detector.getDetectedCharset();  
    // obtain the encoding, if null fall back to UTF-8  
    return new String(buffer.array(), 0, buffer.position(),  
        encoding == null ? "UTF-8" : encoding);  
  } finally {  
    if (stream != null) {  
      stream.close();  
    }  
  }  
}  
// basic resize operation when 90% of the buffer is occupied
// simply double the correct size and copy the buffer  
private static ByteBuffer resizeBuffer(ByteBuffer buffer) {  
  ByteBuffer result = buffer;  
  // double the size if we have only 10% capacity left  
  if (buffer.remaining() < (int) (buffer.capacity() \* 0.1f)) {  
    result = ByteBuffer.allocate(buffer.capacity() \* 2);  
    buffer.flip();  
    result.put(buffer);  
  }  
  return result;  
}  

```  

That is actually everything to know about getting HTML from a raw URL.  
  
**But, how do you extract the outlinks from a HTML page?**  

Many of you will now go ahead and say: let's compile some RegEx. You will **FAIL**.  
As a computer scientist it is enough if you tell that HTML is a context free grammar (chomsky type 2) and RegEx needs a regular language (type 3) to operate properly. Type 2 languages are way more complex and can't be parsed with a regular expression. So please have a look at the [funny rage answer at stackoverflow](http://stackoverflow.com/a/1732454/540873) or read up the other very informative answers at the bottom to know why you shouldn't do this. Don't get me wrong: You will find URLs that you can parse with RegEx, but I don't think it is worth the stress. I always use the [htmlparser on sourceforge](http://htmlparser.sourceforge.net/), it is clean, well tested and pretty fast.  
  
To end this post, I tell you how to extract some outlinks from a html page as string:  
  
```Java
static final NodeFilter LINK\_FILTER = new NodeClassFilter(LinkTag.class);  
Parser parser = new Parser(html);  
NodeList matches = parser.extractAllNodesThatMatch(LINK\_FILTER);  
SimpleNodeIterator it = matches.elements();  
while (it.hasMoreNodes()) {  
  LinkTag node = (LinkTag) it.nextNode();  
  String link = node.getLink().trim();  
  // now expand for relative urls and store somewhere  
}  
```  

It is simple as that. How expanding of URLs can be done is another part- but I leave that up to you ;-) [Java's URI may help you with that.](http://docs.oracle.com/javase/7/docs/api/java/net/URI.html)  
  
So thanks for attending, my next post is about how to extract actual text content (news) from pure HTML code.