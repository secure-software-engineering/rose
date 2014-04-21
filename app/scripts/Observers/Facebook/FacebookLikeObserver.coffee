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

class @FacebookLikeObserver
    # text_exposed_root
    patterns: {
        "status": [
            '<div class="userContentWrapper"><div><h5><span><a>{owner}</a></span></h5></div><div><a ajaxify="{id}"><div><img></img></div></a></div></div>',
            '<div class="userContentWrapper"><div><h5><div><span><a>{owner}</></span></div></h5></div><div class="userContent">{id}</div></div>',
            '<div class="userContentWrapper"><div><h5><span><a class="profileLink">{sharer}</a></span></h5></div><div><a ajaxify="{id}"><div><img></img></div></a></div></div>'
        ],
        "comment": [
            '<div class="UFICommentContent"><a class="UFICommentActorName">{owner}</a><span class="UFICommentBody"><span>{id}</span></span></div>'
        ],
        "timeline": [
            '<div role="article"><div><h5><span><span><a>{owner}</a></span></span></h5></div><div class="userContentWrapper"><span>{id}</span></div></div>',
            '<div><div role="article"><div><div><h5><span><span><a>{owner}</a></span></span></h5></div></div><ul><span class="userContent">{id}</span></ul></div></div>',
            '<div class="timelineUnitContainer"><h5><span><span><a>{owner}</a></span></span></h5><div class="photoUnit"><a ajaxify="{id}"><div><img></img></div></a></div></div>'
        ]
    }

    containers: {
        "status": ".userContentWrapper",
        "comment": ".UFIComment",
        "timeline": ".fbTimelineUnit, .timelineUnitContainer"
    }

    getEventType: ->
        "click"

    getIntegrationPatterns: ->
        [".UFILikeLink", ".UFILikeThumb"]

    sanitize: (record) ->
        # Check id for fbid URL and extract it, if possible.
        if /photo\.php/.test(record['object']['id'])
            match = record['object']['id'].match(/fbid=(.+?)&/)

            # Set id to fbid.
            record['object']['id'] = match[1]

        # Hash secret fields.
        for secretField in ["owner", "id", "sharer"]
            record['object'][secretField] = Utilities.hash(record['object'][secretField]) if record['object'][secretField]

        return record

    handleNode: (node, container = null) ->
        if container is null
            # Get container.
            container = "status"
            if $(node).parents(".fbTimelineFeedbackHeader").length
                container = "timeline"
            if $(node).parents(".UFIComment").length
                container = "comment"

        # Get parent container.
        parent = $(node).closest(@containers[container])
        if parent.length < 1
            parent = $(node).siblings().closest(@containers[container])
        if container is "status"
            # Fix for boxed statuses.
            if parent.parents(".userContentWrapper").length
                parent = parent.parent()

        # Interaction types.
        interactionTypes =
            'like': 'like'
            'unlike': 'unlike'
            'gefällt mir': 'like'
            'gefällt mir nicht mehr': 'unlike'

        # Get field content.
        fieldContent = Utilities.stripTags($(node).html()).toLowerCase()

        # Set interaction type (like, unlike, unknown).
        interactionType = interactionTypes[fieldContent]

        interactionType = "unknown/like/unlike" unless interactionType

        # Check if thumbs up button has been clicked.
        interactionType = "like" if $(node).hasClass("UFILikeThumb")

        # Determine location of interaction.
        location = "newsfeed"
        if $("body").find("div[itemtype*=Person]").length > 0
            location = "profile"
            # Get profile owner and compare to user ID.
            profileOwner = $("#fbProfileCover div[class=cover] div h2 a").html()
            profileOwner = Utilities.hash profileOwner
            if profileOwner is FacebookUtilities.getUserID()
                location = "own-profile"
        if $("body").find("div[itemtype*=Organization]").length > 0
            location = "page"
        if $("body").find("div.groupsJumpBarContainer").length > 0
            location = "group"

        # Traverse through patterns.
        records = []
        for pattern in @patterns[container]
            record = {}

            # Assemble pattern for call.
            args =
                structure: pattern

            # Try to apply pattern.
            result = $(parent).applyPattern(args)

            if result['success']
                # Add location.
                record['location'] = location

                # Successful? Sanitize and return record.
                record['object'] = result['data'][0]

                # Set object container type.
                record['object']['type'] = container

                # Set interaction type (like, unlike, unknown).
                record['type'] = interactionType

                records.push(record)

        # Nothing found? Return failure.
        if records.length is 0
            return {
                'found': false
            }

        # Prepare entry.
        entry =
            'found': true
            'record': null

        # Compare results.
        max = 0
        for record in records
            count = 0
            for key, value of record['object']
                if value isnt ""
                    count = count + 1
            if count > max
                max = count
                entry['record'] = @sanitize(record)

        return entry

    getObserverType: ->
        "pattern"
