## How to execute studies with ROSE

### Overview

ROSE is intended to support empirical research into the practices of online social media users. ROSE supports such study by providing a tool to collect data of study participants' interactions with online social media platforms about a specific study period.

The following picture gives an overview of the general study setup. It will be used to explain the general steps for executing a social media study with ROSE. 

![General study workflow with ROSE](./images/rose-basic-setup.png "Study workflow")

[Enlarge image here](./images/rose-basic-setup.png)

The picture shows three technical entities involved in a study:
  * ROSE as a browser extension run in the *web browsers* of the researchers executing the study and the participants taking part in the study. Both use ROSE in two different modes: the researchers use an expert mode to prepare the study and to process the tracking data by the participants. The participants use ROSE in a study mode with a configuration tailored to the specific needs of the study.
  * *Browser Extension Stores* for Chrome and Safari provide the browser extension for both the researchers and the participants
  * *Pattern Repository* is a bunch of files hosted on a web server containing information about how to track specific user data at participants' web browsers. These files are pulled by ROSE to keep the tracking mechanism up to date and to adapt to changes in social media sites.

Each study executed with ROSE has the following general workflow:
  1. Researcher installs ROSE from a *Browser Extension Store* into his local web browser and turns ROSE in an expert mode (*Features for researchers and developers*).
  2. Researcher creates a ROSE configuration file with a special *Study Creator* dialog and exports the configuration file for later exports into participants' installations of ROSE.
  3. Researcher informs her participants about the study and hands over the configuration file.
  4. Researcher asks her study participants to install ROSE from the *Browser Extension Store* and to initialize it with the configuration file previously created and handed over. At this step it makes sense to also inform participants about the privacy-aware design of ROSE to re-insure them about the trustworthiness of the software.
  5. Participants use ROSE over the intended study period. While using ROSE, ROSE might update tracking patterns from the *Pattern Repository* if changes in the web pages of the social media site requires it. This update function can be de-activated with an option in the configuration file.
  6. Participants hand over their tracking data the researcher for analysis. 

While this is the general workflow, researchers might choose to deviate. For instance, study participants could also use ROSE in the default mode without a configuration file. 

### First steps as a researcher 

First of all ROSE needs to be installed in your local web browser (Chrome or Safari). Use the following links to the respective extension stores:

[Chrome Store](https://chrome.google.com/webstore/detail/rose/chmgghdkcookiojbnchechkhjfbadjkd)
*Safari Extension Gallery link yet to come*

Once you have installed the extension, you can open its main user interface by clicking the ROSE button in your browser

![ROSE icon in Google Chrome](./images/screenshot-rose-button.png "ROSE icon in Google Chrome")

Upon the first run of ROSE what you should now see is a welcome screen with privacy notes and further information the use of overlays.

![Header of the ROSE welcome screen](./images/screenshot-welcome-screen.png "Header of the ROSE welcome screen")

You need to confirm that you have read these notes in order to proceed.

![Confirm privacy note and overlay note](./images/screenshot-confirm-notes.png "Confirm privacy note and overlay note")

As you lack a configuration file you now need to proceed by choosing the option "Use default configuration". At this point, your participants can later import a configuration file provided by you instead of proceeding with the default configuration.

![Load default configuration](./images/screenshot-load-default.png "Load default configuration")

*Configuration files carry parameters for a tailored setup of ROSE. They allow to configure what actions on social media sites ROSE should track at participants' web browsers, whether special comment function shall be active, and how updates for tracking patterns shall be handled. As a researcher you should provide your participants a configuration file fitting the needs of your study. However, you can also ask your participants to use the default configuration although this is not recommended.*

As a researcher you need access to additional ROSE functions that are not visible when starting ROSE the first time. These functions can be enabled by opening the *Settings* and activating the *Features for researchers and developers*.

![Settings dialog accessed from main menu](./images/screenshot-menu-settings.png "Settings dialog accessed from main menu")

![Activate researcher features](./images/screenshot-expert-mode-switch.png "Activate researcher features")

After these step ROSE is prepared to create a study configuration file.

### Creating a study configuration file

Before creating a study configuration file, you should finalize the study design so far that the following question can be answered:

  * On which social media site shall participants' actions being tracked?
  * What kind of actions need to be tracked?
  * Do dependencies between actions matter? Is it important for the study whether different, subsequent actions aiming on the same item need to be identified as such, e.g., in Facebook a "Like" and a "Comment" is applied to the same posting. 
  * Do dependencies between actions across study participants matter? For example, are participants belonging to a group whose members regularly interact on particular items on a social media site, and is this entanglement relevant for the study?
  * How critical is continuity for the study? If tracking of certain actions is suspended for a couple of days because of changes in the social media site does this easily become mission critical to the study?
  * Shall participants comment on their actions in situ as part of the study design?

ROSE can be used in various ways to satisfy the different needs expressed by the answers to these questions. It might require different settings in the configuration file to account for your needs, and, in certain case also changes in the ROSE infrastructure as shown early on in this description.

As a first step you should take a look at the study creator which can be access with the main menu "Researcher Features" and "Study Creator" after you have enabled the expert features as explained before.

#### Configure repository

For ROSE to function properly at participants' installations a valid repository configuration must be provided by entering the URL of a repository base file. 

![Configure repository base file](./images/screenshot-repository-base.png "Configure repository base file")

The base file of the repository stored at the Github pages of the ROSE project is set as default; you can use this repository for your study. *However, you need to keep in mind that the ROSE developers cannot promise that this repository is up-to-date and the tracking functions you intend to use are working properly all the time. If it is critical to your study having uninterrupted tracking of participants you should consider setting up and maintaining your own repository, which we will describe on further pages of this documentation yet to come.*

Besides choosing an appropriate repository solution, during the study you should also anyway monitor whether tracking patterns are yet working properly. If you choose to use the ROSE Github repository you can create a trouble ticket in case you find a tracking pattern to be broken. The issue management can be found [here](https://github.com/secure-software-engineering/rose/issues). 

After having stayed with the default URL or entered the base file URL of a different repository you can check your input by clicking "Retrieve repository to configure tracking", which also brings you to the next configuration step.

#### Configure tracking

Once you set up the repository correctly the patterns it contains are use to create a tailored tracking profile. First select the social media sites you want track from the content available in the repository by activating them after having retrieved the repository. 

![Pattern selection for study](./images/screenshot-pattern-selection.png "Pattern selection for study")

After you have activate a social media site all available patterns are shown. Enable all those actions you require to be track for the purpose of your study. You can track more actions as required but this might be in conflict with your research protocol. Also you can track actions on multiple social media sites the same time; activate all required social media sites and select the actions to be tracked individually for each site. 

*As mentioned before during the study you should repeatedly check whether the tracking patterns for each selected action is working properly. If a pattern gets broken correct it if you use your own repository or inform the repository administrator*

Setting the repository and range of the tracking function is the major step towards a study configuration file. However, few additional options need to be considered before finalizing the study creator.

#### Update handling

The patterns you configured before might require updates during the course of your study in case one of the tracked social media sites does changes to the design of its web pages. Patterns are usually flexible to some degree to adapt to these changes, however, at a certain point they need to be re-adjusted. The then revised patterns need to be distributed to participants' installations of ROSE. The following options in the study creator deal with this issue.

![Update settings](./images/screenshot-update-settings.png "Update settings")

First you need to decide whether such automatic updates should be allowed at all. In general automatic updates are recommended, but in few cases it makes sense to go without them: only by turning of the automatic updates you can make sure that all your participants' have the same state of ROSE at every given time during the whole study. If updates are turned on, you need to keep in mind that they cannot be done at the same time for all participants because of technical reasons. Slight deviations in the scope of tracking across participants might be the result. This should not be a problem for most studies but might be relevant when a very tight control of the conditions of participant tracking is required. Also, your research protocol might forbid that ROSE downloads tracking packages from a remote source automatically without case-by-case explicit consent of your participants.

*Note that updates cannot be used to activate tracking functions that were not activated in the first place when the configuration file was created.*

The next option to consider is the *secure update*. ROSE has build-in cryptographic functions allowing to check the origin of a repository by validating the signature of repository files. To this end, if you force secure updates you need to provide the SHA-1 fingerprint of the PGP public key that belongs to the private key allowed to create the signature; only one key pair can be provided. If during the update the signature cannot be validated using repository file content and the public key stored in the repository, or if the fingerprint of the public key stored in the repository does not match the given fingerprint (key pinning), the update is rejected.

*It is recommended to always use secure updates. Tracking patterns from invalid malicious sources could be used to extent the tracking range. However, there is no immediate threat that this could lead to an actual harm to participants.*

*The public key of the ROSE Github repository key pair has the SHA-1 fingerprint 25E769C697EC2C20DA3BDDE9F188CF170FA234E8. The associated private key is sealed in a hardware token only accessible to team members.*

Finally, the interval to check updates need to be set. The shorter the interval the faster revised patterns get activate, but the more network traffic ROSE creates. 




