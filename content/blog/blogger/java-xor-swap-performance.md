---
title: 'Java XOR Swap Performance'
date: 2012-10-06T23:12:00.001+02:00
draft: false
aliases: [ "/2012/10/java-xor-swap-performance.html" ]
tags : [algorithm, xor, java]
---

Hey,  
just quick post, because I was working to polish my min heap and checked about different swap techniques.  
  
From my experience I know there are two different versions to swap two integers in an array.  
  

1.  XOR swap algorithm
2.  Swap using temporary variable

Since swapping is used pretty much everywhere, I decided to micro benchmark these against each other using [Caliper](http://code.google.com/p/caliper/).  

I've seen many people using the XOR algorithm lately, I don't know if they know that this is inefficient. Many people seem to do not care about this, because bitshifting makes them kinda look cool probably? However, here is my code so we can sort out the performance of both pretty easy:

```Java
public class SwapBenchmark extends SimpleBenchmark {  
  
  @Param({ "10", "100", "1000", "10000", "100000", "1000000", "10000000", "100000000" })  
  private int size;  
  
  @Param  
  SwapType type;  
  
  public enum SwapType {  
    XOR, TMP  
  };  
  
  int[] array;  
  
  @Override  
  protected void setUp() throws Exception {  
    array = new int[size];  
    Random r = new Random();  
    for (int i = 0; i < size; i++) {  
      array[i] = r.nextInt();  
    }  
  }  
  
  public void timeSwap(int reps) {  
    for (int rep = 0; rep < reps; rep++) {  
      int sum = 0;  
      for (int i = 0; i < size; i++) {  
        final int x = i;  
        final int y = size - i - 1;  
        if (type == SwapType.XOR) {  
          array[x] ^= array[y];  
          array[x] ^= (array[y] ^= array[x]);  
          sum += i;  
        } else {  
          int tmpIndex = array[x];  
          array[x] = array[y];  
          array[y] = tmpIndex;  
          sum += i;  
        }  
      }  
      System.out.println(sum);  
    }  
  
  }  
  
  public static void main(String[] args) {  
    Runner.main(SwapBenchmark.class, args);  
  }  
}  

```

So basically I'm swapping n-times in an n-size array, where n ranges from ten to 100,000,000 which is really big.  
  
The result isn't very exciting, I used my Nehalem i7 with 3,3GHZ and latest Java7u7:  
  
```
      size type        us linear runtime  
       10  XOR      2,90 =  
       10  TMP      2,84 =  
      100  XOR      3,06 =  
      100  TMP      2,85 =  
     1000  XOR      3,92 =  
     1000  TMP      3,52 =  
    10000  XOR     20,21 =  
    10000  TMP     14,22 =  
   100000  XOR    183,33 =  
   100000  TMP    118,57 =  
  1000000  XOR   1822,98 =  
  1000000  TMP   1192,19 =  
 10000000  XOR  19401,65 ==  
 10000000  TMP  13266,78 ==  
100000000  XOR 194173,73 ==============================  
100000000  TMP 134364,67 ====================  
  

```

The TMP swap is much more efficient in every case. Why is this?  
[Wikipedia states the following:](http://en.wikipedia.org/wiki/XOR_swap_algorithm)  
  
> On modern CPU architectures, the XOR technique is considerably slower than using a temporary variable to do swapping. One reason is that modern CPUs strive to execute instructions in parallel via [instruction pipelines](http://en.wikipedia.org/wiki/Instruction_pipeline "Instruction pipeline"). In the XOR technique, the inputs to each operation depend on the results of the previous operation, so they must be executed in strictly sequential order. If efficiency is of tremendous concern, it is advised to test the speeds of both the XOR technique and temporary variable swapping on the target architecture.
  
There is actually nothing more to add. **So please don't do any pre-mature optimization!**  
Even if it looks cool to do a bit-shifting trick ;)
