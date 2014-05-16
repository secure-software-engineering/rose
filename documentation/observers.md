# Observers

Observers contain information on how to observe the Document Object Model (DOM) of a social network. An observer is identified by a name and is linked to a social network. Once the observed event is triggered, it captures appropriate user data and stores it in storage.

## General Structure

An observer is denoted as a JSON object. The skeleton of an observer contains the following fields:

* `name`: String. The `name` field denotes the observer's name. It is adviced to use hyphenated words to name an observer, e.g. `this-is-a-name`. In combination with the `network` field, this field identifies an observer.

* `network`: String. The `network` field denotes the network the observer belongs to. The following values are allowed in this field: `facebook`, `gplus`, `twitter`.

* `type`: String. The `type` field denotes the observer's type. The following values are allowed in this field: `pattern`, `input`. Dependent on this field, other fields are necessary for the observer to work.

* `version`: String. The `version` field denotes the observer's development version, specified in a *major.minor* versioning scheme.

An example for a skeleton of an observer is:


    {
        "name": "like-observer",
        "network": "facebook",
        "type": "pattern",
        "version": "0.1"
    }

## Observer Types

The following types of observers can be specified:

* `pattern`: A pattern observer contains a set of patterns. Once a `click` event is triggered, the patterns are applied in order. The first pattern that matches extracts a data object which is then passed to the appropriate `process` function.

* `input`: An input observer contains a set of DOM identifiers. Once a `keydown` event is triggered with the entered key representing enter, the input field's identifier is checked against the identifiers in this set. If one identifier matches, the contents of the input field are then passed to the appropriate `process` function.

## Pattern Observers

A pattern observer extends the skeleton of an observer with the following fields:

* `patterns`: Array. The `patterns` field is an array containing elements of the structure provided below. The `pattern` field contains a pattern, the `process` field contains a JavaScript function serialized as a String, and the `signature` field contains the signature of the `process` field (underspecified at the moment).

Pattern structure:

    {
        "pattern": "...",
        "process": "function (data) { ... }",
        "signature": "..."
    }

## Input Observers

An input observer extends the skeleton of an observer with the following fields:

* `inputs`: Array. The `inputs` field is an array containing elements of the structure provided below. The `identifier` field contains a DOM identifier (e.g. `#inputfield`), the `process` field contains a JavaScript function serialized as a String, and the `signature` field contains the signature of the `process` field (underspecified at the moment).

Inputs structure:

    {
        "identifier": "...",
        "process": "function (data) { ... }",
        "signature": "..."
    }

## The `process` function

The `process` function expects exactly one argument, `data`. The `data` argument can either be a String, an array of values, or a JavaScript object. A pattern observer, on the one hand, extracts multiple data sets from a DOM structure and therefore populates the `data` argument with an object containing these data sets. An input observer, on the other hand, usually reads the contents of one input container and therefore passes a String to the `process` function.

The return value of the `process` function is saved as a new interaction in storage.

The `process` function is written in JavaScript and serialized as a String. In order to verify its origins, the `signature` field has to contain a valid signature of the function's serialization.

## Changelog

2014-05-16 Sebastian Ruhleder <sebastian.ruhleder@googlemail.com>

* First revision of Observer specification.

* Added general structure, observer types, pattern and input observer specification, and `process` function specification.