class window.FacebookDeleteStatusObserver
	getIntegrationPatterns: ->
		["a[ajaxify*=remove_content]"]

	getEventType: ->
		"click"

	getID: (obj) ->
		# Get Facebook like observer.
		likeObserver = new FacebookLikeObserver()

		# Use ID of like observer.
		likeObserver.getID(obj)

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'interaction_type': "deletestatus"
		}