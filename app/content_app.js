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
            var facebookUI = new FacebookUI();
            facebookUI.redrawUI();
            // setTimeout(facebookUI.startSurvey, 5000, facebookUI);
          }

          ClickTracker.start();
          MouseMoveTracker.start();
          ScrollTracker.start();
          FBLoginTracker.start();

          return true;
        }
      });
    }});
  }}); //wait for success

kango.addMessageListener('TriggerSurvey', function(event) {
  if (event.data && facebookUI !== undefined) {
    facebookUI.startSurvey(facebookUI);
  }
  else {
    alert('Trigger ' + (event.data ? 'Survey 1 (Engage), but you are not on FB' : 'Survey 2 (Disengage)'));
    console.log(window);
  }
});



})();
