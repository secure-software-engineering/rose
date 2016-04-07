export default {
  // General
  and: "and",
  yes: "Yes",
  no: "No",
  on: "On",
  off: "Off",
  hourly: "Hourly",
  daily: "Daily",    
  weekly: "Weekly",       
  monthly: "Monthly",
  yearly: "Yearly",

  action: {
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    hide: "Hide",
    unhide: "Unhide",
    delete: "Delete",
    download: "Download",
    details: "Details",
    reset: "Reset",
    update: "Update",
    confirm: "Confirm",
  },

  // Sidebar Menu
  sidebarMenu: {
    data: "Data",
    dashboard: "Dashboard",
    diary: "Diary",
    backup: "Data Management",
    settings: "Settings",
    comments: "Comments",
    interactions: "Interactions",
    extracts: "Extracts",
    networks: "Networks",
    more: "More",
    help: "Help",
    about: "About",
    extraFeatures: "Researcher Features",
    studyCreator: "Study Creator",
    debugLog: "Application Log"
  },

  wizard: {
    header: "Welcome to ROSE",
    description: "In this step we first need to configure ROSE to work properly.",
    configOptions: "Choose one of the following two options to configure ROSE before your first use.",
    defaultConfigHeader: "Use the default configuration",
    defaultConfigDescription: "I have no configuration file to customize ROSE.",
    defaultBtn: "Use the default configuration",
    fileConfigHeader: "Use a configuration file",
    fileConfigDescription: "I have a customized configuration file for initializing ROSE.",
    fileConfigBtn: "Load the configuration file",
    urlConfig: "Specifiy a URL to an ROSE repository..."
  },

  // Diary Page
  diary: {
    title: "Diary",
    subtitle: "Here you can take notes of everything that attracted your attention"
  },

  // Data Management aka Backup Page
  backup: {
    title: "Data Management",
    subtitle: "Clear, review, or download all data history recorded by ROSE.",
    resetData: "Clear history",
    resetDataLabel: "Remove all data collected by ROSE.",
    export: "Export data",
    exportLabel: "Save and download the data history to a single file locally on your computer."
  },

  resetDataModal: {
    question: "Confirm removal of all collected data",
    warning: "Are you sure you want to delete all data collected? This action cannot be undone."
  },

  // Settings Page
  settings: {
    title: "Settings",
    subtitle: "Manage the configuration of ROSE.",
    language: "Language",
    languageLabel: "Choose your preferred language, or use the default language from the browser (“auto detect” option).",
    commentReminder: "Comment reminder",
    commentReminderLabel: "ROSE will occasionally display a message at the bottom of the screen to remind you to comment on your actions if the research study requires you to do so. You can deactivate this feature if it disturbs you.",
    extraFeatures: "Features for researchers and developers",
    extraFeaturesLabel: "ROSE has additional features for field researchers and ROSE developers. These features are not visible unless activated here.",
    resetRose: "Reset ROSE configuration",
    resetRoseLabel: "If you reset the configuration of ROSE, the initialization wizard will appear again. You can choose to either use the default configuration or load a specific study configuration file.",
    manualUpdate: "Update tracking package",
    manualUpdateLabel: "Social media sites change their webpage design from time to time. ROSE requires an update to work properly when these changes occur. To trigger an update manually, press the “update” button.",
    autoUpdate: "Automatic tracking package update",
    autoUpdateLabel: "For automatic updates to recent changes in social media sites, switch on the automatic update function.",
    autoUpdateInterval: "Automatic update interval",
    autoUpdateIntervalLabel: "ROSE checks automatically for tracking package updates in the specified time interval."
  },

  resetConfigModal: {
    question: "Confirm resetting the configuration of ROSE",
    warning: "Are you sure you want to reset the configuration of ROSE. This action will bring you back to the configuration wizard. All collected data will remain unchanged.",
  },

  // Comments Page
  comments: {
    title: "Comments",
    subtitle: "All comments you have entered using the comment sidebar.",

    you: "You",
    commentedOn: "commented on"
  },

  // Interactions Page
  interactions: {
    title: "Interactions",
    subtitle: "All your recent interactions on this social media site recorded by ROSE.",
    actionOn: "action on",
    action: "action"
  },

  // Extracts Settings Page
  extracts: {
    title: "Extracts",
    subtitle: "ROSE extracted these information"
  },

  // Help Page
  help: {
    title: "Help",
    subtitle: "Frequently asked questions about ROSE",

    issue1: {
      question: "Where does ROSE collect the data about my social media sites' usage and my comments from?",
      answer: "<p>ROSE collects data from and stores data in your web browser. There is no automatic transmission of data between ROSE and the social media sites, or between ROSE and the researchers of the study. ROSE will provide a pre-assembled option through which you can send your data to the researchers.</p><p>There is a disadvantage as a result of this privacy-aware design of ROSE. Since data is stored locally with no automatic uploading, it can get lost in the case of system errors on your computer, or in the case of accidental deletion of ROSE from your web browser. Data is irretrievable once it is lost.</p>"
    },
    issue2: {
      question: "Are my ROSE study comments visible to other study participants or my social media site friends?",
      answer: "<p>No, the comments you make through ROSE are invisible to other study participants or your social media site friends. For technical reasons, ROSE does not transmit data to the server of the social media sites or to the researchers of the study. ROSE does not receive data from any other source either. Though ROSE is integrated in your web browser and the social media sites interface, thus appearing like “real” social media site functions, it completely and exclusively functions in your web browser. There is no way for the social media sites to detect whether or not you are using ROSE.</p>"
    },
    issue3: {
      question: "What types of data are recorded by ROSE?",
      answer: "<p>ROSE records the following types of data:</p><ul><li>Date and time of interactions on social media sites, i.e., the time the study participant engages in an interaction. </li><li>Type of interaction, e.g., “liking content,” “viewing a profile,” “sharing content.”</li><li>Unique identifiers, eight-digit combinations of letters and numbers (e.g., \"2a2d6fc3\") that correspond to each story item (e.g., a picture, a status update) the study participant interacted with. With the identifiers, researchers can detect when multiple study participants interact with the same story item. But the researchers will not know the content of the item.</li><li>Privacy settings concerning interactions, e.g. whether a story item is visible for “Friends” only or for the public.</li><li>Diary entries.</li><li>ROSE study comments.</li><li>Privacy settings in general.</li></ul>"
    },
    issue4: {
      question: "Does ROSE collect the actual content I share with my friends on social media sites?",
      answer: "<p>No. ROSE does not collect any content information, such as pictures, links, or messages on Timelines; chat messages; or the name of groups you attended. ROSE only collects data about the usage of a type of interaction, e.g., whether you commented on a picture, or whether you engaged in a chat with a  friend. In the analysis, researchers are only able to see whether you engaged in an interaction, the timestamp, and the type of interaction. For example, researchers can see that you commented on a picture, but they will not know whether the picture is about a polar bear or friends at a party. If you would like to report information regarding the content of an interaction in order to explain why you made use of a specific action, please use the ROSE comments function or the diary function.</p>"
    },
    issue5: {
      question: "How do I control what types of interaction ROSE collect?",
      answer: "<p>You can easily check the types of interaction recorded from the ROSE user interface (menu item “Interactions”). When you export and share your data with the researchers, you can also view all data collected in the compact text-based data format. You will see from the exported data file that there is no personal data collected.</p>"
    },
    issue6: {
      question: "How can I be sure that ROSE makes my data anonymous?",
      answer: "<p>ROSE data does not contain any information identifying the social media site user who created the data. ROSE does not save any social media site user names, pictures, or videos provided by users. Thus, ROSE data is similar to anonymized data collected through other means, such as anonymous interviews. </p>"
    },
    issue7: {
      question: "May I review the source code to check previous declarations?",
      answer: "<p>Yes. ROSE is free, open-source software under GPL-license (General Public License). You may review the source code, change, or process it under the conditions of the GPL. Should you need assistance, please contact the project advisor. </p>"
    },
    issue8: {
      question: "May I use ROSE for personal purposes after the study ends?",
      answer: "<p>Yes. You may continue using ROSE for your own records, as it does not send any information to the researchers automatically. Please note the GPL license’s conditions. However, after the completion of the study, we will not be able to provide any assistance, such as providing ROSE updates.</p>"
    },
  },

  // About Page
  about: {
    title: "About ROSE",
    subtitle: "Information about ROSE",
    description: "ROSE is a browser extension to support empirical field studies by recording users' interactions with social media sites for a limited period of time. Please refer to the Help page for further information on the functions and use of ROSE.",
    developedBy: "ROSE is developed by",

    address: {
      name: "Fraunhofer Institute for Secure Information Technology SIT",
      street: "Rheinstrasse 75",
      country: "Germany"
    },

    forQuestions: "For questions about ROSE, feel free to contact project advisor:",
    licenceNotice: "This program is free software. You can redistribute it and/or modify it under the terms of the GNU General Public License (version 3 or above) as published by the Free Software Foundation."
  },

  // Study Creator Page
  studyCreator: {
    title: 'Study Creator',
    subtitle: 'With this page you can create a tailored configuration file for your study. You can distribute this configuration file to you study participants; by loading this file into their installations of ROSE participants can adapt their ROSE instances to the specific needs of your empirical study.',

    roseComments: "In-situ comments",
    roseCommentsDesc: "Check this if ROSE's in-situ comment function should be available to participants. Currently the in-situ comment function works only for Facebook.",
    roseCommentsRating: "Add in-situ rating option",
    roseCommentsRatingDesc: "Check this if the in-situ comment function should also ask for rating content.",
    salt: "Cryptographic salt for content identifiers",
    saltDesc: "ROSE records pseudonymous identifiers for user content that allow researchers to re-identify content without a need to reveal it. These identfiers are derived from user-entered content and a cryptographic salt. As a cryptographic salt you can enter any arbitray text string, for example \"ROSE123\" or whatever else you like. However, make sure that in case you investigate a group of participants all use the same salt in their ROSE configuration. Otherwise you can not correlate identifiers among participants afterwards.",
    hashLength: "Content identifier length",
    hashLengthDesc: "Here you can specify the length of the pseudonymous identifiers created by ROSE. You need to balance participants' privacy and the uniqueness of identifiers: the shorter the identifier the more secure they are; the longer the identifiers the more unique they are. Every digit adds a factor of 16 to the space of possible identifiers for your study. For example, setting the option to 4 allows for 16*16*16*16=65536 unique identifiers for your study. 5 is a good value if you are unsure how to use this option.",
    repositoryUrl: "URL of pattern repository",
    repositoryUrlDesc: "ROSE gets its patterns to match user interactions to specific interaction types from a pattern repository. Here you can enter the URL of this repository.",
    autoUpdate: "Automatically update patterns during study",
    autoUpdateDesc: "While the patterns are usually only pushed to ROSE when the configuration file is loaded into participants' instances of ROSE, it is also possible to continously update them while the study is running. This might be necessary for long-term studies, if the user interface of the investigated social media site changes.",
    exportConfig: "Export configuration file",
    exportConfigDesc: "Here you can export a configuration file with all the settings entered on this page. Your participants can load this file into their installations of ROSE.",
    fingerprint: "Pattern repository signing key fingerprint",
    fingerprintDesc: "For reasons of security, the patterns stored in the pattern repository need to be signed with a RSA private key. This signature is validated before ROSE loads any patterns. Please enter the fingerprint of the public key ROSE shall use to verify the digital signature.",
    optionalFeaturesHeader: "Optional features",
    privacyHeader: "Privacy settings",
    repositoryHeader: "Configure tracking package repository",
    configurationHeader: "Configure tracking",
    autoUpdateHeader: "Configure automatic tracking package updates",
    networks: "Websites to track",
    networksDesc: "Here you can enable or disable which websites shall be tracked by ROSE",
    extractors: "Available data extractors",
    observers: "Available interaction observers",
    enableAll: "Enable all available",
    disableAll: "Disable all available",
    forceSecureUpdate: "Force secure update",
    forceSecureUpdateDesc: "If turned on, update of the tracking package is only allowed from a trustworthy source. You need to provide the correct fingerprint for the signing key above.",
    updateInterval: "Interval to check for an updated tracking package",
    updateIntervalLabel: "Choose a time interval to check for tracking package updates",
    
    table: {
      enabled: "Status (on/off)",
      name: "Pattern name",
      version: "Current version",
      description: "Description",
      type: "Type"
    }
  },

  // Application Log
  debugLog: {
    title: "Application Log",
    subtitle: "This page shows all log messages thrown by ROSE application modules",
    date: "Timestamp",
    message: "Log message",
    module: "Module name"
  }
};
