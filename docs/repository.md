# Repository

An observer and extractor repository can be published via HTTP and is identified by a URL. It contains a configuration (or status) file and multiple directories. Every instance of the ROSE plugin can be configured and sequentially synchronized its observers and extractors with a repository.

## Configuration File

Every repository must have one configuration file named `rose3config.json`, reachable at `http://X/Y/config.json` if `http://X/Y/` is the URL of the repository. This configuration file contains a JSON object with the following fields:

### User Settings

* `roseCommentsIsEnabled`: Boolean. Wether or not commenting inside networks is enabled by default or not. (This can be changed by the user.)

* `roseCommentsRatingIsEnabled`: String. Boolean. Wether or not rating inside the commenting function is enabled by default or not. (This can be changed by the user.)

* `autoUpdateIsEnabled`: Boolean. Wether or not ROSE automatically synchronizes its observers/extractors with the repository in an predefined interval. (This can be changed by the user.)

* `updateInterval`: Number. The timespan until ROSE checks again for updates from the repository. (This can be changed by the user.)

### Internal Configurations

* `salt`: String. A preconfigured salt to ensure safer hashes.

* `hashLength`: Number. The length of the hashes ROSE generates.

* `repositoryUrl`: String. An http url to this repository folder.

* `fileName`: String. The name of this configuration file.

* `fingerprint`: String. A fingerprint of public key, which is used to sign the files in this repository.

* `timestamp`: Number. A timestamp of the last change in this repository. If the last update in an ROSE distribution is older then the current timestamp in the repository, an update should be performed.

* `networks`: Array. A array of all the networks, which can be configured to be tracked by ROSE.

## A Network

One object in the networks array has the following attributes:

* `name`: String. Name of the network used in ROSE observers/extractors and other modules.

* `descriptiveName`: String. Name used for displaying a network in the UI.

* `identifier`: String. An domainname identifier for ROSE to identify a network. (e.g., `"facebook.com"`)

* `observers`: String. A filepath relative to the location of this configuration file to a json file holding an array of observers for one particular network. See the observer documentation for specifications.

* `extractors`: String. A filepath relative to the location of this configuration file to a json file holding an array extractors for one particular network. See the extractor documentation for specifications.

## Changelog

2015-09-06 Felix Epp <felix.epp@sit.fraunhofer.de>
* All configuration fields in the repository.
* Observers/extractors stored in one file per network.

2014-05-18 Sebastian Ruhleder <sebastian.ruhleder@googlemail.com>

* First revision of Repository specification.
