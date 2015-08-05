/*
Copyright (C) 2015
    Oliver Hoffmann <oliverh855@gmail.com>
    Felix Epp <work@felixepp.de>

This file is part of ROSE.

ROSE is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ROSE is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ROSE.  If not, see <http://www.gnu.org/licenses/>.
 */

import 'babelify/polyfill';

import log from 'rose/log';
import ExtractorEngine from 'rose/extractor-engine';
import ObserverCollection from 'rose/collections/observers';
import ExtractorCollection from 'rose/collections/extractors';
// import SystemConfigs from 'rose/models/system-config';
import Updater from 'rose/updater';

import WindowTracker from 'rose/activity-trackers/window';

/* Background Script */
(async function() {

  //*******************************//
  // Careful deletes all Rose data //
  //*******************************//
  // localforage.clear();

  const installDate = await localforage.getItem('install-date')
  if (!installDate) {
    await localforage.setItem('install-date', new Date().toJSON());
  }

  const roseDataVersion = await localforage.getItem('rose-data-version')
  if (!roseDataVersion) {
    await localforage.setItem('rose-data-version', '2.0');
  }

  WindowTracker.start();


  // setTimeout(Updater.update,5000);
})();

kango.ui.browserButton.addEventListener(kango.ui.browserButton.event.COMMAND, function(event) {
    kango.browser.tabs.create({url: kango.io.getResourceUrl('ui/index.html')});
});


kango.addMessageListener('Update', () => {
  Updater.update();
});

kango.addMessageListener('LoadNetworks', (event) => {
    console.log(event.target, ' says: ', event.data);

    /*
     * Store Observers and extractors in storage
     * FIX: Updater loads observers
     * Fix: Remove old networks
     */
    var extractorCol = new ExtractorCollection();
    var observerCol = new ObserverCollection();
    var networks = event.data;


    observerCol.fetch({success: () => {
    //   observerCol.each((model) => {
    //     observerCol.remove(model);
    //     model.destroy();
    //   });
      extractorCol.fetch({success: () => {
      //   extractorCol.each((model) => {
      //     extractorCol.remove(model);
      //     model.destroy();
      //   });
        for (var i = 0; i < networks.length; i++) {
          if(networks[i].observers !== undefined) {
            for (var j = 0; j < networks[i].observers.length; j++) {
              //verify
              observerCol.create(networks[i].observers[j]);
            }
          }
          if(networks[i].extractors !== undefined) {
            for (var k = 0; k < networks[i].extractors.length; k++) {
              //verify
              extractorCol.create(networks[i].extractors[k]);
            }
          }
        }
        //call to start extractorengine
        var extractorEngine = new ExtractorEngine(extractorCol);
        extractorEngine.register();
      }});
    }});
});
