require 'Observer'

class window.GooglePlusPlusOneObserver extends Observer
	getIntegrationPatterns: ->
		['div[guidedhelpid="actionblock"] div:first', 'button.esw']

	getEventType: ->
		"click"

	getID: (obj) ->
		""

	getMetaData: (obj) ->
		return {
			"interaction_type": "+1"
		}