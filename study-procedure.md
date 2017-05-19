## How to execute studies with ROSE

### Overview

ROSE is intended to support empirical research into the practices of online social media users. ROSE supports such study by providing a tool to collect data of study participants' interactions with online social media platforms about a specific study period.

The following picture gives an overview of the general study setup. It will be used to explain the general steps for executing a social media study with ROSE. 

![General study workflow with ROSE](./images/rose-basic-setup.png "Study workflow")
<<<<<<< HEAD

[Enlarge image here](./images/rose-basic-setup.png)
=======
>>>>>>> 9c7d5f9f546a8e95786b9a5c8a06d7ac17f61d74

The picture shows three technical entities involved in a study:
  * ROSE as a browser extension run in the **web browsers** of the researchers executing the study and the participants taking part in the study. Both use ROSE in two different modes: the researchers use an expert mode to prepare the study and to process the tracking data by the participants. The participants use ROSE in a study mode with a configuration tailored to the specific needs of the study.
  * **Browser Extension Stores** for Chrome and Safari provide the browser extension for both the researchers and the participants
  * **Pattern Repository** is a bunch of files hosted on a web server containing information about how to track specific user data at participants' web browsers. These files are pulled by ROSE to keep the tracking mechanism up to date and to adapt to changes in social media sites.

Each study executed with ROSE has the following general workflow:
  1. Researcher installs ROSE from a **Browser Extension Store** into his local web browser and turns ROSE in an expert mode (**Features for researchers and developers**).
  2. Researcher creates a ROSE configuration file with a special **Study Creator** dialog and exports the configuration file for later exports into participants' installations of ROSE.
  3. Researcher informs her participants about the study and hands over the configuration file.
  4. Researcher asks her study participants to install ROSE from the **Browser Extension Store** and to initialize it with the configuration file previously created and handed over. At this step it makes sense to also inform participants about the privacy-aware design of ROSE to re-insure them about the trustworthiness of the software.
  5. Participants use ROSE over the intended study period. While using ROSE, ROSE might update tracking patterns from the **Pattern Repository** if changes in the web pages of the social media site requires it. This update function can be de-activated with an option in the configuration file.
  6. Participants hand over their tracking data the researcher for analysis. 

While this is the general workflow, researchers might choose to deviate. For instance, study participants could also use ROSE in the default mode without a configuration file. 

### First steps as a researcher 

First of all ROSE needs to be installed in your local web browser (Chrome or Safari). Use the following links to the respective extension stores:

[Chrome Store](https://chrome.google.com/webstore/detail/rose/chmgghdkcookiojbnchechkhjfbadjkd)
**Safari link yet to come**

Once you have installed the extension, you can open its main user interface by clicking the ROSE button in your browser

![ROSE icon in Google Chrome](./images/screenshot-rose-button.png "ROSE icon in Google Chrome")

Upon the first run of ROSE what you should now see is a welcome screen with privacy notes and further information the use of overlays.

![Header of the ROSE welcome screen](./images/screenshot-welcome-screen.png "Header of the ROSE welcome screen")

You need to confirm that you have read these notes in order to proceed.

![Confirm privacy note and overlay note](./images/screenshot-confirm-notes.png "Confirm privacy note and overlay note")

As you lack a configuration file you now need to proceed by choosing the option "Use default configuration". At this point, your participants can later import a configuration file provided by you instead of proceeding with the default configuration.

![Load default configuration](./images/screenshot-load-default.png "Load default configuration")

**Configuration files carry parameters for a tailored setup of ROSE. They allow to configure what actions on social media sites ROSE should track at participants' web browsers, whether special comment function shall be active, and how updates for tracking patterns shall be handled. As a researcher you should provide your participants a configuration file fitting the needs of your study. However, you can also ask your participants to use the default configuration although this is not recommended.**

As a researcher you need access to additional ROSE functions that are not visible when starting ROSE the first time. These functions can be enabled by opening the **Settings** and activating the **Features for researchers and developers**.

![Settings dialog accessed from main menu](./images/screenshot-menu-settings.png "Settings dialog accessed from main menu")

![Activate researcher features](./images/screenshot-expert-mode-switch.png "Activate researcher features")

After these step ROSE is prepared to create a study configuration file.
