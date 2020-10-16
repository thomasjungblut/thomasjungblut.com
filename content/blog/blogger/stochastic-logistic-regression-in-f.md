---
title: 'Stochastic Logistic Regression in F'
date: 2014-05-31T16:03:00.000+02:00
draft: false
aliases: [ "/2014/05/stochastic-logistic-regression-in-f.html" ]
tags : [machine learning, f#, fsharp, algorithm]
---

Hello!  
  
I'm back with some exiting new hacking. At the beginning of the week, [Jon Harrop](http://www.ffconsultancy.com/) came to the Microsoft London office and gave a two day training on F#. The training was nice, I enjoyed it very much and we all laughed a lot.
  
In the end, I want to share a small project that I came up with during the training. It is about Stochastic Logistic Regression, or Logistic Regression "learning" the weights using Stochastic Gradient Descent.  
This is just a small write-up of what I've learned, explaining some of the language features.  
  

#### Learning Rule

In (more or less) mathematical terms, we will execute the following algorithm:  
```
Let n = number of iterations  
Let a = learning rate  
Let w = weights that need to be learned (including a bias term)  
For i to N:  
  Let f = get a random feature  
  Let c = the class of feature (either 0 or 1)  
  Let prediction = Sigmoid ( f dot w )  
  Let loss = prediction - c  
    
  w := w - a \* f \* loss  
```

It is a pretty easy algorithm, can be rewritten to use a convergence criteria very easily since there is only a single global minimum. If you participated in the ML course of Andrew Ng you'll recognize some similarity, because the full-batch algorithm they used basically uses the whole feature matrix and then updates the gradient by the average over all losses.  
  
Let's jump into F#.  

#### Training in F#

Since we are basically executing a math equation over and over again, it is handy to have a math library at hand. I've chosen [Math.Net Numerics](http://numerics.mathdotnet.com/), because it has some nice F# bindings. Let's start by looking at the training loop of the whole program:

```Fsharp
let Train(numIterations, dim, learningRate, rnd) =   
    // new vector including the bias  
    let mutable start = DenseVector.CreateRandom(dim + 1, Normal())  
    for i = 0 to numIterations do  
        let feature = SampleNewFeature(dim, rnd)  
        start <- OnlineLogisticRegression.GradientDescentStep(learningRate, start, FeatureVector(feature), FeatureClass(feature))  

    Console.WriteLine("Learned Weights: {0}", System.String.Join(", ", start.ToArray()))  
    start
```  
As you can see, F# is pretty much like the (more or less) mathematical notation I used in the previous section. Notable in the first place is that F# is indentation sensitive, just like Python.  
  
In the first line we define the function "_Train_", which defines some arguments and no return type. F# is quite smart about type inference, so it can detect what the types of the parameters are, so with the return type. In this method, we return the learned weights "_start_"- thus the compiler knows that this method returns a _DenseVector_. Like in most of the functional languages, there is always a return- in case there is not, there is a "_unit_" return (literally defined by () ), which always indicates an absense of a value.  
  
In the raw algorithm, where I used a for loop to loop over all iteration, we sample a new feature and pass it to another function which I defined in the _module_ "_OnlineLogisticRegression_" containing the update and calculation logic. At the end, we simply print (using the standard printing in C#) the vector and return it to the outside. You can seamlessly use F# and C# with each other in a program as they compile to the same IL.  
  
Let's step into the gradient descent function for a while:  
```Fsharp
/// Does a stochastic gradient descent step. Returns a new vector with the updated weights.  
let GradientDescentStep(learningRate, currentParameters, currentFeatureVector, outcome) =  
    let biasedFeature = CreateBiasVector currentFeatureVector  
    let prediction = Predict(biasedFeature, currentParameters)  
    let loss = prediction - outcome  
    // do a gradient descent step into the gradient direction  
    DenseVector.OfVector(currentParameters - (biasedFeature \* (loss \* learningRate)))  
```  

Yet another example for the type inference, but in this case I want to put your attention to the operator overloading. Yes in F# you can overload operators: As you can see in the parameter update, "_currentParameters_" and "_biasedFeature_" is a DenseVector, while loss and learningRate are floats (floats in F# are 64bit doubles, float32 is the "normal" float). The compiler has a small problem, because you can't leave the brackets out, as it can't determine the precedence correctly?  
  
In any case, the logic around that is pretty simple, very similar to a definition in maths.  
  
#### Testing the classifier in F#

In case the classifier is trained, we want to assess its learned weights. Usually, we use a hold-out test set to measure some metrics like accuracy or precision/recall, in this case I settled with sampling some new features from the random distribution we created the features with in the training stage. So how does that look like in F#?  
```Fsharp  
let testSetSource = List.init testSetSize (fun (x) -> SampleNewFeature(dim, rnd))  
let testSet =   
      Seq.ofList testSetSource  
      |> Seq.map (fun(feat) -> feat, OnlineLogisticRegression.Predict(FeatureVector(feat), weights))  
      |> Seq.map (fun(feat, prediction) -> feat, prediction, abs(FeatureClass(feat) - prediction) < 0.5)  

let countCorrectPredictions = Seq.sumBy (fun(feat, prediction, correct) -> if correct then 1 else 0)  
let numCorrect = countCorrectPredictions testSet  
```  
As you can see, I have used the pipeline operator ( |> ) to chain operations together. First we create a new list containing the new and sampled test features, then we make it a sequence (which is a lazily evaluated structure that is similar to IEnumerable in C#).  
Into that sequence, we map a three-tuple (the feature, the prediction and the learned weights) and then use another map stage to assess whether a classification was correct or not (threshold of the sigmoid here is 0.5). This in fact, is basically what's currying about: we chain multiple operators together forming a new function.  
In the end, we sum the number of correct predictions by piping the sequences through the defined pipeline.  
All of this is lazily evaluated, the whole computation was just executed within the last line.  
  
#### Code

The code can be found on GitHub, Apache 2.0 licensed: [https://github.com/thomasjungblut/FSharpLogisticRegression](https://github.com/thomasjungblut/FSharpLogisticRegression)  
  
#### Result

Executing the code in the GitHub repository yields to the following plot.
![](https://raw.githubusercontent.com/thomasjungblut/FSharpLogisticRegression/master/separation.png)

Thanks for reading.
