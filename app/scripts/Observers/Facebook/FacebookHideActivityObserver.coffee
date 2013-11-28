class window.FacebookHideActivityObserver
	getIntegrationPatterns: ->
		["a[ajaxify*=uninteresting]"]

	getEventType: ->
		"click"

	getData: (obj) ->
		# TODO: Add more information.
		
		# Get Facebook like observer.
		likeObserver = new FacebookLikeObserver()

		# Get meta data from like observer.
		likeMeta = likeObserver.getMetaData(obj)

		# Return meta data.
		return {
			'type': "hideactivity",
			'object_owner':     likeMeta['object_owner'],
			'object_type':      likeMeta['object_type']
		}
	
	getObserverType: ->
		"classic"