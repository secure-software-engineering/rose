#Rose Configurations by Roles
Researcher inherits from Participant
Developer inherits from Researcher

## Participant
* Toggle Comment Reminder: Boolean
* Reminder Frequency: timestamp (duration)
* Language: String (ISO 639 tag e.g. en-us, de-de)

+ Load Config File()

## Researcher
* Toggle Networks: List of Boolean
* Toggle Observer: List of Boolean
* Study Identifier: String

+ Generate Config file()

##Develeoper
* Repository url: String
* CheckSum: String

+ Configure/Create Observer()

- EnabledObserverList

#Rose Pflichten
Reset mit
