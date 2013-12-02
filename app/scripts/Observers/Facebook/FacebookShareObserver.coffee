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

require 'Utilities'

class @FacebookShareObserver
    pattern: [
        '<div class="UIShareStage"><div class="UIShareStage_ShareContent"><div class="UIShareStage_Subtitle">{owner}</div><div class="UIShareStage_Summary">{id}</div></div></div>'
    ]

    getIntegrationPatterns: ->
        ["form[action*=share] button[type=submit]", "form[action*=share] input[type=submit]"]

    getEventType: ->
        "click"

    sanitize: (record) ->
        # Remove "By " from author of shared post.
        owner = record['object']['owner']
        if owner
            owner = owner.substr(owner.indexOf(' ') + 1)
        record['object']['owner'] = owner

        for secretField in ["owner", "id"]
            record['object'][secretField] = Utilities.hash(record['object'][secretField]) if record['object'][secretField]

        return record

    handleNode: (node, container) ->
        # Get parent container.
        parent = $(node).closest('div[role=dialog]')

        record = null
        
        # Assemble pattern for call.
        args =
            structure: @pattern
        
        # Try to apply pattern.
        result = $(parent).applyPattern(args)
        
        if result['success']
            record = {}

            # Successful? Sanitize and return record.
            record['object'] = result['data'][0]
            
            # Set interaction type.
            record['type'] = "share"

        # Nothing found? Return failure.
        if record == null
            return {
                'found': false
            }

        # Prepare entry.
        entry = {
            'found': true,
            'record': @sanitize(record)
        }

        return entry
    
    getObserverType: ->
        "pattern"
