## Welcome to ROSE - The Research Tool for Online Social Environments -

### What is ROSE?

<table>
  <tr>
    <td><img src="images/rose-icon128.png" alt="ROSE logo"></td>
    <td>ROSE is basically a web browser add-on for Google Chrome, Mac OS X Safari, and Mozilla Firefox that allows empirical researchers to collect data on how participants in user studies use websites such as Facebook, Twitter, or Google+. While this is the main purpose of ROSE, the software also implements a complete online research workflow including creating a study with ROSE, deploying a tailored ROSE configuration to participants, and analyzing collected data.</td>
  </tr>
</table>


|![ROSE logo][images/rose-icon128.png]|ROSE is basically a web browser add-on for Google Chrome, Mac OS X Safari, and Mozilla Firefox that allows empirical researchers to collect data on how participants in user studies use websites such as Facebook, Twitter, or Google+. While this is the main purpose of ROSE, the software also implements a complete online research workflow including creating a study with ROSE, deploying a tailored ROSE configuration to participants, and analyzing collected data.|

### So ROSE basically counts clicks in Facebook? That's simple, isn't it?

While it sounds easy to collect field data the evil is in the details: first of all, any data collection needs to balance study participants' privacy interests and the level of detail of the data collection. Second, web pages such as Facebook or Google+ are constantly changing their design and structure making it technically difficult to observe defined events. Hence any data collection tool must be able to adopt to these changes easily and in time.

We developed ROSE within our own empirical studies of interactional privacy on social network sites. We revised ROSE with any new requirement we found in our work hence it crystallizes years of experience in doing multi-method empirical research.

### How did you solve the privacy and tracking issues?

ROSE implements a unique privacy-aware design: the first important decision in the development of ROSE was that it must be a browser plugin. A browser plugin enables study participants to control and monitor all collected data locally on their computer. Other solutions like Facebook Apps collected data on servers of the app provider hence lacking this kind of control. Only the participant can decide when to hand over which data to the study researchers. A participant can all the time check the data ROSE records about her use of social network sites.

A second important decision was about recording the content or targets of interactions. For researchers it is important to know not only when a participant interacted with a social network site, but also the item she interacted with. For example, on Facebook, a user might "like" a newsfeed post and later comment on the same post. Using the content an interaction target, e.g., a newsfeed post, ROSE calculates privacy-preserving identifiers enabling researchers to understand the structure of interactions while protecting participants' privacy, the content they interact on, and the identity of person they interact with.

### How can I try it out?

You find the Google Chrome extension page of ROSE here: [Chrome Store](https://chrome.google.com/webstore/detail/rose/chmgghdkcookiojbnchechkhjfbadjkd)

### Where can I find more information?  

We are currently preparing a concise guide for researchers using ROSE, developers, and field study participants.

### Under which license is ROSE published?

ROSE is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
