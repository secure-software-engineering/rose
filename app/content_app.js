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

import ObserverEngine from 'rose/observer-engine';
import FacebookUI from 'rose/facebook-ui';
import SystemConfigModel from 'rose/models/system-config';
import NetworkCollection from 'rose/collections/networks';

import ClickTracker from 'rose/activity-trackers/click';
import MouseMoveTracker from 'rose/activity-trackers/mousemove';
import ScrollTracker from 'rose/activity-trackers/scroll';
import FBLoginTracker from 'rose/activity-trackers/facebook-login';

var facebookUI;

/* Content Script */
(function() {
  var configs = new SystemConfigModel();
  var networks = new NetworkCollection();
  configs.fetch({success: () => {
    networks.fetch({success: () => {
      networks.find((network) => {

        // Detect network by its domain in the current origin of this page
        if ((new RegExp('^https:\/\/[\w\.\-]*(' + network.get('identifier').replace(/\./g, '\\$&') + ')$')).test(window.location.origin)) {
          let networkName = network.get('name');

          /* Observer Engine
           * ----------------
           * Start observer engine.
           */
          ObserverEngine.register(networkName);

          if (networkName === 'facebook' && configs.get('roseCommentsIsEnabled')) {
            facebookUI = new FacebookUI();
            facebookUI.redrawUI();
          }

          ClickTracker.start();
          MouseMoveTracker.start();
          ScrollTracker.start();
          FBLoginTracker.start();

          return true;
        }
      });
    }});
  }});
})();

let limit = 0;
let startSurvey1 = () => {
    if (facebookUI !== undefined && facebookUI._ready) {
        facebookUI.startSurvey(facebookUI);
    }
    else {
      if (limit < 15) {
        limit++;
        setTimeout(startSurvey1, 1000);
      }
    }
};

kango.addMessageListener('TriggerSurvey', function(event) {
  kango.dispatchMessage('TriggerSurveyReceived', event.data.token);
  if (event.data.engage){
    startSurvey1();
  }
});
