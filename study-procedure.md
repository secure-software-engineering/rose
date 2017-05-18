## How to execute studies with ROSE

### Overview

ROSE is intended to support empirical research into the practices of online social media users. ROSE supports such study by providing a tool to collect data of study participants' interactions with online social media platforms about a specific study period.

The following picture gives an overview of the general study setup. It will be used to explain the general steps for executing a social media study with ROSE. 

![General study workflow with ROSE](/images/rose-basic-setup.png "Study workflow")

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
 
