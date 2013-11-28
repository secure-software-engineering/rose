class window.FacebookFriendAcceptObserver
	getIntegrationPatterns: ->
		[".uiButtonConfirm input[name*=accept]"]

	getEventType: ->
		"click"

	getData: (obj) ->
		# Get name of friend.
		friend = Utilities.stripTags(DOM.findRelative(obj, '.clearfix': '.title a'))
		friend = Utilities.hash(friend)
		
		return {
			'friend': friend,
			'type': "friendaccepted"
		}
	
	getObserverType: ->
		"classic"