# Extractors

Extractors contain information on how to extract user data from a social network. An extractor is identified by a name and is linked to a social network. The extractor captures appropriate user data and stores it in storage either from an url in a predefined interval or from a user interaction.

## General Structure

An extractor is denoted as a JSON object. The skeleton of an extractor contains the following fields:

* `name`: String. The `name` field denotes the extractor's name. It is advised to use hyphenated words to name an extractor, e.g. `this-is-a-name`. The name should reflect the type of content elemnt it extracts. In combination with the `network` field, this field identifies an extractor.

* `network`: String. The `network` field denotes the network the extractor belongs to. The following values are allowed in this field: `facebook`, `gplus`, `twitter`.

* `version`: String. The `version` field denotes the observer's development version, specified in a *major.minor* versioning scheme.

* `type`: String. The `type` field denotes wether the extractor is handlung html elements, like a container sent from an observer or an url which has to be called. The following values are allowed in this field: `container`, `url`. Dependent on this field, other fields are necessary for the observer to work.

* `interval`: String (optional: only applies for URL extractors). The `interval` field denotes how often the extractor's is executed in milliseconds.

* `informationUrl`: String (optional: only applies for URL extractors). The `informationUrl` denotes which url contains the data the extractor is looking for.

* `container`: String (optional: only applies for URL extractors). If specified the fields are only extracted from a certain scope.

* `fields`: String. Each field represents a datum that is extrated and stored to database. It constists of the following fiels:
    * `name`: String. With this name the datum is stored in to db.
    * `selector`: String. A JQuery selector to identified a html element that contains the requested datum.
    * `attr`: String. Either a HTML attribute name which will be extracted from the element or the literal string `content` to obtain the innerHTML of the element.
    * `match`: String. A RegEx without scope definition. The extract is matched by this RegEx to clean urls or else.
    * `hash`: Boolean. If true the extract is hashed to secure the participants privacy.

An example for a skeleton of an observer is:

```JSON
    {
        "name": "status-update",
        "network": "facebook",
        "version": "0.1",
        "informationUrl" : "https://www.facebook.com/settings/?tab=privacy",
        "interval" : 43200,
        "fields": [{
          "name": "contentId",
          "selector": "> div.clearfix > div > div > div > div > div > span > span > a:first-child",
          "attr": "href",
          "match": ".+(?=\\?)|.+",
          "hash": true
        }, ... ]
      },
    }
```

## Changelog

2015-09-06 Felix Epp <felix.epp@sit.fraunhofer.de>

* Typos

2015-05-26 Felix Epp <work@felixepp.de>

* Added separation into url and container extractor

* Added fields definition

2015-02-12 Felix Epp <work@felixepp.de>

* Added general structure, and `process` function specification.
