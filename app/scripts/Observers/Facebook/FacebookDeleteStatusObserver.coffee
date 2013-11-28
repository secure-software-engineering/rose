class window.FacebookDeleteStatusObserver
	getIntegrationPatterns: ->
		["a[ajaxify*=remove_content]"]

	getEventType: ->
		"click"

	getID: (obj) ->
		# Instantiate Facebook like observer.
		likeObserver = new FacebookLikeObserver()

		# Handle node in like observer.
		interaction = likeObserver.handleNode(obj, "status")

		# No ID found?
		return ""

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'type': "deletestatus"
		}
	
	getObserverType: ->
		"classic"