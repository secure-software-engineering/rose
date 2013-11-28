class window.FacebookUnfriendObserver
	getIntegrationPatterns: ->
		["li.FriendListUnfriend a"]

	getEventType: ->
		"click"

	getID: (obj) ->
		""

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'interaction_type': "unfriend"
		}
	
	getObserverType: ->
		"classic"