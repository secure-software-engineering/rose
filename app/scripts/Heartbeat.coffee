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

class @Heartbeat
    @_heartbeat: {}
    
    @isInitialized: false
    
    @initialize: ->
        # Set flag.
        @isInitialized = true
        
        # Set reference.
        ref = this
        
        # Load heartbeat data.
        kango.invokeAsync 'kango.storage.getItem', 'heartbeat', (data) ->
            ref.setHeartbeatData(data)
    
    @getHeartbeat: (name, callback) ->
        # Return heartbeat, if it contains a valid Date object.
        return @_heartbeat[name] if @_heartbeat[name] instanceof Date
        
        # Otherwise...
        return null
    
    @setHeartbeat: (name) ->
        # Set heartbeat to current timestamp.
        @_heartbeat[name] = new Date()
        
        # Save heartbeat data.
        kango.invokeAsync 'kango.storage.setItem', 'heartbeat', @_heartbeat
    
    @setHeartbeatData: (data) ->
        return if data is null
        
        @_heartbeat = data
