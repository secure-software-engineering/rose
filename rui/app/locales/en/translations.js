export default {
  // General
  and: 'and',
  yes: 'Yes',
  no: 'No',
  on: 'On',
  off: 'Off',
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  url: 'periodic',
  click: 'mouse-click',
  input: 'keyboard-input',

  action: {
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    hide: 'Hide',
    unhide: 'Unhide',
    delete: 'Delete',
    download: 'Export',
    details: 'Details',
    reset: 'Reset',
    update: 'Update',
    confirm: 'Confirm'
  },

  // Dashboard
  index: {
    title: 'ROSE Control Center',
    subtitle: 'Count of items collected in your local ROSE installation',
    trackingEnabledHeader: 'All Tracking function on/off',
    trackingEnabled: 'Tracking is globally enabled.',
    trackingDisabled: 'Tracking is globally disabled.'
  },

  // Sidebar Menu
  sidebarMenu: {
    data: 'Data',
    dashboard: 'Dashboard',
    diary: 'Diary',
    backup: 'Data Management',
    settings: 'Settings',
    comments: 'Comments',
    interactions: 'Interactions',
    extracts: 'Extracts',
    networks: 'Networks',
    more: 'More',
    help: 'Help',
    about: 'About',
    extraFeatures: 'Researcher Features',
    studyCreator: 'Study Creator',
    debugLog: 'Application Log',
    observerEditor: 'Observer Editor',
    dataConverter: 'Data Converter'
  },

  // ROSE Initialization Wizard
  wizard: {
    header: 'Welcome to ROSE',
    description: 'We first need to configure ROSE to work properly.',
    configOptions: 'Choose one of the following two options to configure ROSE before your first use.',
    defaultConfigHeader: 'Use default configuration',
    defaultConfigDescription: 'I have no configuration file to customize ROSE.',
    defaultBtn: 'Use default configuration',
    fileConfigHeader: 'Use configuration file',
    fileConfigDescription: 'I have a customized configuration file for initializing ROSE.',
    fileConfigBtn: 'Load configuration file',
    urlConfig: 'Specifiy a URL to a ROSE repository...',
    privacyNoteTitle: 'Privacy Note',
    privacyNote: '<p>ROSE collects data about your interactions with social media sites for the purpose of participating in an empirical study, or, if you are not participating in a study, for personal purposes. ROSE stores all collected data locally and in an anonymized way in your web browser. ROSE does not send any tracking data over the Internet to other servers, neither to social media sites nor to the researchers in whose study you might participate. At any time you can disable the tracking functions of ROSE by using the &ldquo;tracking on/off&rdquo; switch in the settings menu. If you have any further questions see the <a href="https://secure-software-engineering.github.io/rose/index.html">Github pages of ROSE</a>.</p>',
    overlayNoteTitle: 'Information on the Use of Overlays',
    overlayNote: '<p>ROSE adds overlays to social media sites such as Facebook thereby enabling the user to take notes on content he or she encounters online. These overlays are a red ribbon with the caption &ldquo;Comment&rdquo; and a sliding-in graphical user interface to manage notes, see pictures below. All data entered to text fields embedded in these overlays is store locally alone, just like any other data collected by ROSE. Disabling the tracking function also disables all overlays.</p>',
    privacyAgree: 'I have read and understood the notes on privacy and overlays. I want to proceed.'
  },

  // Diary Page
  diary: {
    title: 'Diary',
    subtitle: 'Here you can take notes of everything that attracted your attention'
  },

  // Data Management aka Backup Page
  backup: {
    title: 'Data Management',
    subtitle: 'Clear, review, or export all data recorded by ROSE.',
    resetData: 'Clear all data',
    resetDataLabel: 'Delete all data collected by ROSE.',
    export: 'Export data',
    exportLabel: 'Export and save all collected data to a single file locally on your computer.'
  },

  resetDataModal: {
    question: 'Confirm deletion of all collected data',
    warning: 'Are you sure you want to delete all data collected? This action cannot be undone.'
  },

  // Settings Page
  settings: {
    title: 'Settings',
    subtitle: 'Manage the configuration of ROSE.',
    language: 'Language',
    languageLabel: 'Choose your preferred language, or use the browser default language (&ldquo;auto detect&rdquo; option).',
    commentReminder: 'Comment reminder',
    commentReminderLabel: 'ROSE will occasionally display a message at the bottom of the screen reminding you to comment on your actions if a research study requires you to do so. You can deactivate this reminder if it disturbs you.',
    extraFeatures: 'Features for researchers and developers',
    extraFeaturesLabel: 'ROSE has additional features for field researchers and ROSE developers. These features are not visible in the menu unless activated here.',
    resetRose: 'Reset ROSE configuration',
    resetRoseLabel: 'If you reset the configuration of ROSE, the initialization wizard will appear again. You can choose to either use the default configuration or load a specific study configuration file.',
    manualUpdate: 'Update tracking package',
    manualUpdateLabel: 'Social media sites change the design of their web pages from time to time. To adapt to these changes, ROSE requires regular updates of tracking packages containing special patterns for detecting the user interactions. To trigger an update manually, press the “update” button.',
    autoUpdate: 'Automatic tracking package update',
    autoUpdateLabel: 'For automatic updates to recent changes in social media sites, switch on the automatic update function.',
    autoUpdateInterval: 'Automatic update interval',
    autoUpdateIntervalLabel: 'ROSE checks automatically for tracking package updates in the specified time interval.',
    lastChecked: 'Last checked',
    never: 'Never',
    lastUpdated: 'Last updated',
    signedStatus: 'Status',
    signedUpdate: 'Signed',
    unsignedUpdate: 'Unsigned',
    uptodate: 'Everything is already up-to-date.',
    error: 'Update failed.',
    success: 'Update successful.',
    noInternetConnection: 'No internet connection'
  },

  resetConfigModal: {
    question: 'Confirm resetting the configuration of ROSE',
    warning: 'Are you sure you want to reset the configuration of ROSE. This action will bring you back to the initial configuration wizard. All collected data will remain unchanged.'
  },

  // Comments Page
  comments: {
    title: 'Comments',
    subtitle: 'All comments you have entered using the comment sidebar.',
    you: 'You',
    commentedOn: 'commented on'
  },

  // Interactions Page
  interactions: {
    title: 'Interactions',
    subtitle: 'All your recent interactions on this social media site recorded by ROSE.',
    actionOn: 'action on',
    action: 'action'
  },

  // Extracts Settings Page
  extracts: {
    title: 'Extracts',
    subtitle: 'ROSE extracted these information'
  },

  // Help Page
  help: {
    title: 'Help',
    subtitle: 'Frequently asked questions about ROSE',

    issue1: {
      question: 'Where does ROSE collect the data about my social media sites&rsquo; usage and my comments from?',
      answer: '<p>ROSE collects data from about your interactions directly in your web browser; collected data are also stored in the web browser only. There is no data exchange of data between ROSE and the social media sites, or between ROSE and the researchers of the study in which you might participate. ROSE will provide a pre-assembled option through which you can export your data and can send it to the study researchers in case you wish to do so. Having the user anytime in full control of her data is part of the privacy-aware design of ROSE.</p><p>However, this design also has a small disadvantage you need to be aware of: Since data is stored only locally in your browser, it can get lost in case of system errors on your computer, or in the case of accidental deletion of ROSE from your web browser. All Data is irretrievable once it got lost this way.</p>'
    },
    issue2: {
      question: 'Are my ROSE study comments visible to other study participants or my friends on social media site?',
      answer: '<p>No. All comments you make through ROSE are invisible to other study participants or your social media site friends. For technical and especially privacy reasons, ROSE data never leaves your web browser to servers of social media sites or to the researchers of the study. ROSE does not receive tracking data from any other source either. Though ROSE is integrated in your web browser and the social media sites&rsquo; interfaces, thus appearing like an &ldquo;actual&rdquo; social media site function, it completely and exclusively operates in your web browser. Also, there is no way for social media sites to detect from remote whether or not you are using ROSE.</p>'
    },
    issue3: {
      question: 'What types of data are recorded by ROSE?',
      answer: '<p>ROSE records the following types of data:</p><ul><li>Date and time of interactions on social media sites, i.e., the time the study participant engages in an interaction. </li><li>Type of interaction, e.g., &ldquo;liking content&rdquo;, &ldquo;viewing a profile&rdquo;, &ldquo;sharing content&rdquo;.</li><li>Unique identifiers, eight-digit combinations of letters and numbers (e.g., &ldquo;2a2d6fc3&rdquo;) corresponding to each story item (e.g., a picture, a status update) and other user the study participant interacted with. With the identifiers, researchers can detect when study participants interact with the same story item or person repeatedly. But the researchers will not be able to identify the actual item or person.</li><li>General and specific privacy settings concerning interactions, e.g. whether a story item is visible for &ldquo;Friends&rdquo; only or for the public.</li><li>Diary entries.</li><li>ROSE study comments.</li></ul>'
    },
    issue4: {
      question: 'Does ROSE collect the actual content I share with my friends on social media sites?',
      answer: '<p>No. ROSE does not collect any content information, such as pictures, links, or messages on Timelines; chat messages; or the name of groups you attended. ROSE only collects data about the usage of a type of interactions, e.g., whether you commented on a picture, or whether you engaged in a chat with a friend. In the analysis, researchers are only able to see whether you engaged in an interaction, the timestamp, and the type of interaction. For example, researchers can see that you commented on a picture, but they will not know whether the picture showed a polar bear or friends at a party. If you would like to report information regarding the content related to an interaction in order to explain why you made use of a specific action, please use the ROSE comment function or the diary function.</p>'
    },
    issue5: {
      question: 'How do I control what types of interaction ROSE collect?',
      answer: '<p>You can easily check the types of interaction recorded from the ROSE user interface (menu item &ldquo;Interactions&rdquo;). When you export and share your data with the researchers, you can also view all data collected in the compact text-based data format. You will see from the exported data file that there is no personal data collected.</p>'
    },
    issue6: {
      question: 'How can I be sure that ROSE makes my data anonymous?',
      answer: '<p>ROSE data does not contain any information identifying the social media site user who created the data. ROSE does not save any social media site user names, pictures, or videos provided by users. Thus, ROSE data is similar to anonymized data collected through other means, such as anonymous interviews. When you export your data you can cross-check the validity of these privacy claims.</p>'
    },
    issue7: {
      question: 'May I review the source code to check previous declarations?',
      answer: '<p>Yes. ROSE is free, open-source software under GPL (GNU General Public License). You may review the source code, change, or process it under the conditions of the GPL. Should you need assistance, please contact the project contact at Fraunhofer SIT. </p>'
    },
    issue8: {
      question: 'May I use ROSE for personal purposes after the study ends?',
      answer: '<p>Yes. You may continue using ROSE for your own records, as it does not send any information to the researchers automatically. Please note the GPL license’s conditions. However, after the completion of the study, we will not be able to provide you any assistance, such as providing ROSE updates.</p>'
    }
  },

  // About Page
  about: {
    title: 'About ROSE',
    subtitle: 'Information about ROSE',
    description: 'ROSE is a browser extension to support empirical field studies by recording users&rsquo; interactions with social media sites for a limited period of time. Please refer to the Help page for further information on the functions and use of ROSE.',
    developedBy: 'ROSE is developed by',

    address: {
      name: 'Fraunhofer Institute for Secure Information Technology SIT',
      street: 'Rheinstrasse 75',
      country: 'Germany'
    },

    forQuestions: 'For questions about ROSE, feel free to contact the project lead:',
    licenceNotice: 'This program is free software. You can redistribute it and/or modify it under the terms of the GNU General Public License (version 3 or above) as published by the Free Software Foundation.'
  },

  // Study Creator Page
  studyCreator: {
    title: 'Study Creator',
    subtitle: 'With this page you can create a tailored configuration file for your study. You can distribute this configuration file to your study participants; by loading this file into their installations, ROSE participants can adapt their ROSE instances to the specific needs of your empirical study.',

    roseComments: 'In-situ comments',
    roseCommentsDesc: 'Check if ROSE&rsquo;s in-situ comment function should be available to participants. Currently the in-situ commenting works only for Facebook.',
    roseCommentsRating: 'Add in-situ rating option',
    roseCommentsRatingDesc: 'Check if the in-situ comment function should also ask for rating content.',
    salt: 'Cryptographic salt for content identifiers',
    saltDesc: 'ROSE records pseudonymous identifiers for user content allowing researchers to re-identify content without a need to reveal it. These identfiers are derived from user-entered content and a cryptographic salt. As a cryptographic salt you can enter any arbitrary text string, for example &ldquo;ROSE123&rdquo; or whatever else you like. However, make sure that in case you investigate a group of participants all use the same salt in their ROSE configuration. Otherwise you can not correlate identifiers among participants afterwards.',
    generateSaltButton: 'Generate',
    hashLength: 'Content identifier length',
    hashLengthDesc: 'Here you can specify the length of the pseudonymous identifiers created by ROSE. You need to balance participants&rsquo; privacy and the uniqueness of identifiers: the shorter the identifier the more privacy protecting they are; the longer the identifiers the more unique they are and collusion get unlikely. Every digit adds a factor of 16 to the space of possible identifiers for your study. For example, setting the option to 4 allows for 16*16*16*16=65536 unique identifiers for your study. As a rule of thumb, 5 is a good value if you are unsure how to use this option.',
    repositoryUrl: 'URL of tracking package repository',
    repositoryUrlDesc: 'ROSE gets its patterns to match user interactions to specific interaction types in tracking packages from a repository. Here you can enter the URL of this repository.',
    autoUpdate: 'Automatically update tracking packages during study',
    autoUpdateDesc: 'While tracking packages with detection patterns are usually only pushed to ROSE when the configuration file is loaded into participants&rsquo; instances of ROSE, it is also possible to continuously update them while the study is running. This might be necessary for long-term studies, if the user interface of the investigated social media site is likely to change during the course of the study.',
    exportHeader: 'Export configuration',
    exportConfig: 'Export configuration file',
    exportConfigDesc: 'Here you can create and export a configuration file with all the settings entered on this page. Your participants can load this file into their installations of ROSE.',
    fingerprint: 'Check repository&rsquo;s public key fingerprint for Public Key Pinning',
    fingerprintDesc: 'The chosen repository provides a signing key for proving the origin and trustworthiness of patterns. ROSE validates the origin of patterns delivered by this repository before loading them into the tracking engine. Once pattern updates are restricted to the secure mode, ROSE will only update patterns which are signed using an asymmetric key pair with the following public key fingerprint. This fingerprint will be stored in the configuration file and cannot be altered afterwards (called Public Key Pinning). Before continuing, check whether the displayed fingerprint is correct otherwise updates will fail.',
    optionalFeaturesHeader: 'Optional Facebook features',
    privacyHeader: 'Privacy settings',
    repositoryHeader: 'Configure tracking package repository',
    configurationHeader: 'Configure tracking',
    autoUpdateHeader: 'Configure automatic tracking package updates',
    networks: 'Websites to track',
    networksDesc: 'Here you can enable or disable which websites shall be tracked by ROSE',
    patterns: 'Available tracking patterns',
    enableAll: 'Enable all available',
    disableAll: 'Disable all available',
    forceSecureUpdate: 'Force secure update',
    forceSecureUpdateDesc: 'If turned on, update of the tracking package is only allowed from a trustworthy source. You need to provide the correct fingerprint for the signing key above.',
    keyUnavailable: 'No key in the specifified repository to enable secure update!',
    updateInterval: 'Interval to check for an updated tracking package',
    updateIntervalLabel: 'Choose a time interval to check for tracking package updates',
    baseFileNotFound: 'Invalid repository base file URL.',
    fetchRepository: 'Retrieve repository to configure tracking',

    table: {
      enabled: 'Status (on/off)',
      name: 'Pattern name',
      version: 'Current version',
      description: 'Description',
      type: 'Type'
    }
  },

  // Application Log
  debugLog: {
    title: 'Application Log',
    subtitle: 'This page shows all log messages thrown by ROSE application modules',
    date: 'Timestamp',
    message: 'Log message',
    module: 'Module name'
  },

  observerEditor: {
    title: 'Editor for Observer Patterns',
    subtitle: 'This editor allows you to change observer patterns for testing reasons, or to create new ones. This function is for expert use only.'
  },

  dataConverter: {
    title: 'Data Converter',
    subtitle: 'Tool to convert XML data exports from ROSE into more convenient CSV files. Just load the XML file and select the data set you want to convert into a CSV file.'
  }
}
