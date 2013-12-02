class window.FacebookShareObserver
	pattern: [
		'<div class="UIShareStage"><div class="UIShareStage_ShareContent"><div class="UIShareStage_Subtitle">{owner}</div><div class="UIShareStage_Summary">{id}</div></div></div>'
	]

	getIntegrationPatterns: ->
		["form[action*=share] button[type=submit]", "form[action*=share] input[type=submit]"]

	getEventType: ->
		"click"

	sanitize: (record) ->
		# Remove "By " from author of shared post.
		owner = record['object']['owner']
		if owner
			owner = owner.substr(owner.indexOf(' ') + 1)
		record['object']['owner'] = owner

		for secretField in ["owner", "id"]
			record['object'][secretField] = Utilities.hash(record['object'][secretField]) if record['object'][secretField]

		return record

	handleNode: (node, container) ->
		# Get parent container.
		parent = $(node).closest('div[role=dialog]')

		record = null
		
		# Assemble pattern for call.
		args =
			structure: @pattern
		
		# Try to apply pattern.
		result = $(parent).applyPattern(args)
		
		if result['success']
			record = {}

			# Successful? Sanitize and return record.
			record['object'] = result['data'][0]
			
			# Set interaction type.
			record['type'] = "share"

		# Nothing found? Return failure.
		if record == null
			return {
				'found': false
			}

		# Prepare entry.
		entry = {
			'found': true,
			'record': @sanitize(record)
		}

		return entry
	
	getObserverType: ->
		"pattern"