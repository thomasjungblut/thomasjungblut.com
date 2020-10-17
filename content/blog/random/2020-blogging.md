---
title: 'Back to Blogging - 2020 Edition'
date: 2020-10-16T22:18:56Z
draft: false
tags : [random, gatsbyjs]
---

Exactly four years (!) after my last post, I finally have found some motivation to bring my blog alive again.

Of course, this comes with a for 2020 typical JavaScript single page app with React and [GatsbyJS](https://www.gatsbyjs.com/) - apologies in advance, I wanted to try an alternative to AngularJS and I'm sure I will also regret this myself in two to three years time. 

Sadly, Blogger wasn't getting too much attention from Google anymore and I felt the experience was terrible: both for me a writer and most likely also for the readers. Putting syntax highlighted code on there was always difficult and relying on 3rd party JS that always broke after some time, so having Markdown now will hopefully help in getting the content across in a leaner and longer lasting format.

I wanted to quickly thank [palaniraja](https://github.com/palaniraja) that created this wonderful [blog2md](https://github.com/palaniraja/blog2md) script to export hosted blogs and convert them into Markdown. I used this to copy all the content over to this site and with very little adjustment I could have all my posts in here.

Since this site touts itself as a tech blog, you can find the whole source code in [my repo here](https://github.com/thomasjungblut/thomasjungblut.com). This contains it end2end, from committing content and site adjust to `main` and having GitHub actions to deploy it straight into the `gh-pages` branch. 

I'm going to start with one technical blog post tomorrow, that will explain the `Stoer–Wagner algorithm` in a step-by-step fashion. This algorithm is a graph algorithm used to determine the `Minimum Cut` of a graph. Before deep learning it was used in image segmentation, spectral clustering and it's being used in detecting bottlenecks in any kind of flow networks.

I implemented it as part of the [Hacktoberfest](http://hacktoberfest.digitalocean.com/) two weeks ago in my own and old [graph library](https://github.com/thomasjungblut/tjungblut-graph/blob/master/src/de/jungblut/graph/partition/StoerWagnerMinCut.java), but I struggled a lot to find great resources outside of original academic paper and a badly written Wikipedia article.

Cheers,  
Thomas