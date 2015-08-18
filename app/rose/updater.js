import ConfigModel from 'rose/models/system-config';
import ObserverCollection from 'rose/collections/observers';
import ExtractorCollection from 'rose/collections/extractors';
import NetworkCollection from 'rose/collections/networks';

let configs = new ConfigModel();

let update = () => {
  configs.fetch({success: () => {
    //request repo url and update observer/extractor accordingly
    $.get(configs.get('repositoryURL'), function(data) {

      console.log(data);

      // FIXME: verfiy signature

      if (configs.get('timestamp') < data.timestamp) {

        configs.set('timestamp', data.timestamp);
        configs.save();
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

let compareVersion = (oldVersion, newVersion) => {

    var result = false;

    oldVersion = oldVersion.split('.');
    newVersion = newVersion.split('.');

    for(var i=0; i < (Math.max(oldVersion.length,newVersion.length)); i++){

        if(oldVersion[i] === undefined){ oldVersion[i] = 0; }
        if(newVersion[i] === undefined){ newVersion[i] = 0; }

        if(Number(oldVersion[i]) < Number(newVersion[i])){
            result = true;
            break;
        }
        if(oldVersion[i] !== newVersion[i]) {
            break;
        }
    }
    return result;
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
