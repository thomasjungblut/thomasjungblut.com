---
title: 'XGBoost bayesian hyperparameter tuning with bayes_opt in Python'
date: 2016-10-15T14:23:00.002+02:00
draft: false
aliases: [ "/2016/10/xgboost-bayesian-hyperparameter-tuning.html" ]
tags : [machine learning, xgboost, hyperparameter tuning, bayesian]
---

Hey guys,  
  
I just wanted to quickly share how I was optimizing hyperparameters in XGBoost using [bayes\_opt](https://github.com/fmfn/BayesianOptimization).  

```python
from bayes_opt import BayesianOptimization
from sklearn.cross_validation import KFold
import xgboost as xgb

def xgbCv(train, features, numRounds, eta, gamma, maxDepth, minChildWeight, subsample, colSample):   
   # prepare xgb parameters 
   params = {
            "objective": "reg:linear",
            "booster" : "gbtree",
            "eval_metric": "mae",            
            "tree_method": 'auto',
            "silent": 1,
            "eta": eta, 
            "max_depth": int(maxDepth),
            "min_child_weight" : minChildWeight,
            "subsample": subsample, 
            "colsample_bytree": colSample,             
            "gamma": gamma
   }
   
   cvScore = kFoldValidation(train, features, params, int(numRounds), nFolds = 3)
   print('CV score: {:.6f}'.format(cvScore)) 
   return -1.0 * cvScore   # invert the cv score to let bayopt maximize
   
def bayesOpt(train, features):
   ranges = {            
              'numRounds': (1000, 5000),
              'eta': (0.001, 0.3),
              'gamma': (0, 25),
              'maxDepth': (1, 10),
              'minChildWeight': (0, 10),
              'subsample': (0, 1),
              'colSample': (0, 1)
   }
   
   # proxy through a lambda to be able to pass train and features
   optFunc = lambda numRounds, eta, gamma, maxDepth, minChildWeight, subsample, colSample: xgbCv(train, features, numRounds, eta, gamma, maxDepth, minChildWeight, subsample, colSample)
   bo = BayesianOptimization(optFunc, ranges)
   bo.maximize(init_points = 50, n_iter = 5, kappa = 2, acq = "ei", xi = 0.0)
   
   bestMAE = round((-1.0 * bo.res['max']['max_val']), 6)
   print("\n Best MAE found: %f" % bestMAE)
   print("\n Parameters: %s" % bo.res['max']['max_params'])
 
def kFoldValidation(train, features, xgbParams, numRounds, nFolds, target='loss'):  
   kf = KFold(len(train), n_folds = nFolds, shuffle = True)
   fold_score=[]
   for train_index, cv_index in kf:
      # split train/validation
      X_train, X_valid = train[features].as_matrix()[train_index], train[features].as_matrix()[cv_index]
      y_train, y_valid = (train[target].as_matrix()[train_index]), (train[target].as_matrix()[cv_index])
      dtrain = xgb.DMatrix(X_train, y_train) 
      dvalid = xgb.DMatrix(X_valid, y_valid)
         
      watchlist = [(dtrain, 'train'), (dvalid, 'eval')]
      gbm = xgb.train(xgbParams, dtrain, numRounds, evals = watchlist, early_stopping_rounds = 100)

      score = gbm.best_score
      fold_score.append(score)                

   return np.mean(fold_score)
```
  
It does a k-fold cross validation while optimizing for stable parameters.  
Keep in mind that `bayes_opt` maximizes the objective function, so change all the required hardcoded values along those lines to fit your problem. It's pretty compact, so I thought I just leave it here for your convenience as a [gist](https://gist.github.com/thomasjungblut/b58d70d260abf0eff1a8c447f3d07389#file-xgb_bayes_opt_cv-py).  
  
Cheers,  
Thomas