require 'DOM'
require 'Utilities'

class window.FacebookLikeObserver
	patterns: [
		'<div role="article"><h5><div><a>{author}</a></div></h5><h5><span><div><span>{content}</span></div></span></h5><form><span><span><a class="share_action_link"></a></span></span></form></div>'
	]
	
	getEventType: ->
		"click"
	
	getIntegrationPatterns: ->
		[".UFILikeLink", ".UFICommentActions > a", ".UFILikeThumb"]
	
	sanitize: (record) ->
		return record
	
	handleNode: (node) ->
		# Get parent container.
		parent = $(node).closest('.storyInnerContent')
		
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