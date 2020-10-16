---
title: 'Greatest common divisor using F#'
date: 2014-04-07T22:22:00.000+02:00
draft: false
aliases: [ "/2014/04/greatest-common-divisor-using-f.html" ]
tags : [f#, algorithm]
---

Hey guys,  
  
I played with F# on the weekend. Since I'm working at Microsoft now and mainly working with C#, I thought F# would be a nice counterpart to my Scala work in the past.  
  
**A few personal updates**  
  
The start at Microsoft was quite a lot of work until now and I find less time and motivation in coding much in the evening. You can mainly see this in the commit activity of [my common library on Github](https://github.com/thomasjungblut/thomasjungblut-common) which looks like this:  
  

[![](http://4.bp.blogspot.com/-Y1CWed9WADw/U0MChs1BgXI/AAAAAAAACfs/uvBDPMYpwYg/s1600/commit_activity.PNG)](http://4.bp.blogspot.com/-Y1CWed9WADw/U0MChs1BgXI/AAAAAAAACfs/uvBDPMYpwYg/s1600/commit_activity.PNG)

  
Flatline since christmas... Not very proud of it, due to my relocation to London I was two months without my development desktop PC, in addition, context-switching between C# and Java isn't easy. Personally I find it very hard to go back to Java, as I'm missing a ton of functionality from C#! But I promise that I will find my way back, especially when it comes to awesome machine learning algorithms.  
  
**Back to the topic**  
  
So like most of the time, I was lurking around at Stackoverflow and found a poor guy using a [Java 8 lambda to make the greatest common divisor working](http://stackoverflow.com/questions/22920894/java-program-not-executing-code). Besides that his algorithm is quite strange and by the time you read this, the question is likely to be deleted, I find a quite interesting idea to practice my (still poor) weekend's F# skills.  
  
Just a few words about the [greatest common divisor definition](http://en.wikipedia.org/wiki/Greatest_common_divisor), given two integers, we want the largest number that divides both without a remainder.  
  
I chose the simplest set theory approach, which is just calculating two sets of divisors and intersecting them. Then I choose the maximum from the intersection.  
  
Here is what I came up in F# (even using the pipelining operators!):  
```Fsharp
let gcd = fun (a, b) ->   
  let set1 = Set.ofList \[ 1 .. a \]  
          |> Set.filter (fun x -> a % x = 0)  
  let inter = Set.ofList \[ 1 .. b \]  
          |> Set.filter (fun x -> b % x = 0)  
          |> Set.intersect set1  
  inter.MaximumElement     
```  

Rather easy binding of a function, not much to say here.  
Small obligatory test:  

```Fsharp
let a = 12  
let b = 8  
Console.WriteLine("GCD: {0}", gcd(a, b))  
// yields to result  
// GCD: 4
```  

**How is the language so far?**  
  
I found F# until now quite succinct, especially compared to C#. .NET integrates very nicely, too.  
However, sometimes the type system makes me want to punch a wall.  
But the most disappointing experience so far: the .fs file that contains your main method needs to be the last one in the project's solution. Yes you heard correctly, it must be on the lowest possible list entry in the project solution list.  
  
**How dumb is that?!** Obviously, this was hiding behind a MSFT typical error message:  

> error FS0039: The namespace or module '\_my\_namespace' is not defined

That cost me a few hours to figure out.
  
**Complexity**  
  
Let's talk about the complexity a bit. So [as far as I read here](http://en.wikibooks.org/wiki/F_Sharp_Programming/Sets_and_Maps), a _Set_ in F# is unordered, most likely to be a _HashSet._ Thus constructing and filtering both sets is O(A) respectively O(B), the intersection of two unordered sets is linear in time as well. So what we will end up is something like this:  

>  2 \* (O(A) + O(B)) + O(A+B) = O(n)

Still linear time, but very bad constants. Also the space complexity is rather bad, it is linear as well, as we are creating two quite large sets.  
  
But hey! It is just a naive method to show off my new aquired F# knowledge.
  
Thanks for reading, see you next time with a more interesting Big Data topic I hope,  
Thomas