class window.FacebookUnfriendObserver
	getIntegrationPatterns: ->
		["input[name*=remove]"]

	getEventType: ->
		"click"

	getID: (obj) ->
		# Stub.
		""

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'interaction_type': "unfriend"
		}
	
	getObserverType: ->
		"classic"