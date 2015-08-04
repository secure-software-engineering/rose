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
import ExtractorCollection from 'rose/collections/extractors';
// import SystemConfigs from 'rose/models/system-config';
import Updater from 'rose/updater';

import WindowTracker from 'rose/activity-trackers/window';
import EngageTracker from 'rose/activity-trackers/engage';

/* Background Script */
(async function() {

  //*******************************//
  // Careful deletes all Rose data //
  //*******************************//
  // localforage.clear();

  const installDate = await localforage.getItem('install-date')
  if (!installDate) {
    await localforage.setItem('install-date', new Date().toJSON());
    kango.browser.tabs.create({url: kango.io.getResourceUrl('ui/index.html')});
  }

  const roseDataVersion = await localforage.getItem('rose-data-version')
  if (!roseDataVersion) {
    await localforage.setItem('rose-data-version', '2.0');
  }

  WindowTracker.start();

  EngageTracker.start();


  // setTimeout(Updater.update,5000);
})();

kango.ui.browserButton.addEventListener(kango.ui.browserButton.event.COMMAND, function(event) {
    kango.browser.tabs.create({url: kango.io.getResourceUrl('ui/index.html')});
});


kango.addMessageListener('Update', () => {
  Updater.update();
});

kango.addMessageListener('LoadNetworks', (event) => {
    Updater.load(event.data);
});

kango.addMessageListener('StartExtractorEngine', (event) => {
  let extractorCol = new ExtractorCollection();
  extractorCol.fetch({success: (extractorCol) => {
    let extractorEngine = new ExtractorEngine(extractorCol);
    extractorEngine.register();
  }});
});
