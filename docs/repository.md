# Repository

An observer and extractor repository can be published via HTTP and is identified by a URL. It contains a configuration (or status) file and multiple directories. Every instance of the ROSE plugin is configured to synchronize its observers and extractors with one repository.

## Configuration File

Every repository must have one configuration file named `config.json`, reachable at `http://X/Y/config.json` if `http://X/Y/` is the URL of the repository. This configuration file contains a JSON object with the following fields:

* `name`: String. Name of the repository.

* `revision`: Int. Revision number of the repository. If the last check performed by the ROSE plugin has synchronized with a repository with a lower revision number than the current one, an update should be performed.

* `observers`: Array. An array containing information on the available observer files in this repository. See below how the elements of this array are structured.

* `extractors`: Array. An array containing information on the available extractor files in this repository. See below how the elements of this array are structured.

## `observers` Array

The `observers` array consists of JSON objects containing the following fields:

* `name`: String. Name of the observer.

* `filename`: String. Name of the file the observer's information are stored in.

* `version`: String. Version number of the observer in *major.minor.build* format.

An observer with the filename `filename` should be located at `http://X/Y/observers/filename` if `http://X/Y/` is the URL of the repository.

## `extractors` Array

The `extractors` array consists of JSON objects containing the following fields:

* `name`: String. Name of the extractor.

* `filename`: String. Name of the file the extractor's information are stored in.

* `version`: String. Version number of the extractor in *major.minor.build* format.

An extractor with the filename `filename` should be located at `http://X/Y/extractors/filename` if `http://X/Y/` is the URL of the repository.

## Changelog

2014-05-18 Sebastian Ruhleder <sebastian.ruhleder@googlemail.com>

* First revision of Repository specification.