class window.FacebookPageLikeObserver
	getIntegrationPatterns: ->
		[".PageLikeButton input[type=submit]"]

	getEventType: ->
		"click"

	getID: (obj) ->
		$("#fbProfileCover").find("span[itemprop=name]").html()

	getMetaData: (obj) ->
		return {
			'interaction_type': 'pagelike'
		}