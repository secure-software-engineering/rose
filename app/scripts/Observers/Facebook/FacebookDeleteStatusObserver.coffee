class window.FacebookDeleteStatusObserver
	getIntegrationPatterns: ->
		["a[ajaxify*=remove_content]"]

	getEventType: ->
		"click"

	getData: (obj) ->
		# TODO: Add more information.
		
		return {
			'type': "deletestatus"
		}
	
	getObserverType: ->
		"classic"