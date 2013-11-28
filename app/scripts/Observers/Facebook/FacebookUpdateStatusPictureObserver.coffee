class window.FacebookUpdateStatusPictureObserver
	getIntegrationPatterns: ->
		["form[action*=photos] button[type=submit]", "form[action*=photos] input[type=submit]"]

	getEventType: ->
		"click"

	getID: (obj) ->
		obj.closest("form[action*=photos]").find("textarea.mentionsTextarea").val()

	getMetaData: (obj) ->
		# Return meta data.
		return {
			'type': "updatestatuspicture",
			'object_type':      "status"
		}
	
	getObserverType: ->
		"classic"