###
ROSE is a browser extension researchers can use to capture in situ
data on how users actually use the online social network Facebook.
Copyright (C) 2013

    Fraunhofer Institute for Secure Information Technology
    Andreas Poller <andreas.poller@sit.fraunhofer.de>

Authors

    Oliver Hoffmann <oliverh855@gmail.com>
    Sebastian Ruhleder <sebastian.ruhleder@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
###

require 'Networks/Facebook'
require 'Networks/GooglePlus'

class @Management
    @networks: []

    @isInitialized: false

    @initialize: ->
        # Update heartbeat.
        Heartbeat.initialize()
        
        if not Management.isInitialized
            # Add networks to Management.
            Management.add new Facebook()
            Management.add new GooglePlus()

            # Set initialized flag.
            Management.isInitialized = true

    @getListOfNetworks: ->
        Management.networks

    @add: (network) ->
        Management.networks.push network
