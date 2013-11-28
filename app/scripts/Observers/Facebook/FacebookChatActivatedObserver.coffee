class window.FacebookChatActivatedObserver
	getIntegrationPatterns: ->
		["li.fbChatGoOnlineItem a"]

	getEventType: ->
		"click"

	getID: (obj) ->
		# No token necessary.
		""

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'type': "chatactivated"
		}
	
	getObserverType: ->
		"classic"