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

import ObserverEngine from './rose/observer-engine'
import FacebookUI from './rose/facebook-ui'
import SystemConfigModel from './rose/models/system-config'
import UserSettingsModel from './rose/models/user-settings'
import NetworkCollection from './rose/collections/networks'

import ClickTracker from './rose/activity-trackers/click'
import MouseMoveTracker from './rose/activity-trackers/mousemove'
import ScrollTracker from './rose/activity-trackers/scroll'
import FBLoginTracker from './rose/activity-trackers/facebook-login';

/* Content Script */
(function () {
    let configs = new SystemConfigModel()
    let networks = new NetworkCollection()
    let networkName, facebookUI
    new UserSettingsModel().fetch({success: (settings) => {
        if (settings.get('trackingEnabled') !== true) return
        networks.fetch({success: () => {
            networks.find((network) => {
                // Detect network by its domain in the current origin of this page
                if ((new RegExp('^https:\/\/[\w\.\-]*(' + network.get('identifier').replace(/\./g, '\\$&') + ')$')).test(window.location.origin)) {
                    networkName = network.get('name')

                    kango.dispatchMessage('registerTab')
                    kango.addMessageListener('toggle-tracking', function (event) {
                        if (event.data) {
                            startTracking()
                        } else {
                            ObserverEngine.unregister()

                            ClickTracker.stop()
                            MouseMoveTracker.stop()
                            ScrollTracker.stop()

                            if (networkName === 'facebook') {
                                if (facebookUI) facebookUI.removeUI()
                                FBLoginTracker.stop()
                            }
                        }
                    })

                    return startTracking()
                }
            })
        }})
    }})

    function startTracking () {
        ObserverEngine.register(networkName)

        ClickTracker.start(networkName)
        MouseMoveTracker.start(networkName)
        ScrollTracker.start(networkName)

        if (networkName === 'facebook') {
            FBLoginTracker.start(networkName)

            configs.fetch({success: () => {
                if (configs.get('roseCommentsIsEnabled')) {
                    if (!facebookUI) facebookUI = new FacebookUI()
                    else facebookUI.injectUI()
                    facebookUI.redrawUI()
                }
            }})
        }
    }
})()
