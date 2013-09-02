require 'DOM'
require 'Utilities'

class window.FacebookLikeObserver
	getIntegrationPatterns: ->
		[".UFILikeLink", ".UFICommentActions > a", ".UFILikeThumb"]

	getEventType: ->
		"click"

	getID: (obj) ->
		# Content classes.
		classes = {
			".UFIComment":            ".UFICommentBody",
			".photoUfiContainer":     ".hasCaption",
			".uiStreamStory":         ".userContent",
			".storyContent":          ".userContent",
			".article":               ".shareSubtext",
			".timelineUnitContainer": ".userContent"
		};

		# Get content.
		content = DOM.findRelative(obj, classes)

		# Strip if possible.
		content = Utilities.stripTags(content) if Utilities.stripTags(content)

		# On error, search for other possible IDs.
		if content == "error"
			# Check for attachements.
			attachments  = obj.closest("div[role=article]").find(".uiStreamAttachments")
			content      = attachments.find("img").attr("src") if attachments.length > 0

			# Check for snowlift container.
			snowliftContainerImage = obj.closest(".fbPhotoSnowliftContainer").find(".spotlight")
			content                = snowliftContainerImage.attr("src") if snowliftContainerImage.length > 0

			# Check for photo container.
			photoContainerImage = obj.closest(".fbxPhoto").find(".fbPhotoImage")
			content             = photoContainerImage.attr("src") if photoContainerImage.length > 0
		else
			# Trim content.
			content = content.substr(0, Constants.getContentLength())

		# Return content.
		return content

	getMetaData: (obj) ->
		# Interaction types (like, unlike).
		interactionTypes = {
			# English
			'like':   'like',
			'unlike': 'unlike',
			# German
			'gefällt mir':            'like',
			'gefällt mir nicht mehr': 'unlike'
		}

		# Get field content.
		fieldContent = Utilities.stripTags(obj.html()).toLowerCase()

		# Set interaction type (like, unlike, unknown).
		interactionType = interactionTypes[fieldContent]
		interactionType = "unknown/like/unlike" unless interactionType

		# Object owner classes.
		objectOwnerClasses = {
			'.UFIComment':                        'a.UFICommentActorName',
			'div[role=article]':                  '.actorName a',
			'.photoUfiContainer':                 '.fbPhotoContributorName a',
			'div[role=article] .uiStreamMessage': 'a:nth-child(2)',
			'.timelineUnitContainer':             '.fwb',
			'.storyContent':                      '.passiveName'
		}

		# Get object owner.
		objectOwner = Utilities.stripTags DOM.findRelative(obj, objectOwnerClasses)

		# Set location to unknown.
		location = "unknown"

		# Get user names from page.
		currentProfileName = $("#fbProfileCover ._8_2").html()
		currentUserName    = $(".headerTinymanName").html()

		# Find possible locations.
		timelineCapsule = obj.closest('.fbTimelineCapsule')
		contentArea     = obj.closest('#contentArea')

		# Set location based on results.
		location  = "profile"  if timelineCapsule.length > 0
		location += "self"     if currentProfileName == currentUserName
		location  = "newsfeed" if contentArea.length > 0

		# Get story type.
		storyType = FacebookUtilities.getStoryType(obj)

		# Return meta data.
		return {
			"interaction_type": interactionType,
			"object_owner":     Utilities.hash(objectOwner),
			"object_type":      storyType,
			"location":         location
		}