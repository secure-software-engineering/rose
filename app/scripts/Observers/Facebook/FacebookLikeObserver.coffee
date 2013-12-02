require 'DOM'
require 'Utilities'

class window.FacebookLikeObserver
	patterns: {
		"status" : [
			'<div><h5><div><a>{owner}</a></div></h5><div class="userContent">{id}</div><form></form></div>',
			'<div><h5><div><a>{owner}</a></div></h5><div class="userContent"></div><a ajaxify="{id}"><div><img></img></div></a><form></form><div class="clearfix"></div></div>',
			'<div><h6><div><a>{owner}</a></div></h6><div class="userContent">{id}</div><form></form></div>'
		],
		"comment": [
			'<div class="UFICommentContent"><a class="UFICommentActorName">{owner}</a><span><span><span>{id}</span></span></span></div>'
		],
		"timeline": [
			'<div role="article"><div><h5><span><span><a>{owner}</a></span></span></h5></div><div class="userContentWrapper"><span>{id}</span></div></div>'
		]
	}

	containers: {
		"status": ".userContentWrapper",
		"comment": ".UFIComment",
		"timeline": ".fbTimelineUnit"
	}
	
	getEventType: ->
		"click"
	
	getIntegrationPatterns: ->
		[".UFILikeLink", ".UFICommentActions > a", ".UFILikeThumb"]
	
	sanitize: (record) ->
		for secretField in ["owner", "id"]
			record['object'][secretField] = Utilities.hash(record['object'][secretField]) if record['object'][secretField]

		return record
	
	handleNode: (node, container) ->
		# Get parent container.
		parent = $(node).closest(@containers[container])
		
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
		records = []
		for pattern in @patterns[container]
			record = {}
			
			# Assemble pattern for call.
			args =
				structure: pattern
			
			# Try to apply pattern.
			result = $(parent).applyPattern(args)
			
			if result['success']
				# Successful? Sanitize and return record.
				record['object'] = result['data'][0]

				# Set object container type.
				record['object']['type'] = container
				
				# Set interaction type (like, unlike, unknown).
				record['type'] = interactionType
				
				records.push(record)

		# Nothing found? Return failure.
		if records.length == 0
			return {
				'found': false
			}

		# Prepare entry.
		entry = {
			'found': true,
			'record': null
		}

		# Compare results.
		max = 0
		for record in records
			count = 0
			for key, value of record
				if value != ""
					count = count + 1
			if count > max
				max = count
				entry['record'] = @sanitize(record)

		return entry
	
	getObserverType: ->
		"pattern"