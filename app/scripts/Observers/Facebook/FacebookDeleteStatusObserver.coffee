class window.FacebookDeleteStatusObserver
	getIntegrationPatterns: ->
		['a[ajaxify*="take_action_on_story"]']

	getEventType: ->
		"click"

	getData: (obj) ->
		# Return meta data.
		return {
			'type': "deletestatus"
		}
	
	getObserverType: ->
		"classic"