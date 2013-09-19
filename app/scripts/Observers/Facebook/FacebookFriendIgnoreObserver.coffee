class window.FacebookFriendIgnoreObserver
	getIntegrationPatterns: ->
		[".uiButton input[name*=reject]"]

	getEventType: ->
		"click"

	getID: (obj) ->
		Utilities.stripTags DOM.findRelative(obj, '.clearfix': '.title a')

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'interaction_type': "friendignored"
		}
	
	getObserverType: ->
		"classic"