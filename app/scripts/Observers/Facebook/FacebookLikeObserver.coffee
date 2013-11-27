require 'DOM'
require 'Utilities'

class window.FacebookLikeObserver
	patterns: [
		'<div><h5><div><a>{author}</a></div></h5><div class="userContent">{content}</div><form></form></div>'
	]
	
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
		parent = $(node).closest('.userContentWrapper')
		
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