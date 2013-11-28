class window.FacebookFriendAddObserver
	getIntegrationPatterns: ->
		[".FriendRequestAdd input[type=button]"]

	getEventType: ->
		"click"

	getID: (obj) ->
		Utilities.stripTags DOM.findRelative(obj, '.friendBrowserListUnit': '.title a')

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'type': "friendadded"
		}
	
	getObserverType: ->
		"classic"