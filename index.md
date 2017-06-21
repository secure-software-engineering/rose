## Welcome to ROSE - The Research Tool for Online Social Environments -

### What is ROSE?

ROSE is a web browser extension for Google Chrome, Mac OS X Safari, and Mozilla Firefox that allowing empirical researchers to collect detailed in-situ data on participants usage of social media websites such as Facebook, Twitter, or Google+ during the course of an empirical field study. Also the software implements a whole research workflow including creating a study with ROSE, deploying a ROSE configuration to participants' installations of ROSE tailored to specific study needs, and aids for analyzing collected data.

### So ROSE basically counts clicks in Facebook, Twitter etc.? That's simple, isn't it?

While it sounds easy to collect in-situ field data the evil is in the details: any data collection needs to balance study participants' privacy interests and the level of detail the data collection is aiming at. Moreover, web pages such as Facebook or Google+ are constantly changing their design and structure making it technically difficult to observe defined events locally at participants' web browsers. Any data collection tool must be able to adapt to these changes easily and just in time.

We developed ROSE within our own empirical studies of interactional privacy on social network sites. We revised ROSE with any new requirement we found in our work. ROSE crystallizes years of experience in doing multi-method empirical research, and we hope that by providing this tool we can support the research community giving back some of our experiences and encounters.

### How did you solve the issue of balancing participants' privacy and detailed usage tracking?

We developed a unique privacy-aware design for ROSE: 

The first decision was that ROSE needed to be a browser extension. A browser extension enables study participants to control and monitor all collected data locally on their computer at any time. Other solutions like Facebook Apps allow similar data collections more easily but data are stored on servers of the app provider finally out of control of study participants. When using ROSE, only the participant herself decides when to hand over which data to the researchers in whose study she participates. At any time, participants can time check the data ROSE records about her use of social network sites.

A second important decision was about recording the content or targets of interactions. For researchers it is important to know not only when a participant interacted with a social network site, but also the kind of items or persons she interacted with. For example, on Facebook, a user might "like" a newsfeed post and later comment on the same post. For researchers it is important to recognize this dependency between both actions. 

Using the content of an interaction target, e.g., a newsfeed post, or user identifiers such as people's names, ROSE calculates unique identifiers enabling researchers to track the structure and dependencies among interactions while perserving participants' privacy at the same time. These identifiers allow to relate interactions to each other, but prevent researchers from getting access to actual content or being able to identify real persons.   

### How can I try it out?

You find the Google Chrome extension page of ROSE here: [Chrome Store](https://chrome.google.com/webstore/detail/rose/chmgghdkcookiojbnchechkhjfbadjkd)

### Where can I find more information?  

The following guideline provide more information on specific topics.

[How to execute a study with ROSE](study-procedure.html)

### Who developed ROSE?

ROSE was developed by the [Fraunhofer Institute for Secure Information Technology, Darmstadt, Germany](https://www.sit.fraunhofer.de) in collaboration with the [Goethe University, Frankfurt am Main, Germany](http://www.uni-frankfurt.de/62943725/Kulturanthropologie_Europaeische).

Over the years, a quite large team of people was directly or indirectly involved in the project. They are, in alphabetic order:

Felix Epp (Fraunhofer SIT), Oliver Hoffmann (Fraunhofer SIT), Petra Ilyes (Goethe University), Laura Kocksch (Fraunhofer SIT, Goethe University), Andreas Kramm (Goethe University), Andreas Poller (Fraunhofer SIT, project lead), Sebastian Ruhleder (TU Darmstadt, Fraunhofer SIT), Yiran Wang (UC Irvine)

Our work on ROSE was supported by a Google Research Grant in 2014. 

### Are there examples for studies using ROSE?

Yes, there are publications you can look up to get an impression on how ROSE can be used:

[Poller, Andreas, et al. "Investigating OSN users' privacy strategies with in-situ observation." Proceedings of the companion publication of the 17th ACM conference on Computer supported cooperative work & social computing. ACM, 2014.](http://dl.acm.org/citation.cfm?id=2556508)

[Wang, Yiran, and Gloria Mark. "Engaging with Political and Social Issues on Facebook in College Life." Proceedings of the 2017 ACM Conference on Computer Supported Cooperative Work and Social Computing. ACM, 2017.](http://dl.acm.org/citation.cfm?id=2998295)

We hope that this list will grow in the future.

### Under which license is ROSE published?

ROSE is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

### Imprint

[Terms for site usage/imprint](https://www.sit.fraunhofer.de/en/imprint/)
