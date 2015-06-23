# Observers

Observers contain information on how to observe the Document Object Model (DOM) of a social network. An observer is identified by a name and is linked to a social network. Once the observed event is triggered, it classifies the user interaction and stores it. Optional an observer can trigger an Extractor to obtain detailed information about the interaction.

## General Structure

An observer is denoted as a JSON object. The skeleton of an observer contains the following fields:

* `name`: String. The `name` field denotes the observer's name. It is advised to use hyphenated words to name an observer, e.g. `this-is-a-name`. The name should reflect an action. In combination with the `network` field, this field identifies an observer.

* `network`: String. The `network` field denotes the network the observer belongs to. The following values are allowed in this field: `facebook`, `gplus`, `twitter`.

* `version`: String. The `version` field denotes the observer's development version, specified in a *major.minor* versioning scheme.

* `type`: String. The `type` field denotes the event type to observe. The following values are allowed in this field: `click`, `input`. `click` is triggered by any mouse click, while `input` is triggered by a press of the enter key (keydown vs keyup?)

* `priority`: Number. The `priority` field denotes at which position in the order of observers it is processed.

An example for a skeleton of an observer is:


    {
        "name": "like-content",
        "network": "facebook",
        "type": "click",
        "version": "0.1",
        "priority": 1,
        "patterns": [
            ...
        ]
    }


## Patterns

Each observer can hold multiple patterns to classify interactions by the following fields:

* `patterns`: Array. The `patterns` field is an array containing elements of the structure provided below. The `pattern` field contains a `node`, which is a selector to identify a pattern and a `container`, which shall be retrieved for identification. Optional an `extractor` can be specified to extract data from the `container`. It has to be a reference to an extractor available to the system.

Pattern structure:

    {
      node: '.UFILikeLink span:contains("Unlike"), .UFILikeLink span:contains("Gefällt mir nicht mehr")',
      container: '.userContentWrapper',
      extractor: 'StatusUpdate'
    }

## Storage

Does an observer match, this user interaction is save to storage. An `interaction` has meta data like a creation date and a storage id. The results are stored in the `origin` object with observer name, network and version. Extracts are included in an `target` object.

```
    {
        createdAt: "2015-06-23T11:53:17.251Z"
        id: "e9f067d6-6250-3af1-549a-8663e7d0a058"
        origin: {
            network: "facebook",
            observer: "like-content",
            version: "0.2"
            target: {
                sharerId: "2d7a10ae",
                contentId: "1e2148b3"
            }
        }
    }
```

## Changelog

2015-06-23 Felix A. Epp <work@felixepp.de>

* Storage definition

2015-05-26 Felix A. Epp <work@felixepp.de>

* Replace complex patterns with CSS (JQuery) selectors

* Move extraction of data to Extractors (see Extractor Documentation)

* Equalize click and input observers processing

2014-05-16 Sebastian Ruhleder <sebastian.ruhleder@googlemail.com>

* First revision of Observer specification.

* Added general structure, observer types, pattern and input observer specification, and `process` function specification.
