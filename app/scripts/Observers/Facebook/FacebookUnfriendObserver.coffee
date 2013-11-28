class window.FacebookUnfriendObserver
	getIntegrationPatterns: ->
		["li.FriendListUnfriend a"]

	getEventType: ->
		"click"

	getData: (obj) ->
		return {
			'type': "unfriend"
		}
	
	getObserverType: ->
		"classic"