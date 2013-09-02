class window.FacebookHideActivityObserver
	getIntegrationPatterns: ->
		["a[ajaxify*=uninteresting]"]

	getEventType: ->
		"click"

	getID: (obj) ->
		# Get Facebook like observer.
		likeObserver = new FacebookLikeObserver()

		# Use ID of like observer.
		likeObserver.getID(obj)

	getMetaData: (obj) ->
		# Get Facebook like observer.
		likeObserver = new FacebookLikeObserver()

		# Get meta data from like observer.
		likeMeta = likeObserver.getMetaData(obj)

		# Return meta data.
		return {
			'interaction_type': "hideactivity",
			'object_owner':     likeMeta['object_owner'],
			'object_type':      likeMeta['object_type']
		}