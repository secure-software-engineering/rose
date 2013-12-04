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

class @FacebookHideActivityObserver
    getIntegrationPatterns: ->
        ['a[ajaxify*="customize_action=2"]']

    getEventType: ->
        "click"

    getData: (obj) ->
        # Get event URL.
        ajaxify = obj.attr("ajaxify")

        # Extract status ID.
        match = /unit_data%5Bhash%5D=(.+?)&/.exec ajaxify

        # No match found?
        if match is null
            return

        id = match[1]

        # Get Facebook like observer.
        likeObserver = new FacebookLikeObserver()

        # Get result of like observer.
        result = likeObserver.handleNode("#tl_unit_" + id + " div[role=article]", "timeline")

        if not result['found']
            return

        # Return meta data.
        return {
            'object': result['record']['object'],
            'type': "hideactivity"
        }

    getObserverType: ->
        "classic"
