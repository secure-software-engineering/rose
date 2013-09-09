class @RoseData
	platforms: []

	diary: []

	@createFromObject: (object) ->

	addPlatform: (name) ->
		platform =
			name: name
			interactions: []
			comments: []
		@platforms.push platform

	getPlatformNames: () ->
		platform['name'] for platform in @platforms

	addInteraction: (record, platform) ->
		index = @getInteractions(platform).length + 1
		interaction =
			index: index
			deleted: false
			record: record
		@getInteractions(platform).push interaction

	getInteraction: (index, platform) ->
		for interaction in @getInteractions(platform)
			return interaction if interaction['index'] == index
		return null

	getInteractions: (platform) ->
		return @platforms[platform]['interactions']

	removeInteraction: (index, platform) ->
		for interaction in @getInteractions(platform)
			if interaction['index'] == index
				interaction['deleted'] = true
				interaction['record'] = null

	addComment: (text, platform) ->
		index = @getComments(platform).length + 1
		comment =
			index: index
			text: text
		@getComments(platform).push comment

	getComment: (index, platform) ->
		for comment in @getComments(platform)
			return comment if comment['index'] == index
		return null

	getComments: (platform) ->
		return @platforms[platform]['comments']

	removeComment: (index, platform) ->
		for comment in @getComments(platform)
			if comment['index'] == index
				comment['deleted'] = true
				comment['text'] = null

	addDiaryEntry: (text) ->
		index = @getDiaryEntries().length + 1
		entry =
			index: index
			text: text
		@diary.push entry

	getDiaryEntries: () ->
		return @diary

	serialize: () ->
		platforms: platforms
		diary: diary