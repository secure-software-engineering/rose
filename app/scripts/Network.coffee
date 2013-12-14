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

require 'InteractionFactory'
require 'Storage/Storage'

class @Network
    # Network name.
    network:   "Facebook"

    # List of observers.
    observers: []
    
    # List of extractors.
    extractors: []

    isOnNetwork: ->
        # Stub.
        false

    applyObservers: ->
        # Integrate observers.
        for observer in @observers
            @integrateObserver observer
    
    applyExtractors: ->
        # Integrate extractors.
        for extractor in @extractors
            @integrateExtractor extractor

    integrateObserver: (observer) ->
        # Get network name.
        name = @getNetworkName()
        
        if observer.getObserverType() is "pattern"
            # Integrate observer the pattern way.
            $(observer.getIntegrationPatterns().join(", ")).each ->
                # Skip if already integrated.
                return if $(this).hasClass("rose-integrated")
        
                # Add integration class.
                $(this).addClass("rose-integrated")
                
                $(this).on observer.getEventType(), (e) ->
                    # Get parsed information, if possible.
                    parsed = observer.handleNode(this)
                    
                    if parsed['found']
                        # If record is valid, save interaction.
                        Storage.addInteraction(parsed['record'], name)
        
        if observer.getObserverType() is "classic"
            # Integrate observer the classic way.
            $(observer.getIntegrationPatterns().join(", ")).each ->
                # Skip if already integrated.
                return if $(this).hasClass("rose-integrated")
    
                # Add integration class.
                $(this).addClass("rose-integrated")
    
                # Add functionality.
                $(this).on observer.getEventType(), (e) ->
                    # Get data.
                    data = observer.getData($(this))
    
                    # Add interaction.
                    Storage.addInteraction(data, name)
    
    integrateExtractor: (extractor) ->
        action = () ->
            Storage.getLastExtractionTime extractor.getNetworkName(), extractor.getExtractorName(), (extractionTime) ->
                # Wrap in Date class.
                extractionTime = new Date(extractionTime)
                
                # Check if extraction should be performed.
                if (new Date() - extractionTime) > Constants.getExtractionInterval()
                    # Execute extractor.
                    extractor.extractInformation()
                    
                    # Set extraction time.
                    Storage.setLastExtractionTime extractor.getNetworkName(), extractor.getExtractorName(), (new Date()).toJSON()
        
        setInterval action, Constants.getExtractionCheckInterval()
    
    integrateIntoDOM: ->
        # Stub.
        true

    getNetworkName: ->
        @network
