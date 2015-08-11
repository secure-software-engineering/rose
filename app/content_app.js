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

import ClickTracker from 'rose/activity-trackers/click';
import MouseMoveTracker from 'rose/activity-trackers/mousemove';
import ScrollTracker from 'rose/activity-trackers/scroll';
import FBLoginTracker from 'rose/activity-trackers/facebook-login';

/* Content Script */
(function() {
  var configs = new SystemConfigModel();
  configs.fetch(); //wait for success

  //Check for network
  /**
   * URL identifiers of social networks.
   * FIXME: identifiers should load from settings
   */
  var identifiers = {
    facebook: 'facebook.com',
    gplus: 'plus.google.com'
  };

  // Detect network, if possible
  for (var name in identifiers) {
    var networkDomain = identifiers[name];

          if (networkName === 'facebook' && configs.get('roseCommentsIsEnabled')) {
            var facebookUI = new FacebookUI();
            facebookUI.redrawUI();
          }

      /* Observer Engine
       * ----------------
       *
       * Start observer engine.
       */
      ObserverEngine.register(name);

      if (name === 'facebook' && configs.get('roseCommentsIsEnabled')) {
        var facebookUI = new FacebookUI();
        facebookUI.redrawUI();
      }

      ClickTracker.start();
      MouseMoveTracker.start();
      ScrollTracker.start();
      FBLoginTracker.start();

      break;
    }
  }

})();
