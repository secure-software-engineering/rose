import ConfigModel from 'rose/models/system-config';
import ObserverCollection from 'rose/collections/observers';
import ExtractorCollection from 'rose/collections/extractors';
import NetworkCollection from 'rose/collections/networks';
import verify from 'rose/verify.js';
import RSVP from 'rsvp';

let configs = new ConfigModel();

let cancelUpdate = (errorMsg) => {
  console.log(errorMsg);
  kango.dispatchMessage('update-result', {status: 'failure', errorMsg});
}

let getVerified = (url, key) => {
  let file = $.get(url); //request file
  let sig = $.get(url + '.asc'); //request signature
  return new RSVP.Promise((resolve, reject) => {
    $.when(file, sig).done((fileData, sigData) => {
      verify(fileData[2].responseText, sigData[2].responseText, key).then(function(fingerprint) {
        if (parseInt(configs.get('fingerprint'), 16) === parseInt(fingerprint, 16)) {
          resolve(fileData[0]);
        }
        else {
          reject('Fingerprint does not match.');
        }
      }, function(value) {
        reject(value);
      });
    });
  });
}

let update = () => {
  configs.fetch({success: () => {
    //request repo url, signature and key
    //FIX: get repo url from configs
    $.get(configs.get('repositoryURL') + 'public.key').done((key) => {

      getVerified(configs.get('repositoryURL') + configs.get('fileName'),key).then((confData) => {
        //verification of base config file was successfull
        if (configs.get('timestamp') >= confData.timestamp) cancelUpdate('All up-to-date');
        else {

          let networks = new NetworkCollection();
          networks.fetch({success: () => {
            let promises = [];
            let cnt = 0;

            // iterate through networks that are configured in Rose
            networks.each((network) => {

              let remoteNetwork = _.findWhere(confData.networks, {name: network.get('name')});

              if (remoteNetwork !== undefined) {
                if (remoteNetwork.observers !== undefined) {
                  //request and verify observer file
                  promises.push(getVerified(confData.url + remoteNetwork.observers, key));
                }
                if (remoteNetwork.extractors !== undefined) {
                  //request and verify extractor file
                  promises.push(getVerified(confData.url + remoteNetwork.extractors, key));
                }
              }
            });

            //when all requested files are verified update configuration
            RSVP.all(promises).then((observersExtractors) => {
              //Update every network by its observers/extractors
              (new ObserverCollection()).fetch({success: (observerCollection) => {
                (new ExtractorCollection()).fetch({success: (extractorCollection) => {
                  // for collection of observers/extractors update
                  for (var i = observersExtractors.length - 1; i >= 0; i--) {
                    if (observersExtractors[i][0].type === 'input' || observersExtractors[i][0].type === 'click') {
                      cnt += updateByVersion(observerCollection, observersExtractors[i])
                    }
                    else {
                      cnt += updateByVersion(extractorCollection, observersExtractors[i]);
                    }
                  }

                  //Update sucessful: save timestamp and return result
                  configs.set('timestamp', confData.timestamp);
                  configs.save();
                  console.log('Sucessfully updated ' + cnt + 'observers/extractors');
                  kango.dispatchMessage('update-result', {status: 'success', cnt});
                }});
              }});
            },(error) => {
              cancelUpdate(error);
            });
          }});
        }
      }, (error) => {
        cancelUpdate('Verification of base file failed:' + error);
      });
    })
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
  let cnt = 0;
  collection.each((model) => {
    let remoteModel = _.findWhere(newCollection, {name: model.get('name'), network: model.get('network')});
    if (remoteModel !== undefined && compareVersion(model.get('version'), remoteModel.version)) {
      model.save(remoteModel);
      cnt++;
    }
  });
  return cnt;
};

let load = (networks) => {

  (new NetworkCollection()).fetch({success: (networkCol) => {
    (new ObserverCollection()).fetch({success: (observerCol) => {
      (new ExtractorCollection()).fetch({success: (extractorCol) => {
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
