class window.FacebookFriendAcceptObserver
	getIntegrationPatterns: ->
		[".uiButtonConfirm input[name*=accept]"]

	getEventType: ->
		"click"

	getID: (obj) ->
		Utilities.stripTags DOM.findRelative(obj, '.clearfix': '.title a')

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'type': "friendaccepted"
		}
	
	getObserverType: ->
		"classic"