require 'DOM'
require 'Utilities'

class window.FacebookLikeObserver
	patterns: [
		'<div role="article" click="[handler]"></div>'
	]
	
	handler: ->
		return (data) ->
			console.log("Found like!")
			return
	
	integrate: ->
		for pattern in @patterns
			console.log("Integrating: " + pattern)
			$("body").applyPattern({
				'structure': pattern,
				'events': {
					'handler': @handler()
				}
			})
	
	getObserverType: ->
		"pattern"