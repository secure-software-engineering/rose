import ConfigModel from 'rose/models/system-config';
import ObserverCollection from 'rose/collections/observers';
import ExtractorCollection from 'rose/collections/extractors';

let configs = new ConfigModel();

let update = () => {
  configs.fetch({success: () => {
    //request repo url and update observer/extractor accordingly
    // $.get(configs.get('repositoryURL'), function(data) {
    $.get('https://secure-software-engineering.github.io/rose/example/base.json', function(data) {

      console.log(data);

      //verfiy timestamp and signature
      //iterate through networks


      let lastUpadte = 1436534468580;
      if (lastUpadte < data.timestamp) {

        // let networks = this.configs.get(networks);
        let networks = [{ id: 1, name: 'Facebook', descriptiveName: 'Facebook', identifier: 'facebook.com'}];
        for (var n = networks.length - 1; n >= 0; n--) {
          debugger;
          let remoteNetwork = _.findWhere(data.networks, {id: networks[n].id, name: networks[n].name});

          if (remoteNetwork !== undefined) {
            //request observer file
            $.get('https://secure-software-engineering.github.io/rose/example/' + remoteNetwork.observers, function(observers) {
              console.log(observers);
              updateByVersion(new ObserverCollection(), observers);
            });
            //request extractor file
            $.get('https://secure-software-engineering.github.io/rose/example/' + remoteNetwork.extractors, function(extractors) {
              console.log(extractors);
              updateByVersion(new ExtractorCollection(), extractors);
            });

          }
        }
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
        if(version1[i] !== version2[i]){
            break;
        }
    }
    return(result);
};

let updateByVersion = (collection, newCollection) => {
  collection.fetch({success: () => {
         debugger;
    collection.each((model) => {
      let remoteModel = _.findWhere(newCollection, {name: model.get('name'), network: model.get('network')});
      if (remoteModel !== undefined && compareVersion(model.get('version'), remoteModel.version)) {
        model.save(remoteModel);
        console.log('updated observer/extractor');
      }
      else console.log('no update');
    });
  }});
};

export default {update};
