class window.FacebookShareObserver
	getIntegrationPatterns: ->
		["form[action*=share] button[type=submit]", "form[action*=share] input[type=submit]"]

	getEventType: ->
		"click"

	getData: (obj) ->
		# Content classes.
		classes = {
			'form': '.UIShareStage_Summary'
		}

		# Get content.
		content = DOM.findRelative(obj, classes)

		# Trim content.
		content = content.substr(0, Constants.getContentLength) if content

		# Get object owner classes.
		objectOwnerClasses = {
			'form': '.UIShareStage_Subtitle'
		}

		# Get object owner.
		objectOwner = DOM.findRelative(obj, objectOwnerClasses)

		# Remove "By ".
		objectOwner = objectOwner.substr(objectOwner.indexOf(" ") + 1)

		# Return meta data.
		return {
			'type': "share",
			'object': {
				'id': Utilities.hash(content),
				'owner': Utilities.hash(objectOwner),
				'type': "status"
			}
		}
	
	getObserverType: ->
		"classic"