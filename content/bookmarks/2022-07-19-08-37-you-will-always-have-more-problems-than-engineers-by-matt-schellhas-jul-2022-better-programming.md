---
uuid: f95dc1b2-2a35-4709-933b-4dcf42ebef4c
bookmarkOf: https://betterprogramming.pub/you-will-always-have-more-problems-than-engineers-aafff94a4623
category: article
headImage: https://miro.medium.com/max/1200/1*DhPQsNoAw2GDlKbdpaJCBA.jpeg
title: You will always have more Problems than Engineers.
description: How to deal with a sad reality.
tags: []
date: 2022-07-19 08:37:26.076164190 +00:00
---

![](https://miro.medium.com/max/1400/1*DhPQsNoAw2GDlKbdpaJCBA.jpeg)

Photo by [Adrian Swancar](https://unsplash.com/@a_d_s_w?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/broken?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)

> Everyone knows that debugging is twice as hard as writing a program in the first place. So if you’re as clever as you can be when you write it, how will you ever debug it?
>
> \- Brian Kernighan

It has always been easier to break things than to make things. Software is no different. If anything, software has made it explicit. We can _prove_ there are [an infinite number of valid software programs](https://math.stackexchange.com/questions/204519/is-the-set-of-all-valid-c-programs-countably-infinite). How many of those actually do what we want, without bugs?

**Far fewer** (yet amusingly, still [infinite](https://en.wikipedia.org/wiki/Minification_(programming))).

Even if you ignore [all of the bugs that software engineers create themselves](https://www.mayerdan.com/ruby/2012/11/11/bugs-per-line-of-code-ratio), software engineers comprise only about [0.3% of the world’s population](https://www.future-processing.com/blog/how-many-developers-are-there-in-the-world-in-2019/). Mother Nature and the other 7.7 billion people aren’t sitting idle. Yes, many of those other folks are solving problems without software, and certainly not all of the problems people create _can_ be solved with software. Yet as companies far and wide _try_ to use technology to solve the world’s ills, they grapple with an inviolable truth: there always will be more problems than engineers.

That has consequences. Kernighan was focused on software design. Simple designs lead to more maintainable software. When software is easier to maintain, it causes fewer (and smaller) problems. But there are larger, more widespread consequences outside of a strictly technical domain:

Prioritization becomes unsolvable.
----------------------------------

Companies obsess over their work backlogs. They see all of these problems and respond by hiring entire teams of project managers to build and prioritize the hell out of some enormous Jira board. But when you realize that you’ll _always_ have more problems than engineers, optimizing a backlog makes no sense. When you’re overwhelmed with problems, _ordering them_ isn’t the most important skill, _filtering them_ is. The most valuable prioritization skill is simply saying “No. I’m not going to solve that problem right now”.

Too often, teams take the opposite approach. They catalog all of the features and bugs and customer requests and tech debt and nice to haves. They try to build a complete picture of all the work so things can be compared and estimated and ordered — even though software tasks rarely have a quantifiable value. The list of work your team _could_ do is far larger than they ever _will_ do during their lifetimes. Enumerating that list is folly.

The bigger challenge is that _even if_ you manage to do all of that, most of your problems still won’t be in the backlog. Which brings us to consequence number two:

Engineers need prioritization skills too.
-----------------------------------------

Most problems are not big problems. They aren’t building some API or optimizing some algorithm. They aren’t fixing some bug or testing on the 9000 flavors of Android. Most problems are **_tiny_**. Stuff like “What should I name this variable?” or “Should this be a list or a map?” or “Does Bob need to know about this?” — problems so small that it is impractical to have a meeting every time they come up.

How do engineers prioritize those tiny problems? Haphazardly, if we’re being generous. Software engineers don’t get training in prioritization skills. They rarely get coaching in workload management. There’s no great feedback loop for engineers to know if their choices are improving. Alone these tiny problems don’t matter much, but combined they represent a huge part of software’s success or failure.

Deliberately valuing and investing in engineers’ work management skills is a good first step in improving engineers’ effectiveness. It will keep them from being overwhelmed with problems, and ideally help them focused on the valuable ones. But it is not enough. Knowing what problems are valuable and what problems to say “no” to requires _context_. When all engineers have is a user story with an estimate, they don’t get that context. All they know is an acceptance criteria and an estimate — what to do and when to do it. They don’t get _why_ to do it, or what tradeoffs they should favor when doing it, or what they could be doing instead.

Yeah, software engineers aren’t great at prioritization. It is hard work to coordinate _everyone_ making their own tradeoffs. But the solution isn’t to take the prioritization out of engineers’ hands! They’re usually the ones closest to the problems! The solution is to put them in a situation where they’re more likely to succeed. Get them some context. Build good abstractions so teams can safely [ignore most problems](https://matt-schellhas.medium.com/zooming-out-the-first-challenge-of-a-growing-team-8109a329f5be). Help them grow the skills needed to deal with their own unavoidable mountain of problems.

Fantastic plans become fantasy.
-------------------------------

Everyone loves it when a plan comes together. We love when an intricately designed heist ends with the good guys simply walking out of the casino, loot in tow. We love it when the universe is saved by some rookie flying down a canyon of laser turrets so that they can finally use their [history of animal abuse](https://getyarn.io/yarn-clip/b0c74d07-c55c-4c39-8686-7a229e26d47d) for good. We love seeing those [1 to 14,000,605 longshots](https://www.youtube.com/watch?v=ZCPN9SfdH7c) (and 22 movies’ worth of investment) pay off.

Some lucky fools doing the impossible is great fantasy, but these are all **_terrible_** plans.

They are all intricate, with multiple (unlikely) things that have to happen _just right_ for the heroes to succeed. This makes them fragile. If one part of the plan encounters a problem, then the entire thing starts to fall apart. People scramble to keep it together, and usually make rash decisions rather than be the one responsible for destroying the Big Plan. You are _going_ to have more problems than engineers. Your plans will need to accommodate that.

Let’s consider a movie with a good plan. At the beginning of [_Ronin_](https://en.wikipedia.org/wiki/Ronin_(film)), Sam is going into a café to meet with some dangerous strangers. Lots of things could go wrong. He observes the café ahead of time, and makes a plan. Behind the café he stashes a gun. As he enters the café, he asks for the toilets and uses it as an excuse to unlock the back door. If any number of things go wrong, now he has a quicker exit and the gun ready if needed.

The thing is, Sam didn’t have to execute the plan. The meeting went smoothly. Everyone walked out the door peacefully and he retrieved the gun. Most companies see this as _waste_. Work spent on something that didn’t provide value? That’s something to clean up! Something to optimize away!

But this is the sort of plan that companies need to embrace. Good plans increase your options, even if you don’t always need them. When things go south (and they will), that unlocked door or stashed gun means that you have more paths to victory. You shouldn’t plan for every possible problem. There’s too many of them anyways. Focus on the big and likely ones. Give yourself options, so that you can choose the best option when you finally find out which problem is going to show up this time.

Progress is a treadmill.
---
