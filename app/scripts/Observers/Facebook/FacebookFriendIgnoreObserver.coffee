class window.FacebookFriendIgnoreObserver
	getIntegrationPatterns: ->
		[".uiButton input[name*=reject]"]

	getEventType: ->
		"click"

	getData: (obj) ->
		# Get name of friend.
		friend = Utilities.stripTags(DOM.findRelative(obj, '.clearfix': '.title a'))
		friend = Utilities.hash(friend)
		
		return {
			'friend': friend,
			'type': "friendignored"
		}
	
	getObserverType: ->
		"classic"