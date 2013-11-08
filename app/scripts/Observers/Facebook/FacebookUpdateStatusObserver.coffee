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

class @FacebookUpdateStatusObserver
	getIntegrationPatterns: ->
		["form[action*=updatestatus] button[type=submit]", "form[action*=updatestatus] input[type=submit]"]

	getEventType: ->
		"click"

	getID: (obj) ->
		obj.closest("form[action*=updatestatus]").find("input[name=xhpc_message]").attr("value")

	getMetaData: (obj) ->
		# Privacy types.
		privacyTypes = {
			# German
			'benutzerdefiniert': 'custom',
			'nur ich':           'only me',
			'freunde':           'friends',
			'öffentlich':        'public',
			# English
			'custom':  'custom',
			'only me': 'only me',
			'friends': 'friends',
			'public':  'public'
		}

		# Get privacy.
		privacy = DOM.findRelative(obj, "form": ".uiSelectorButton span").toLowerCase()

		# Consider language.
		privacy = privacyTypes[privacy]
		privacy = "privacyunknown" if privacy == null

		# Return meta data.
		return {
			'interaction_type': "updatestatus",
			'privacy_scope':    privacy,
			'object_type':      "status"
		}
	
	getObserverType: ->
		"classic"