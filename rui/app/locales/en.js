export default {
  // General
  and: "and",
  yes: "Yes",
  no: "No",

  action: {
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    hide: "Hide",
    unhide: "Unhide",
    delete: "Delete",
    download: "Download",
    details: "Details"
  },

  // Sidebar Menu
  sidebarMenu: {
    diary: "Diary",
    backup: "Backup",
    settings: "Settings",
    comments: "Comments",
    interactions: "Interactions",
    privacySettings: "Privacy Settings",
    networks: "Networks",
    more: "More",
    help: "Help",
    about: "About",
    extraFeatures: "R&D Features",
    studyCreator: "Study Creator"
  },

  // Diary Page
  diary: {
    title: "Diary",
    subtitle: "Here you can make a note of everything else that attracted your attention"
  },

  // Backup Page
  backup: {
    title: "Data Backup",
    subtitle: "Here you can review, save or restore all data you supplied or which was recorded by ROSE"
  },

  // Settings Page
  settings: {
    title: "Settings",
    subtitle: "Here you can manage your ROSE settings",
    language: "Language",
    commentReminder: "Comment Reminder",
    extraFeatures: "Features for researchers and developers"
  },

  // Comments Page
  comments: {
    title: "Comments",
    subtitle: "Have a look at all your comments",

    you: "You",
    commentedOn: "commented on"
  },

  // Interactions Page
  interactions: {
    title: "Interactions",
    subtitle: "All your recent interactions",
    actionOn: "action on"
  },

  // Privacy Settings Page
  privacySettings: {
    title: "Privacy Settings",
    subtitle: "Have a look at your privacy settings"
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
    description: "ROSE is a browser extension to support empirical Field studies by recording users' interactions with the social network Facebook for a limited period of time. Please consider the help page for further information on ROSE's functioning.",
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
    subtitle: 'LALALALALALALa',

    roseComments: "ROSE Comments",
    roseCommentsDesc: "Check if the ROSE Comments function should be available",
    roseCommentsRating: "ROSE Comments Rating",
    roseCommentsRatingDesc: "Check if the ROSE Comments rating function should be available",
    salt: "Salt",
    saltDesc: "Whats the purpose of this settings?",
    hashLength: "Hash Length",
    hashLengthDesc: "Whats the purpose of this settings?",
    repositoryUrl: "Repository URL",
    repositoryUrlDesc: "Whats the purpose of this settings?",
    autoUpdate: "Automatically Update Observers from Repository",
    autoUpdateDesc: "Whats the purpose of this settings?",
    exportConfig: "Export Configuration",
    exportConfigDesc: "Export configuration to file"
  }
};
