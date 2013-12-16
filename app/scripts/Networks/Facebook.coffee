###
ROSE is a browser extension researchers can use to capture in situ
data on how users actually use the online social network Facebook.
Copyright (C) 2013

    Fraunhofer Institute for Secure Information Technology
    Andreas Poller <andreas.poller@sit.fraunhofer.de>

Authors

    Oliver Hoffmann <oliverh855@gmail.com>
    Sebastian Ruhleder <sebastian.ruhleder@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
###

require 'Network'
require 'Observers/**/*'

class @Facebook extends Network
    # Network name.
    network:   "Facebook"

    # List of observers.
    observers: []

    constructor: ->
        # Add observers.
        @observers.push new FacebookLikeObserver()
        @observers.push new FacebookPageLikeObserver()
        @observers.push new FacebookPageUnlikeObserver()
        @observers.push new FacebookShareObserver()
        @observers.push new FacebookUpdateStatusObserver()
        @observers.push new FacebookUpdateStatusPictureObserver()
        @observers.push new FacebookFriendAcceptObserver()
        @observers.push new FacebookFriendIgnoreObserver()
        @observers.push new FacebookFriendAddObserver()
        @observers.push new FacebookUnfriendObserver()
        @observers.push new FacebookDeleteStatusObserver()
        @observers.push new FacebookDeleteCommentObserver()
        @observers.push new FacebookChatTurnedOffObserver()
        @observers.push new FacebookChatActivatedObserver()
        @observers.push new FacebookHideActivityObserver()

    isOnNetwork: ->
        (window.location + "").indexOf("facebook.com") >= 0

    integrateIntoDOM: ->
        # Comment Status Observer.
        @integrateCommentStatusObserver()

        # Chat Submit Button Observer.
        @integrateChatSubmitButtonObserver()

        # Chat Textarea Observer.
        @integrateChatTextareaObserver()

        # General Message Observer.
        @integrateGeneralMessageObserver()

    integrateCommentStatusObserver: ->
        # Get network name.
        name = @getNetworkName()

        # Set identifier.
        identifier = "textarea.UFIAddCommentInput"

        # Find all elements.
        $(identifier).each ->
            # Skip if already integrated.
            return if $(this).hasClass("rose-integrated")

            # Add integration class.
            $(this).addClass("rose-integrated")

            # Add event handler.
            $(this).on "keydown", (e) ->
                if e.which is 13 or e.keyCode is 13
                    # Get comment text.
                    content = $(this).val()

                    # Get container.
                    container = "status"
                    if $(this).parents(".timelineUnitContainer").length
                        container = "timeline"

                    # Get Facebook like observer.
                    likeObserver = new FacebookLikeObserver()

                    # Get result of like observer.
                    result = likeObserver.handleNode(this, container)

                    if not result['found']
                        return

                    # Create interaction.
                    interaction =
                        'type': 'commentstatus'
                        'target': result['record']['object']
                        'object':
                            'type': "comment"
                            'owner': FacebookUtilities.getUserID()
                            'id': Utilities.hash(content)

                    # Save interaction.
                    Storage.addInteraction(interaction, name)

    integrateChatTextareaObserver: ->
        # Get network name.
        name = @getNetworkName()

        # Set identifier.
        identifier = ".fbDockChatTabFlyout textarea, #pagelet_web_messenger textarea"

        # Find all elements.
        $(identifier).each ->
            # Skip if already integrated.
            return if $(this).hasClass("rose-integrated")

            # Add integration class.
            $(this).addClass("rose-integrated")

            # Add event handler.
            $(this).on "keydown", (e) ->
                # Get parent container.
                parent = ""
                if $(this).parents(".fbDockChatTabFlyout").length
                    parent = "sidechat"
                if $(this).parents("#pagelet_web_messenger").length
                    parent = "mainchat"

                if parent is "sidechat" and e.keyCode is 13
                    # Get recipient.
                    recipient = $(this).closest(".fbDockChatTabFlyout").find('h4.titlebarTextWrapper a').html()

                    # Create interaction.
                    interaction =
                        'type': 'chat'
                        'object':
                            'type': 'message'
                            'recipient': Utilities.hash(recipient)

                    # Save interaction.
                    Storage.addInteraction(interaction, name)
                if parent is "mainchat"
                    # Get "Press Enter to send" checkbox
                    checkbox = $(this).closest("#pagelet_web_messenger").find("a[role=checkbox]")

                    if checkbox.attr("aria-checked") is "false"
                        # Chat Submit Button observer handles this chat message, so...
                        return
                    else
                        if e.keyCode is 13
                            # Get recipient.
                            recipient = $(this).closest("#pagelet_web_messenger").find('h2#webMessengerHeaderName a').html()

                            # Create interaction.
                            interaction =
                                'type': 'chat'
                                'object':
                                    'type': 'message'
                                    'recipient': Utilities.hash(recipient)

                            # Save interaction.
                            Storage.addInteraction(interaction, name)

    integrateChatSubmitButtonObserver: ->
        # Get network name.
        name = @getNetworkName()

        # Set identifier.
        identifier = "#pagelet_web_messenger .uiButtonConfirm input"

        # Find all elements.
        $(identifier).each ->
            # Skip if already integrated.
            return if $(this).hasClass("rose-integrated")

            # Add integration class.
            $(this).addClass("rose-integrated")

            # Add event handler.
            $(this).on "click", (e) ->
                # Get recipient.
                recipient = $(this).closest("#pagelet_web_messenger").find('h2#webMessengerHeaderName a').html()

                # Create interaction.
                interaction =
                    'type': 'chat'
                    'object':
                        'type': 'message'
                        'recipient': Utilities.hash(recipient)

                # Save interaction.
                Storage.addInteraction(interaction, name)

    integrateGeneralMessageObserver: ->
        # Get network name.
        name = @getNetworkName()

        # Set identifier.
        identifier = "div[role=dialog] button.layerConfirm"

        # Find all elements.
        $(identifier).each ->
            # Skip if already integrated.
            return if $(this).hasClass("rose-integrated")

            # Add integration class.
            $(this).addClass("rose-integrated")

            # Add event handler.
            $(this).on "click", (e) ->
                # Get recipient.
                recipient = $(this).closest("div[role=dialog]").find('span.uiToken').html()

                # If no recipient is found then it is not a message
                return unless recipient?

                recipient = Utilities.stripTags(recipient)

                # Create interaction.
                interaction =
                    'type': 'chat'
                    'object':
                        'type': 'message'
                        'recipient': Utilities.hash(recipient)

                # Save interaction.
                Storage.addInteraction(interaction, name)

    getNetworkName: ->
        @network
