class window.FacebookFriendAddObserver
	getIntegrationPatterns: ->
		[".FriendRequestAdd input[type=button]"]

	getEventType: ->
		"click"

	getData: (obj) ->
		# Get name of friend.
		friend = Utilities.stripTags(DOM.findRelative(obj, '.friendBrowserListUnit': '.title a'))
		friend = Utilities.hash(friend)
		
		return {
			'friend': friend,
			'type': "friendadded"
		}
	
	getObserverType: ->
		"classic"