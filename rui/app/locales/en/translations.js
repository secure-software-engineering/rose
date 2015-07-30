export default {
  // General
  and: "and",
  yes: "Yes",
  no: "No",
  on: "On",
  off: "Off",

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
    update: "Update"
  },

  // Sidebar Menu
  sidebarMenu: {
    diary: "Diary",
    backup: "Data Management",
    settings: "Settings",
    comments: "Comments",
    interactions: "Interactions",
    privacySettings: "Privacy Settings",
    networks: "Networks",
    more: "More",
    help: "Help",
    about: "About",
    extraFeatures: "Researcher Features",
    studyCreator: "Study Creator"
  },

  wizard: {
    header: "Welcome to Rose",
    description: "In this step we first need to configure Rose to work properly.",
    configOptions: "Choose one option to configure Rose.",
    defaultConfig: "Take the default configuration.",
    fileConfig: "Select a configuration file...",
    fileConfigBtn: "Choose file",
    urlConfig: "Specifiy a URL to an Rose repository..."
  },

  // Diary Page
  diary: {
    title: "Diary",
    subtitle: "Here you can take notes of everything that attracted your attention"
  },

  // Backup Page
  backup: {
    title: "Data Management",
    subtitle: "Here you can review and download all data recorded and collected by ROSE. If you press the \"Download\" button you can store all data in a file locally on your computer."
  },

  // Settings Page
  settings: {
    title: "Settings",
    subtitle: "On this page you can manage the configuration of ROSE.",
    language: "Language",
    languageLabel: "Choose your preferred language. ROSE can also adopt the browser language (\"auto detect\" option).",
    commentReminder: "Comment reminder",
    commentReminderLabel: "ROSE can ocassionally display reminders to remember you to comment on your actions if that is required by the study you are participating in. You can deactivate this features if it disturbs you.",
    extraFeatures: "Features for researchers and developers",
    extraFeaturesLabel: "ROSE has additional features for field researchers and ROSE developers. These features are normally not visible, but can be activated here.",
    resetRose: "Reset ROSE configuration",
    resetRoseLabel: "Here you can reset ROSE's configurations. The initialization wizard will appear again asking you to load either a default configuration or a specific study configuration file."
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
    subtitle: "All your recent interactions for this social media page recorded by ROSE.",
    actionOn: "action on"
  },

  // Privacy Settings Page
  privacySettings: {
    title: "Privacy Settings",
    subtitle: "Your privacy settings for this social media page recorded by ROSE."
  },

  // Help Page
  help: {
    title: "Usage notes",
    subtitle: "Frequently asked questions about ROSE",

    issue1: {
      question: "Where does ROSE collect the data about my Facebook usage and my inserted comments?",
      answer: "<p>Rose exclusively collects data in your web browser. ROSE can provide a pre-assembled Mail which you can use to transmit your data to the study advisor. ROSE does not transmit data to Facebook; Facebook can not detect your usage of ROSE with their computer systems. ROSE neither transmits data itself to the study advisor nor receives them.</p><p>There is a disadvantage of this privacy aware concept of ROSE, though: ROSE data can be lost in case system bugs emerge on your computer. With the deletion of ROSE from your web browser all stored data is irretrievably lost.</p>"
    },
    issue2: {
      question: "Are my ROSE study comments visible for other study participants or Facebook users?",
      answer: "<p>No, this is impossible for technical reasons. The distribution and therefore visibility for other study participants or Facebook users is impossible because ROSE does not transmit data to Facebook computer systems or to the study advisory. ROSE does not receive data either. Furthermore, Facebook can not even find out about whether you are using ROSE or not. Even though ROSE has a close integration in your web browser and the Facebook interface and therefore is much alike to the &quot;real&quot; Facebook functions this &quot;illusion of an extended Facebook&quot; completely and exclusively takes place in your web browser with ROSE.</p>"
    },
    issue3: {
      question: "Which data is being recorded by ROSE?",
      answer: "<p>ROSE records the following data:</p><ul><li><b>Date and time of interactions in Facebook</b>, e.g., the time the study participant publishes a story item on his/her Timeline.</li><li><b>Type of interaction</b>, e.g., &quot;creating a story item&quot;.</li><li><b>Unique identifiers</b>, which mark the context of interactions. Identifiers are an eight-digit combination of letters and numbers, e.g., &quot;2a2d6fc3&quot;. With commenting on a picture the identifiers correspond to the picture you commented on. Thereby the study advisory can detect if multiple study participants commented on the same picture without ever learning about the content of this picture.</li><li><b>Privacy settings concerning interactions</b>, e.g. whether a story item is visible for &quot;Friends&quot;only or for &quot;Everyone&quot;.</li><li><b>Diary entries.</b></li><li><b>ROSE study comments.</b></li><li><b>Privacy settings in general.</b></li></ul>"
    },
    issue4: {
      question: "Does ROSE collect data which I am sharing with my friends on Facebook?",
      answer: "<p>No. ROSE does not collect any data which you are sharing with your friends on Facebook. ROSE does not collect any content-related information, e.g., pictures, links, messages on Timelines, chat messages, or the names of groups you attended. ROSE only collects data about the usage of a type of action, e.g. if you are commenting on a picture. In the analysis the study advisors are only able to see that you made use of an action. The study advisors only asses that you made use of a type of action, but does not see if you are commenting on a picture of a polar bear or if you are commenting on a picture showing a friend of yours who is at a party. If you like to record information on the content of an action in order to explain why you made use of a specific action, please use the ROSE comments or your diary.</p>"
    },
    issue5: {
      question: "How do I control which interaction data ROSE collected?",
      answer: "<p>You may easily check this by using the user interface (menu item &quot;interaction tracking&quot;). Moreover you may read which data was collected by ROSE, when you are transferring your data to the study advisors. Even though it is a compact text-based data format, you may easily check that no personal data is transmitted.</p>"
    },
    issue6: {
      question: "How can I be sure that ROSE makes my data anonymous?",
      answer: "<p>ROSE data does not contain any information which refers to the Facebook user who created this data. ROSE does not save any Facebook user names or pictures’ and videos’ URLs provided by users. Thus ROSE data does not differ from ethnographically elicited and anonymised data, such as interviews. Anyways, saving content-related information would no be very sufficient as it does no allow contextual analysis</p>"
    },
    issue7: {
      question: "May I review the source code to check previous declarations?",
      answer: "<p>Yes. ROSE is a free, open-source software under GPL-license (General Public License). You may review the source code and you may change and process it on the conditions of the GPL. In favor of needing assistance, please contact the study advisors.</p>"
    },
    issue8: {
      question: "May I use ROSE for personal purposes after the study ended?",
      answer: "<p>Yes. You may continue using ROSE and process it without hesitation as it does not send any information to the study advisors automatically. Thereto please note the GPL license’s conditions. However, after the study ended we are not able to endorse you by using the software, e.g. providing ROSE updates.</p>"
    },
  },

  // About Page
  about: {
    title: "About ROSE",
    subtitle: "Information about ROSE",
    description: "ROSE is a browser extension to support empirical field studies by recording users' interactions with social media pages for a limited period of time. Please consider the help page for further information on ROSE's functioning.",
    developedBy: "is developed by",

    address: {
      name: "Fraunhofer Institute for Secure Information Technology SIT",
      street: "Rheinstrasse 75",
      country: "Germany"
    },

    forQuestions: "For questions about ROSE feel free to contact",
    licenceNotice: "This program is free software;you can redistribute it and/or modify it under the terms of the GNU General Public License version as published by the Free Software Foundation;either version 3 of the License, or (at your option) any later version."
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
    fingerprintDesc: "For reasons of security, the patterns stored in the pattern repository need to be signed with a RSA private key. This signature is validated before ROSE loads any patterns. Please enter the fingerprint of the public key ROSE shall use to verify the digital signature."
  }
};
