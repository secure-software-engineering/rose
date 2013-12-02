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

require 'DOM'
require 'Utilities'

class @FacebookLikeObserver
	patterns: [
		'<div role="article"><h5><div class="actorName"><a>{author}</a></div></h5><h5><span><div><span class="userContent">{content}</span></div></span></h5><form><span><span><a class="share_action_link"></a></span></span></form></div>'
	]

	getID: (obj) ->
		# FIXME: needs to be implemented. right now it's just a stub
		Utilities.hash(obj)
	
	getEventType: ->
		"click"
	
	getIntegrationPatterns: ->
		[".UFILikeLink", ".UFICommentActions > a", ".UFILikeThumb"]
	
	sanitize: (record) ->
		#for secretField in ["author", "content"]
		#	record[secretField] = Utilities.hash(record[secretField]) if record[secretField]
		
		return record
	
	handleNode: (node) ->
		# Get parent container.
		parent = $(node).closest('.storyInnerContent')
		
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
		
		# Traverse through patterns.
		for pattern in @patterns
			# Assemble pattern for call.
			args =
				structure: pattern
			
			# Try to apply pattern.
			result = $(parent).applyPattern(args)
			
			if result['success']
				# Successful? Sanitize and return record.
				record = @sanitize(result['data'][0])
				
				# Set interaction type (like, unlike, unknown).
				record['type'] = interactionType
				
				return {
					'found': true,
					'record': record
				}
		
		# Nothing found? Return failure.
		return {
			'found': false
		}
	
	getObserverType: ->
		"pattern"