class window.FacebookHideActivityObserver
	getIntegrationPatterns: ->
		["a[ajaxify*=uninteresting]"]

	getEventType: ->
		"click"

	getData: (obj) ->
		# TODO: Add more information.
		
		# Get Facebook like observer.
		likeObserver = new FacebookLikeObserver()

		# Get result of like observer.
		result = likeObserver.handleNode(this, "status")

		if not result['found']
			return

		# Return meta data.
		return {
			'type': "hideactivity",
			'object_owner':     likeMeta['object_owner'],
			'object_type':      likeMeta['object_type']
		}
	
	getObserverType: ->
		"classic"