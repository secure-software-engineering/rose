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
	
	handleNode: (node) ->
		result = $($(node).closest('.storyInnerContent')).applyPattern({
			structure: @patterns[0],
			events: {}
		})
		
		console.log(result['success'] + " - " + JSON.stringify(result['data']));
	
	getObserverType: ->
		"pattern"