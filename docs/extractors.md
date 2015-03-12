# Extractors

Extractors contain information on how to extract user data from a social network. An extractor is identified by a name and is linked to a social network. The extractor captures appropriate user data and stores it in storage in a predefined interval.

## General Structure

An extractor is denoted as a JSON object. The skeleton of an extractor contains the following fields:

* `name`: String. The `name` field denotes the extractor's name. It is advised to use hyphenated words to name an extractor, e.g. `this-is-a-name`. In combination with the `network` field, this field identifies an extractor.

* `network`: String. The `network` field denotes the network the extractor belongs to. The following values are allowed in this field: `facebook`, `gplus`, `twitter`.

* ~~`type`: String. The `type` field denotes the observer's type. The following values are allowed in this field: `pattern`, `input`. Dependent on this field, other fields are necessary for the observer to work.~~

* `version`: String. The `version` field denotes the observer's development version, specified in a *major.minor* versioning scheme.

* `interval`: String. The `interval` field denotes how often the extractor's is executed.

* `informationUrl`: String. The `informationUrl` denotes which url contains the data the extractor is looking for.

An example for a skeleton of an observer is:

```JSON
    {
        "network": "Facebook",
        "name": "privacy-settings",
        "version": "0.0",
        "informationUrl" : "https://www.facebook.com/settings/?tab=privacy",
        "interval" : 43200,
        "process" : "function(content){var $data, entry;\r\n            $data = $(content);\r\n            entry = {};\r\n            $data.find(\".fbSettingsSectionsItem\").each(function() {\r\n              var section;\r\n              section = $(this).find(\".fbSettingsSectionsItemName\").html();\r\n              entry[section] = {};\r\n              $(this).find(\".fbSettingsListItemContent\").each(function() {\r\n                var key, value;\r\n                key = $(this).find(\"div:nth-child(1)\").html();\r\n                value = $(this).find(\"div:nth-child(2)\").html();\r\n                entry[section][key] = value;\r\n              });\r\n            });return entry}"
    }
```


## The `process` function

The `process` function expects exactly one argument, `data`. The `data` contains a complete DOM Object of the requested informationUrl.

The return value of the `process` function is saved as a static entry data in storage.

The `process` function is written in JavaScript and serialized as a String. In order to verify its origins, the `signature` field has to contain a valid signature of the function's serialization.

## Changelog

2015-02-12 Felix Epp <work@felixepp.de>

* Added general structure, and `process` function specification.
