class window.FacebookHideActivityObserver
	getIntegrationPatterns: ->
		["a[ajaxify*=uninteresting]"]

	getEventType: ->
		"click"

	getData: (obj) ->
		# Get Facebook like observer.
		likeObserver = new FacebookLikeObserver()

		# Get result of like observer.
		result = likeObserver.handleNode(this, "status")

		if not result['found']
			return

		# Return meta data.
		return {
			'type': "hideactivity",
			'object': result['record']['object']
		}
	
	getObserverType: ->
		"classic"