class @FacebookUtilities
	@getUserID: ->
		debugger
		Utilities.hash $("#mainContainer").first("a").value()

	@getStoryType: (obj) ->
		# Story classes.
		storyClasses =
			'.UFIComment': 'comment',
			'div[role=article]': 'status',
			'.photoUfiContainer': 'photo',
			'.timelineUnitContainer': 'status'

		# Find story type.
		for className of storyClasses
			return storyClasses[className] if $(className).find(obj).length > 0

		# Still here? Story type not known.
		return "unknown"