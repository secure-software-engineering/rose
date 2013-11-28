class window.FacebookUpdateStatusObserver
	getIntegrationPatterns: ->
		["form[action*=updatestatus] button[type=submit]", "form[action*=updatestatus] input[type=submit]"]

	getEventType: ->
		"click"

	getData: (obj) ->
		# Privacy types.
		privacyTypes = {
			# German
			'benutzerdefiniert': 'custom',
			'nur ich':           'only me',
			'freunde':           'friends',
			'öffentlich':        'public',
			# English
			'custom':  'custom',
			'only me': 'only me',
			'friends': 'friends',
			'public':  'public'
		}

		# Get privacy.
		privacy = DOM.findRelative(obj, "form": ".uiSelectorButton span").toLowerCase()

		# Consider language.
		privacy = privacyTypes[privacy]
		privacy = "privacyunknown" if privacy == null

		# Get ID.
		id = obj.closest("form[action*=updatestatus]").find("input[name=xhpc_message]").attr("value")
		id = Utilities.hash(id)

		# Return meta data.
		return {
			'type': "updatestatus",
			'scope': privacy,
			'object': {
				'type': "status",
				'id': id
			}
		}
	
	getObserverType: ->
		"classic"