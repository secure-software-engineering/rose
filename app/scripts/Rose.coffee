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

require 'Management'

class @Rose
    @mutationObserver: null
    
    @startedHeartbeats: []

    @startRose: ->
        # Initialize Management.
        Management.initialize()

        # Set event handling.
        Rose.mutationObserver = new MutationObserver () ->
            Rose.integrate()

        # Start observation.
        Rose.mutationObserver.observe document, {
            subtree:       true,
            childList:     true,
            characterData: true
        }

        # Get list of networks.
        networks = Management.getListOfNetworks()

        # Apply extractors for each network.
        for network in networks
            # Start heartbeat for network, if necessary.
            @startHeartbeat(network)
            
            # Apply extractors.
            network.applyExtractors()

        # Integrate into site.
        Rose.integrate()
    
    @startHeartbeat: (network) ->
        if network.getNetworkName() in @startedHeartbeats
            return
        
        @startedHeartbeats.push network.getNetworkName()
        
        # Create ticker function.
        ticker = ->
            if network.isOnNetwork()
                Heartbeat.setHeartbeat(network.getNetworkName())
        
        # Create checker function.
        checker = ->
            # Check if user is on network and otherwise return.
            if not network.isOnNetwork()
                return
            
            # Set network name.
            name = network.getNetworkName()
            
            # Get last open/close interaction type from storage.
            Storage.getLastOpenCloseInteractionType name, (lastInteractionType) ->
                # Get heartbeat.
                Heartbeat.getHeartbeat name, (heartbeat) ->
                    # If last open/close interaction was 'open'...
                    if lastInteractionType is "open"
                        # Return, if heartbeat is invalid.
                        if heartbeat is null
                            return
                        
                        if Utilities.dateDiffSeconds(heartbeat, new Date()) < Constants.getOpenCloseInterval()
                            # If last heartbeat is in interval...
                            return
                        else
                            # Otherwise, add close interaction.
                            
                            # Add heartbeat delay to heartbeat.
                            heartbeat.setMilliseconds(heartbeat.getMilliseconds() + Constants.getHeartbeatDelay())
                            
                            # Save close interaction retroactively.
                            interaction =
                                'type': 'close'
                                'time': heartbeat.toJSON()
                            Storage.addInteraction(interaction, name)
                    
                    # Still here? Save open interaction.
                    interaction =
                        'type': 'open'
                        'time': new Date().toJSON()
                    Storage.addInteraction(interaction, name)
                    
                    # Update heartbeat.
                    Heartbeat.setHeartbeat(name)
            
            # Set timeout to call checker function again.
            setTimeout checker, 1000
        
        # Set interval for ticker.
        setInterval(ticker, Constants.getHeartbeatDelay())
        
        # Call checker.
        checker()

    @integrate: ->
        # Get list of networks.
        networks = Management.getListOfNetworks()

        # Integrate networks, if possible.
        for network in networks
            # Continue unless applicable.
            continue unless network.isOnNetwork()
            
            # Apply observers.
            network.applyObservers()

            # Integrate into DOM.
            network.integrateIntoDOM()
