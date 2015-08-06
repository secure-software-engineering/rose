import ConfigModel from 'rose/models/system-config';
import ObserverCollection from 'rose/collections/observers';
import ExtractorCollection from 'rose/collections/extractors';
import NetworkCollection from 'rose/collections/networks';

let configs = new ConfigModel();

let update = () => {
  configs.fetch({success: () => {
    //request repo url and update observer/extractor accordingly
    // FIXME: use url from configs
    // $.get(configs.get('repositoryURL'), function(data) {
    $.get('https://secure-software-engineering.github.io/rose/example/base.json', function(data) {

      console.log(data);

      // FIXME: verfiy signature

      if (configs.get('timestamp') < data.timestamp) {

        // iterate through networks
        let networks = new NetworkCollection();
        networks.fetch({success: () => {
          networks.each((network) => {

            let remoteNetwork = _.findWhere(data.networks, {name: network.get('name')});

            if (remoteNetwork !== undefined) {
              //request observer file
              $.get(data.url + remoteNetwork.observers, function(observers) {
                console.log(observers);
                updateByVersion(new ObserverCollection(), observers);
              });
              //request extractor file
              $.get(data.url + remoteNetwork.extractors, function(extractors) {
                console.log(extractors);
                updateByVersion(new ExtractorCollection(), extractors);

                //call ExtratorEngine to start
              });
            }

          });
        }});

      }

    });
  }});
};

let compareVersion = (version1, version2) => {

    var result = false;

    version1 = version1.split('.');
    version2 = version2.split('.');

    for(var i=0; i < (Math.max(version1.length,version2.length)); i++){

        if(version1[i] === undefined){ version1[i] = 0; }
        if(version2[i] === undefined){ version2[i] = 0; }

        if(Number(version1[i]) < Number(version2[i])){
            result = true;
            break;
        }
        if(version1[i] !== version2[i]) {
            break;
        }
    }
    return(result);
};

let updateByVersion = (collection, newCollection) => {
  collection.fetch({success: () => {
    collection.each((model) => {
      let remoteModel = _.findWhere(newCollection, {name: model.get('name'), network: model.get('network')});
      if (remoteModel !== undefined && compareVersion(model.get('version'), remoteModel.version)) {
        model.save(remoteModel);
        console.log('updated observer/extractor');
      }
      else {
        console.log('no update');
      }
    });
  }});
};

let load = (networks) => {
  var extractorCol = new ExtractorCollection();
  var observerCol = new ObserverCollection();
  var networkCol = new NetworkCollection();

  networkCol.fetch({success: () => {
    observerCol.fetch({success: () => {
      extractorCol.fetch({success: () => {
        for (var i = 0; i < networks.length; i++) {
          if(networks[i].observers !== undefined) {
            for (var j = 0; j < networks[i].observers.length; j++) {
              observerCol.create(networks[i].observers[j]);
            }
          }
          if(networks[i].extractors !== undefined) {
            for (var k = 0; k < networks[i].extractors.length; k++) {
              extractorCol.create(networks[i].extractors[k]);
            }
            //call extractorEngine to start
          }

          delete networks[i].observers;
          delete networks[i].extractors;
          networkCol.create(networks[i]);
        }
      }});
    }});
  }});
};

export default {update, load};
