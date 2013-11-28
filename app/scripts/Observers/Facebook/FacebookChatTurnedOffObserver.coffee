class window.FacebookChatTurnedOffObserver
	getIntegrationPatterns: ->
		["li.fbChatGoOfflineItem a"]

	getEventType: ->
		"click"

	getData: (obj) ->
		return {
			'type': "chatturnoff"
		}
	
	getObserverType: ->
		"classic"