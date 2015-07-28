/* ################# DRAFT ! NEVER RUN ############# */

import ConfigModel from 'models/system-config';
import ObserverCollection from 'collections/observers';
import ExtractorCollection from 'collections/extractors';

class Updater {
  constructor() {
    // code
    this.configs = new ConfigModel();
    this.configs.fetch();

    this.observers = new ObserverCollection();
    this.extractors = new ExtractorCollection();
    this.fetchCollections();
  }

  fetchCollections() {
    return $.when(this.observers.fetch(), this.extractors.fetch());
  }

  updateFromRepository() {
    //request repo url and update observer/extractor accordingly
    $.get(this.configs.get('repositoryURL'), function(data) {
        console.log(data);
        //verfiy timestamp and signature
        //iterate through networks
        let networks = this.configs.get(networks);
        for (var n = networks.length - 1; n >= 0; n--) {
            let network = networks[n].name;

            //request observer file
            //request extractor file

        };
    });
  }

  updateObservers(observers) {
      this.observers.each((observer) => {
          let remoteObserver = _.findWhere(observers, {name: observer.get('name'), network: observer.get('network')});

          if (remoteObserver !== undefined && Number(remoteObserver.version) > Number(observer.get('version'))) {
              observer.save(remoteObserver);
          }
      });

  }

  updateExtractors(extractors) {
      this.extractors.each((extractor) => {
          let remoteExtractor = _.findWhere(extractors, {name: extractor.get('name'), network: extractor.get('network')});

          if (remoteExtractor !== undefined && Number(remoteExtractor.version) > Number(extractor.get('version'))) {
              extractor.save(remoteObserver);
          }
      });

  }

  loadAllIntoStorage(networks) {
    //load all observers / extractors
  }
}

export default Updater;
