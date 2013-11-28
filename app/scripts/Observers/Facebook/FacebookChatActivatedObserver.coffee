class window.FacebookChatActivatedObserver
	getIntegrationPatterns: ->
		["li.fbChatGoOnlineItem a"]

	getEventType: ->
		"click"

	getData: (obj) ->
		return {
			'type': "chatactivated"
		}
	
	getObserverType: ->
		"classic"