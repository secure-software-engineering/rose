class window.FacebookUpdateStatusPictureObserver
	getIntegrationPatterns: ->
		["form[action*=photos] button[type=submit]", "form[action*=photos] input[type=submit]"]

	getEventType: ->
		"click"

	getData: (obj) ->
		# Generate ID.
		id = Utilities.hash(obj.closest("form[action*=photos]").find("textarea.mentionsTextarea").val())

		return {
			'type': "updatestatuspicture",
			'object': {
				'type': "status",
				'id': id
			}
		}
	
	getObserverType: ->
		"classic"