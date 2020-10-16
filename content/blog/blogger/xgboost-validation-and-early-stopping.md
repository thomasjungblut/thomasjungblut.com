---
title: 'XGBoost Validation and Early Stopping in R'
date: 2016-03-18T22:03:00.002+01:00
draft: false
aliases: [ "/2016/03/xgboost-validation-and-early-stopping.html" ]
tags : [machine learning, xgboost, boosting, R]
---

Hey people,  
  
While using XGBoost in Rfor some Kaggle competitions I always come to a stage where I want to do early stopping of the training based on a held-out validation set.  
  
There are very little code snippets out there to actually do it in R, so I wanted to share my quite generic code here on the blog.  
  
Let's say you have a training set in some csv and you want to split that into a 9:1 training:validation set. Here's the naive (not stratified way) of doing it:  
  
```R
train <- read.csv("train.csv")  
bound <- floor(nrow(train) * 0.9)           
train <- train[sample(nrow(train)), ]         
df.train <- train[1:bound, ]                  
df.validation <- train[(bound+1):nrow(train), ]
```  
Now before feeding it back into XGBoost, we need to create a xgb.DMatrix and remove the targets to not spoil the classifier. This can be done via this code:  
  
```R
train.y <- df.train$TARGET  
validation.y <- df.validation$TARGET  
  
dtrain <- xgb.DMatrix(data=df.train, label=train.y)  
dvalidation <- xgb.DMatrix(data=df.validation, label=validation.y)
```  
So now we can go and setup a watchlist and actually start the training. Here's some simple sample code to get you started:  
```R
watchlist <- list(validation=dvalidation, train=dtrain)  
  
param <- list(  
   objective = "binary:logistic",  
   eta = 0.3,  
   max_depth = 8                  
)  
  
clf <- xgb.train(     
   params = param,   
   data = dtrain,   
   nrounds = 500,   
   watchlist = watchlist,  
   maximize = FALSE,  
   early.stop.round = 20  
)
```  
Here we setup a watchlist with the validation set in the first dimension of the list and the trainingset in the latter. The reason that you need to put the validation set first is that the early stopping only works on one metric - where we should obviously choose the validation set.  
  
The rest is straightforward setup of the xgb tree itself. Keep in mind that when you use early stopping, you also need to supply whether or not to maximize the chosen objective function- otherwise you might find yourself stopping very fast!  
  
Here's the full snippet as a [gist](https://gist.github.com/thomasjungblut/e60217c5b7609e4dfef3)
  
Thanks for reading,  
Thomas