export default {
  // General
  and: 'und',
  yes: 'Ja',
  no: 'Nein',
  on: 'Ein',
  off: 'Aus',
  hourly: 'Stündlich',
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  yearly: 'Jährlich',
  url: 'periodisch',
  click: 'Mausklick',
  input: 'Tastatureingabe',

  action: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    edit: 'Editieren',
    hide: 'Verbergen',
    unhide: 'Aufdecken',
    delete: 'Löschen',
    download: 'Exportieren',
    details: 'Details',
    reset: 'Zurücksetzen',
    update: 'Aktualisieren',
    confirm: 'Bestätigen'
  },

  // Dashboard
  index: {
    title: 'ROSE Übersicht',
    subtitle: 'Gesamtanzahl gesammelter Datensätze in Ihrer lokalen ROSE-Installation.'
  },

  // Sidebar Menu
  sidebarMenu: {
    data: 'Daten',
    dashboard: 'Übersichts',
    diary: 'Tagebuch',
    backup: 'Datenverwaltung',
    settings: 'Einstellungen',
    comments: 'Kommentare',
    interactions: 'Interaktionen',
    extracts: 'Extrakte',
    networks: 'Netzwerke',
    more: 'Mehr',
    help: 'Hilfe',
    about: 'Über',
    extraFeatures: 'Funktionen für Forscher',
    studyCreator: 'Studienkonfigurator',
    debugLog: 'Anwendungsprotokoll',
    observerEditor: 'Editor für Observatoren',
    dataConverter: 'Datenkonverter'
  },

  // ROSE Initialization Wizard
  wizard: {
    header: 'Willkommen in ROSE',
    description: 'Zunächst muss ROSE konfiguriert werden, um richtig zu funktionieren.',
    configOptions: 'Wählen Sie eine der beiden Optionen, um ROSE für den ersten Einsatz zu konfigurieren.',
    defaultConfigHeader: 'Standardeinstellungen nutzen',
    defaultConfigDescription: 'Ich habe keine Konfigurationsdatei um ROSE zu benutzen.',
    defaultBtn: 'Nutze Standardeinstellungen',
    fileConfigHeader: 'Konfigurationsdatei benutzen',
    fileConfigDescription: 'Ich habe eine angepasste Konfigurationsdatei, um ROSE für seinen Einsatz vorzubereiten.',
    fileConfigBtn: 'Lade Konfigurationsdatei',
    urlConfig: 'URL zu einem ROSE-Datenspeicher angeben...',
    privacyNoteTitle: 'Hinweise zum Privatsphärenschutz',
    privacyNote: "<p>ROSE sammelt Daten über Ihre Interaktionen mit Social-Media-Plattformen, falls Sie an einer empirischen Studie zum Nutzungsverhalten teilnehmen, oder für Ihre persönlichen Zwecke. Alle Daten werden nur lokal in Ihrem Webbrowser gespeichert. Die Software übermittelt keine gesammelten Daten über das Internet zu anderen Servern. Zudem sind lokale Daten pseudonymisiert. Um die Funktion zur Datensammlung auszuschalten, gehen Sie in das Einstellungsmenü und nutzen Sie den Schalter mit der Beschriftung 'Datensammlung An/Aus'. Wenn Sie weitere Fragen haben, so besuchen Sie die <a href=\"https://secure-software-engineering.github.io/rose/index.html\">Github-Seiten von ROSE.</p>",
    overlayNoteTitle: 'Information zur Nutzung von Einblendungen',
    overlayNote: "<p>ROSE blendet auf Social-Media-Plattformen eigene Elemente ein, um dem Nutzer zu ermöglichen Notizen zu betrachteten Inhalten zu hinterlegen. Diese Einblendungen sind eine rote Schleife mit der Aufschrift 'Kommentar' und eine hineinschiebende Nutzerschnittstelle, um Notizen zu verwalten (siehe Bilder unten). Jegliche Daten, welche an diesen Nutzerschnittstellen eingegeben werden, werden nur lokal gespeichert - wie alle anderen Daten auch, welche ROSE sammelt. Wenn Sie die Funktion zur Datensammlung ausschalten, dann verschwinden auch alle Einblendungen.</p>",
    privacyAgree: 'Ich habe die Hinweise zum Datenschutz und Einblendungen gelesen und verstanden. Ich möchte fortfahren.'
  },

  // Diary Page
  diary: {
    title: 'Tagebuch',
    subtitle: 'Hier können Sie über alles was Ihnen auffällt Notizen hinterlassen.'
  },

  // Data Management aka Backup Page
  backup: {
    title: 'Datenverwaltung',
    subtitle: 'Untersuchen, löschen und exportieren aller Daten, welche ROSE gesammelt hat.',
    resetData: 'Alle Daten löschen',
    resetDataLabel: 'Lösche alle Daten die ROSE gesammelt hat.',
    export: 'Daten exportieren',
    exportLabel: 'Exportiere und speichere alle Daten in einer einzigen Datei auf Ihrem Computer.'
  },

  resetDataModal: {
    question: 'Bestätigen Sie das Löschen aller gesammelten Daten',
    warning: 'Möchten Sie wirklich alle gesammelten Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
  },

  // Settings Page
  settings: {
    title: 'Einstellungen',
    subtitle: 'Verwalten Sie die Konfiguration von ROSE.',
    language: 'Sprache',
    languageLabel: 'Wählen Sie Ihre bevorzugte Sprache, oder nutzen Sie die Standardsprache Ihres Browsers (&ldquo;Auto detect&rdquo;).',
    commentReminder: 'Erinnerung für Kommentare',
    commentReminderLabel: 'ROSE wird gelegentlich eine Nachricht im unteren Bereich des Bildschirms anzeigen, um Sie daran zu erinnern Ihre Aktionen zu kommentieren, falls das innerhalb einer Forschungsstudie notwendig ist. Sie können diese Funktion ausschalten, falls Sie dadurch gestört werden.',
    extraFeatures: 'Funktionen für Forscher und Entwickler',
    extraFeaturesLabel: 'ROSE hat zusätzliche Funktionen für Forscher und ROSE-Entwickler. Diese Funktionen sind im Hauptmenü nicht sichtbar, wenn sie nicht hier eingeschaltet werden.',
    resetRose: 'ROSE-Konfiguration zurücksetzen',
    resetRoseLabel: 'Wenn Sie die Konfiguration von ROSE zurücksetzen, wird der initiale Begrüßungsbildschirm wieder erscheinen. Sie können dann die Standardkonfiguration auswählen, oder eine spezielle Konfigurationsdatei für Ihre Studie laden.',
    manualUpdate: 'Datensammel-Paket aktualisieren',
    manualUpdateLabel: 'Social-Media-Plattformen verändern gelegentlich die Gestaltung ihrer Webseiten. ROSE benötigt dann eine Aktualisierung der Datensammel-Pakete, um mit diesen Änderungen umgehen zu können. Um eine Aktualisierung manuell auszulösen, klicken Sie bitte den &ldquo;Update&rdquo;-Knopf.',
    autoUpdate: 'Automatische Aktualisierung der Datensammel-Pakete',
    autoUpdateLabel: 'Für automatische Aktualisierungen, um aktuelle Veränderungen bei Social-Media-Plattformen zu berücksichtigen, stellen Sie die automatische Aktualisierung ein.',
    autoUpdateInterval: 'Intervall für automatische Aktualisierungen',
    autoUpdateIntervalLabel: 'ROSE prüft automatisch in bestimmten Zeitintervallen, ob neue Pakete vorliegen.',
    trackingEnabled: 'Datensammlung An/Aus',
    trackingEnabledLabel: 'Schaltet alle Datensammel-Funktionen und Einblendungen an oder aus.',
    lastChecked: 'Zuletzt geprüft',
    never: 'nie',
    lastUpdated: 'Letzte Aktualisierung',
    signedStatus: 'Status',
    signedUpdate: 'Signiert',
    unsignedUpdate: 'Nicht signiert',
    uptodate: 'Alle Pakete sind aktuell.',
    error: 'Aktualisierung gescheitert.',
    success: 'Aktualisierung erfolgreich.',
    noInternetConnection: 'Keine Internet-Verbindung'
  },

  resetConfigModal: {
    question: 'Bestätigen Sie, dass Sie die Konfiguration von ROSE zurücksetzen wollen',
    warning: 'Sind Sie sicher, dass Sie die Konfiguration zurücksetzen wollen? Diese Aktion wird Sie zurück zum initialen Begrüßungsbildschirm bringen. Alle gesammelten Daten bleiben erhalten.'
  },

  // Comments Page
  comments: {
    title: 'Kommentare',
    subtitle: 'Alle Kommentare, welche Sie in der Seitenleiste eingegeben haben.',

    you: 'Sie',
    commentedOn: 'kommentieren von'
  },

  // Interactions Page
  interactions: {
    title: 'Interaktion',
    subtitle: 'Alle Ihre vergangenen Interaktionen auf dieser Social-Media-Plattform, welche von ROSE aufgezeichnet wurden.',
    actionOn: 'Aktion mit',
    action: 'Aktion'
  },

  // Extracts Settings Page
  extracts: {
    title: 'Extrakte',
    subtitle: 'Informationen von ROSE extrahiert'
  },

  // Help Page
  help: {
    title: 'Hilfe',
    subtitle: 'Häufig gestellte Fragen über ROSE',

    issue1: {
      question: 'Woher sammelt ROSE meine Daten und Kommentare auf Social-Media-Plattformen?',
      answer: '<p>ROSE sammelt alle Daten direkt im Webbrowser und speichert sie auch dort. Es gibt keine Datenaustausch zwischen ROSE und den Social-Media-Plattformen, und auch nicht zwischen ROSE und den Forschern der Studie an der Sie ggf. teilnehmen. ROSE erlaubt Zugriff auf diese Daten durch eine Export-Funktion, über welche Sie die Daten auch an Forscher für den Zweck einer Studie weiterleiten können.</p><p>Diese privatsphäreschützende Gestaltung von ROSE hat einen Nachteil: Da Daten nur lokal gespeichert werden, ohne automatische Weiterleitung, können sie im Falle eines Systemfehlers verloren gehen, und Sie können sie auch versehentlich in Ihrem Browser löschen. In diesem Fall sind die Daten nicht wiederherstellbar.</p>'
    },
    issue2: {
      question: 'Sind meine ROSE-Kommentare für andere Studienteilnehmer oder meine Freunde auf Social-Media-Plattformen sichtbar?',
      answer: '<p>Nein. Kommentare, die Sie in ROSE machen, sind nicht sichtbar für andere. Aus technischen Gründen und zum Schutz Ihrer Privatsphäre überträgt ROSE keine gesammelten Daten zu anderen Servern der Social-Media-Plattformen und der Studien-Forscher. ROSE empfängt solche Daten auch nicht von anderen Quellen. Da ROSE fest in Ihren Browser integriert und auf den Webseiten der Social-Media-Plattformen sichtbar ist, erscheint es so als wäre es eine echte Funktion dieser Plattformen, wenngleich es allein in Ihrem Browser ausgeführt wird. Es gibt keine Möglichkeit von Social-Media-Plattformen festzustellen, ob Sie ROSE verwenden, oder nicht.</p>'
    },
    issue3: {
      question: 'Welche Arten von Daten werden von ROSE gesammelt?',
      answer: '<p>ROSE sammelt folgende Arten von Daten:</p><ul><li>Datum und Zeit von Interaktionen auf Social-Media-Plattformen, also die Zeit zu der Sie die Interaktion ausgelöst haben. </li><li>Art der Interaktion, z.B., &ldquo;liking content&rdquo;, &ldquo;viewing a profile&rdquo;, &ldquo;sharing content&rdquo;.</li><li>Eindeutige Identifikatoren aus Buchstaben und Zahlen (z.B., &ldquo;2a2d6fc3&rdquo;), welche mit dem Inhalt und den Personen in Zusammenhang stehen, mit denen Sie interagiert haben. Mit diesen Identifikatoren können Forscher erkennen, dass Sie mehrfach mit den gleichen Personen oder Inhalten interagiert haben. Die Forscher können jedoch nur Vergleiche anstellen und nicht die tatsächlichen Inhalte oder Personen in Erfahrung bringen.</li><li>Generelle und spezifische Privatssphäre-Einstellungen auf Social-Media-Plattformen, z.B., ob bei Facebook ein Eintrag nur für &ldquo;Freunde&rdquo; sichtbar oder öffentlich ist.</li><li>Studienkommentare.</li></ul>'
    },
    issue4: {
      question: 'Sammelt ROSE auch Inhalte, welche ich mit meinen Freunden teile?',
      answer: '<p>Nein. ROSE sammelt keinerlei derartige Informationen, wie z.B. Bilder, Links, persönliche Nachrichten, Gruppen- und Kontaktnamen. ROSE sammelt nur Daten über die Arten von Interaktionen, z.B., ob Sie ein Bild kommentiert haben, oder mit einem Freund persönliche Nachrichten ausgetauscht haben. In der nachfolgenden Analyse können die Studienforscher nur feststellen, dass Sie eine Interaktion durchgeführt haben, den Zeitpunkt, und die Art der Interaktion. Forscher können z.B. feststellen, dass Sie ein Bild kommentiert haben, aber sie können nicht herausfinden, ob das Bild einen Bären oder Freunde von Ihnen auf einer Party gezeigt hat. Wenn Sie zusätzliche Informationen zu Inhalten hinterlegen möchten, um Ihre Interaktionen zu erklären, dann nutzen Sie bitte die Kommentierungs- oder Tagebuch-Funktionen von ROSE.</p>'
    },
    issue5: {
      question: 'Wie kontrolliere ich, welche Arten von Interaktionen ROSE sammelt?',
      answer: '<p>Sie können dazu einfach den Menüpunkt &ldquo;Interaktionen&rdquo; öffnen. Wenn Sie die Daten exportieren und mit den Forschern teilen möchten, dann können Sie ebenfalls alle Daten in einem kompakten text-basierten Format untersuchen. Sie werden feststellen, dass die exportierten Daten keine persönlichen Informationen von Ihnen enthalten.</p>'
    },
    issue6: {
      question: 'Wie kann ich sicherstellen das ROSE meine Daten anonymisiert?',
      answer: '<p>ROSE-Daten enthalten praktisch keine Informationen über die eine andere Person herausfinden könnte, welcher Social-Media-Nutzer die Daten erstellt hat. ROSE speichert keine Daten zu Nutzernamen, Bildern, Videos und sonstigen Inhalten, welche Social-Media-Nutzer miteinander austauschen. Deshalb haben ROSE-Daten eine vergleichbare Anonymität wie Daten, die durch andere empirische Forschungsmethoden, wie z.B. anonyme Interviews, gesammelt werden. Beim Export der Daten können Sie den Datensatz, ähnlich einem Interviewtranskript, diesbezüglich gegenprüfen. </p>'
    },
    issue7: {
      question: 'Kann ich den Quellcode von ROSE einsehen, um diese Erklärungen zum Privatsphärenschutz zu prüfen?',
      answer: '<p>Ja. ROSE ist freie, quelloffene Software unter der GPL (GNU General Public License). Sie können den Quellcode überprüfen, verändern und weiterverwenden unter den Bedingungen der GPL. Sollten Sie Hilfe benötigen, so kontaktieren Sie den Ansprechpartner für ROSE bei Fraunhofer SIT.</p>'
    },
    issue8: {
      question: 'Kann ich ROSE nach dem Ende einer Studie für persönliche Zwecke weiter benutzen?',
      answer: '<p>Ja. Sie können ROSE für eigene Zwecke weiter benutzen, es werden automatisch keine Daten zu den Forschern weitergeleitet. Bitte berücksichtigen Sie die GPL-Lizenzbedingungen. Allerdings besteht nach Ende der Studie kein Anspruch auf Unterstützung, wie z.B. ROSE-Aktualisierungen.</p>'
    }
  },

  // About Page
  about: {
    title: 'Über ROSE',
    subtitle: 'Informationen zu ROSE',
    description: 'ROSE ist eine Webbrowser-Erweiterung, welche empirische Feldstudien unterstützt durch Aufzeichnen von Nutzerinteraktionen mit Social-Media-Plattformen für einen definierte Zeit. Bitte berücksichtigen Sie die Hilfe-Seite für weitere Informationen zu den Funktionen und Nutzung von ROSE.',
    developedBy: 'ROSE wurde entwickelt von',

    address: {
      name: 'Fraunhofer Institut für Sichere Informationstechnologie SIT',
      street: 'Rheinstraße 75',
      country: 'Deutschland'
    },

    forQuestions: 'Für Fragen zu ROSE kontaktieren Sie gern den Projektleiter:',
    licenceNotice: 'Dieses Programm ist freie Software. Sie können es unter den Bedingungen der GNU General Public License, wie von der Free Software Foundation veröffentlicht, weitergeben und/oder modifizieren, entweder gemäß Version 3 der Lizenz oder (nach Ihrer Option) jeder späteren Version.'
  },

  // Study Creator Page
  studyCreator: {
    title: 'Studienkonfigurator',
    subtitle: 'Diese Seite erlaubt das Erstellen einer maßgeschneiderten Konfigurationsdatei für Ihre Studie. Diese Konfigurationsdatei können Sie an Ihre Studienteilnehmer weiterleiten; durch Laden der Datei in die lokale Installation von ROSE passen die Studienteilnehmer ihre ROSE-Installation an die Anforderungen Ihrer Studie an.',
    roseComments: 'In-Situ-Kommentare',
    roseCommentsDesc: 'Aktivieren Sie diese Option, wenn die Funktion für In-Situ-Kommentare für Ihre Teilnehmer verfügbar sein soll. Zur Zeit arbeitet diese Funktion nur für Facebook.',
    roseCommentsRating: 'Hinzufügen der In-Situ-Bewertungsoption',
    roseCommentsRatingDesc: 'Aktivieren, falls die Funktion für In-Situ-Kommentare auch nach Bewertungen von Inhalten fragen soll.',
    salt: 'Kryptografischer Salt für die Inhalte-Identifikatoren',
    saltDesc: 'ROSE zeichnet pseudonyme Identifikatoren für Inhalte auf, welche die Interaktionen zu Inhalten und Personen später zueinander zuordenbar machen, ohne die eigentlichen Inhalte offenzulegen. Diese Identifikatoren werden aus dem Webseiten-Inhalt und einem kryptografischen Salt hergeleitet. Als Salt können Sie eine x-beliebige Zeichenkette verwenden, z.B. &ldquo;ROSE123&rdquo;. Wenn Sie Gruppen von Teilnehmern untersuchen wollen, dann sollte der Salt jedoch bei allen Teilnehmern gleich sein, da Sie sonst nachträglich Daten über Teilnehmer hinweg nicht korrelieren können.',
    hashLength: 'Länge des Identifikators für Inhalte und Personen',
    hashLengthDesc: 'Hier können Sie die Länge der pseudonymen Identifikatoren für ROSE festlegen. Sie müssen dabei Privatsphäre der Teilnehmer und Eindeutigkeit der Identifikatoren abwägen. Kürzere Identifikatoren sind privatsphäreschützender; längere Identifikatoren sind einzigartiger und Kollisionen sind unwahrscheinlicher. Jede zusätzliche Stelle erhöht den Raum verfügbarer Identifikatoren um den Faktor 16. Zum Beispiel, erlaubt die Länge 4 somit 16*16*16*16=65536 eindeutige Identifikatoren für Ihre Studie. Als Daumenregel ist 5 ein in der Praxis bewährter Wert.',
    repositoryUrl: 'URL des Speichers für Datensammel-Pakete',
    repositoryUrlDesc: 'ROSE erhält seine Muster um Nutzerinteraktionen zu erkennen in Datensammel-Paketen aus einem zentralen Speicher. Hier können Sie die URL dieses Online-Speichers eingeben.',
    autoUpdate: 'Automatische Aktualisierung der Muster während der Studie',
    autoUpdateDesc: 'Datensammel-Pakete mit Erkennungsmustern werden normalerweise nur mit einer Konfigurationsdatei in ROSE geladen. Es ist aber auch möglich sie kontinuierlich zu aktualisieren, während eine Studie läuft. Dies ist besonders wichtig für Langzeit-Studien, während der die Webseiten von Social-Media-Plattformen viele Änderungen erfahren können.',
    exportConfig: 'Exportiere Konfigurationsdatei',
    exportConfigDesc: 'Hier können Sie eine Konfigurationsdatei exportieren, welche alle Einstellungen von dieser Seite enthält. Ihre Studienteilnehmer können diese Datei in ihre ROSE-Installation laden.',
    fingerprint: 'Schlüssel-Fingerabdruck des Speichers für Datensammel-Pakete',
    fingerprintDesc: 'Aus Sicherheitsgründen müssen die Muster in den Datensammel-Paketen mit RSA signiert werden. Diese Signatur wird geprüft, bevor ROSE die enthaltenen Muster lädt. Bitte geben Sie den hexadezimalen SHA-1-Fingerabdruck für den öffentlichen Schlüssel ein, welchen ROSE benutzen soll, um die digitale Signatur zu prüfen.',
    optionalFeaturesHeader: 'Optionale Funktionen',
    privacyHeader: 'Privatsphäre-Einstellungen',
    repositoryHeader: 'Speicher für Datensammel-Pakete konfigurieren',
    configurationHeader: 'Datensammlung konfigurieren',
    autoUpdateHeader: 'Automatische Aktualisierung der Datensammel-Pakete konfigurieren',
    networks: 'Zu überwachende Social-Media-Plattformen',
    networksDesc: 'Hier können Sie ein- und ausschalten, auf welchen Webseiten ROSE Daten sammeln soll.',
    patterns: 'Verfügbare Aufzeichnungsmuster',
    enableAll: 'Alle verfügbaren aktivieren',
    disableAll: 'Alle verfügbaren de-aktivieren',
    forceSecureUpdate: 'Sichere Aktualisierungen verlangen',
    forceSecureUpdateDesc: 'Wenn diese Funktion angeschaltet ist, dann sind Aktualisierungen der Datensammel-Pakete nur aus sicherer Quelle erlaubt. Sie müssen dann den korrekten Fingerabdruck des öffentlichen Signaturschlüssels oben angeben.',
    updateInterval: 'Intervall für die automatische Prüfung auf Aktualisierung der Datensammel-Pakete',
    updateIntervalLabel: 'Wählen Sie ein Intervall, um nach Aktualisierungen der Datensammel-Pakete zu suchen',
    baseFileNotFound: 'Ungültige URL der Basisdatei des Datenspeichers.',

    table: {
      enabled: 'Status (An/Aus)',
      name: 'Muster-Name',
      version: 'Aktuelle Version',
      description: 'Erläuterung',
      type: 'Typ'
    }
  },

  // Application Log
  debugLog: {
    title: 'Anwendungsprotokoll',
    subtitle: 'Diese Seite zeigt alle Nachrichten, welche die Module von ROSE ausgegeben haben',
    date: 'Zeitstempel',
    message: 'Meldung',
    module: 'Modulname'
  },

  observerEditor: {
    title: 'Editor für Observations-Muster',
    subtitle: 'Dieser Editor erlaubt das Verändern der Observations-Muster zu Testzwecken, oder um neue zu erstellen. Diese Funktionen ist für Experten.'
  },

  dataConverter: {
    title: 'Datenkonverter',
    subtitle: 'Konverter um XML-ROSE-Exporte in CSV-Dateien umzuwandeln. Laden Sie die XML-Datei und wählen Sie die Datensätze, welche in die CSV-Datei übertragen werden sollen.'
  }
}
