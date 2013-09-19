class window.FacebookChatActivatedObserver
	getIntegrationPatterns: ->
		["#fbDockChat a.fbNubButton"]

	getEventType: ->
		"click"

	getID: (obj) ->
		# No token necessary.
		""

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'interaction_type': "chatactivated"
		}
	
	getObserverType: ->
		"classic"