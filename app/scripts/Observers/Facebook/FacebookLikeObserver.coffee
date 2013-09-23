require 'DOM'
require 'Utilities'

class window.FacebookLikeObserver
	patterns: [
		'<div role="article"><h5><div><a></a></div></h5><h5><span></span></h5><form><span><span><a class="share_action_link" click="[handler]"></a></span></span></form></div>'
	]
	
	handler: ->
		return (data) ->
			console.log("Found like!")
			return
	
	integrate: ->
		for pattern in @patterns
			$("#contentArea").applyPattern({
				'structure': pattern,
				'events': {
					'handler': @handler()
				}
			})
	
	getObserverType: ->
		"pattern"