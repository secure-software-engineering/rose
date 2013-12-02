class window.FacebookHideActivityObserver
	getIntegrationPatterns: ->
		['a[ajaxify*="customize_action=2"]']

	getEventType: ->
		"click"

	getData: (obj) ->
		# Return meta data.
		return {
			'type': "hideactivity"
		}
	
	getObserverType: ->
		"classic"