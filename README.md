[![devDependency Status](https://david-dm.org/secure-software-engineering/rose/dev-status.svg)](https://david-dm.org/secure-software-engineering/rose#info=devDependencies)

ROSE 3.0 beta
========

Synopsis
----
ROSE is a browser extension for researchers to capture in situ data on how users actually use online social networks.

[Please see the project wiki for more detailed information. (partially outdated)](https://github.com/secure-software-engineering/rose/wiki)

Features
----
* Currently supported social network sites: facebook.com
* Capturing user interactions such as likes, unlikes, comments, sending chat messages or sharing content.
* Capturing addtional information about the content users interacting with (e.g. posts, sharer, etc.)
* Capturing user activity by mouse move distance, scroll distance, OSN tab focus time, click amount and login status
* Comment function enables study participants to comment on their own or others' actions right in the OSN
* Privacy by Design: With the ROSE control center study participants have full control over the data collected. No shared content such as chat messages or images is collected. Captured events have privacy-respecting identifiers to correlate them among study participants (if required), and to relate events and comments. ROSE's privacy-aware design aims on minimizing interferences with the field.
* Easy to adopt to changes in the structure of OSNs or even add new sites by standardized observer definitions with push update functionality
* Bilingual: English(US) and German(DE)
* Cross-browser compatibility through the [Kango - Cross-browser extension framework](http://kangoextensions.com/)

References
----
In the following paper we describe how we use ROSE in our empirical field studies:

> Andreas Poller, Petra Ilyes, Andreas Kramm: Designing privacy-aware online social networks - A reflective socio-technical approach. CSCW ’13 Measuring Networked Social Privacy Workshop, February 23-27, 2013, San Antonio, Texas, USA.
>
> [[PDF]](http://testlab.sit.fraunhofer.de/downloads/Publications/poller_osn_design_cscw13_workshop_camera_ready_rot.pdf)

Build
-----

You can build your own copy of ROSE with the folowing steps:

1. Install dependencies with `npm`
    ```
    npm install
    ```
    During install you may get asked a few questions. Just choose the defaults. If progress is halted just press return once.

2. Build custom Semantic UI for facebook overlay:
    ```
    git checkout -- semantic.json
    cd semamtic/
    gulp build
    cd ..
    ```

3. Build ROSE UI based on Ember (You can skip this step. A precompiled version is in the repository)
    ```
    cd rui/
    npm install
    bower install
    ember build --output-path ../app/ui/
    cd ..
    ```

4. Build packages for Chrome, Firefox and Safari with Kango
    ```
    gulp build
    ```

The Safari build currently requires to replace `button.png` with `rose-safari-icon.png` in `dist/safari/rose_3.x.x.safariextension/icons`.

During development you can make use of watch processes:

1. Rebuild UI with watch in `rui/`
    ```
    ember build -w --output-path ../app/ui/
    ````

2. Rebuild ROSE with watch and reload
    ```
    gulp
    ```

About
----

ROSE is developed by:

> Fraunhofer Institute for Secure Information Technology SIT  
> Rheinstrasse 75  
> 64295 Darmstadt  
> Germany  

For questions about ROSE feel free to contact Andreas Poller, andreas.poller@sit.fraunhofer.de

License
----
This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License version as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.
