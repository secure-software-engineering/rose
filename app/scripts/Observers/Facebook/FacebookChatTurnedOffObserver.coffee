class window.FacebookChatTurnedOffObserver
	getIntegrationPatterns: ->
		["li.fbChatGoOfflineItem a"]

	getEventType: ->
		"click"

	getID: (obj) ->
		# No token necessary.
		""

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'interaction_type': "chatturnoff"
		}
	
	getObserverType: ->
		"classic"