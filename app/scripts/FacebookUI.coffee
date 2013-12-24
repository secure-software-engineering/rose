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

require 'Observers/Facebook/FacebookLikeObserver'
require 'Storage/Storage'
require 'Utilities'

class @FacebookUI
    _activeItem: {}
    _likeObserver: new FacebookLikeObserver()

    constructor: () ->
        # register handlebars helper
        Handlebars.registerHelper 'I18n', (i18nKey) ->
            result = i18n.t(i18nKey)
            return new Handlebars.SafeString result

        options =
            getAsync: false
            fallbackLng: 'en'
            resGetPath: kango.io.getResourceUrl 'res/locales/__lng__/__ns__.json'

        # init i18next module
        i18n.init options

        # inject css into DOM
        Utilities.loadCss 'res/semantic/build/packaged/css/semantic.css'
        Utilities.loadCss 'res/main.css'

        @_registerEventHandlers()
        @_injectCommentRibbon()
        @_injectReminder()
        @_injectSidebar()

    injectUI: () ->

    redrawUI: () ->
        @_injectCommentRibbon()

    _injectSidebar: () ->
        return if $('.ui.sidebar').length > 0

        @_getTempalte('sidebar')
        .then((source) ->
            template = Handlebars.compile source
        )
        .then((template) ->
            $('body').append template()
            $('.ui.sidebar').sidebar()
            $('.ui.rating').rating()
        )

    _injectCommentRibbon: () ->
        @_getTempalte('commentLabel')
        .then((source) ->
            template = Handlebars.compile source
        )
        .then((template) ->
            if $('.fbxWelcomeBoxName').length > 0
                $("*[data-timestamp]").not($('*[data-timestamp] .rose.comment').parent()).prepend template()
            else
                $(".timelineUnitContainer").has(".fbTimelineFeedbackActions").not($(".timelineUnitContainer .rose.comment").parent()).prepend(template()).addClass('timeline')
                $('.rose.comment').addClass('timeline')
        )

    _injectReminder: () ->
        return if $('.ui.nag').length > 0

        @_getTempalte('reminder')
        .then((source) ->
            template = Handlebars.compile source
        )
        .then((template) ->
            $('body').append template()
            $('#rose-reminder').nag
                easing: 'swing'
        )

    _getComment: (id) ->
        promise = new RSVP.Promise (resolve, reject) ->
            Storage.getComment id, 'Facebook', resolve

        return promise


    _getTempalte: (template) ->
        promise = new RSVP.Promise (resolve, reject) ->
            resource = kango.io.getResourceUrl '/res/templates/' + template + '.hbs'
            $.get resource, (source) ->
                resolve source

        return promise

    _getSettings: () ->

    _registerEventHandlers: () ->

        $('body').on 'click', '.sidebar .cancel.button', () ->
            $('.ui.sidebar').sidebar 'hide'

        $('body').on 'click', '.sidebar .save.button', () =>
            $('.ui.sidebar').sidebar 'hide'

            @_activeItem.text = $('.sidebar textarea').val() or ''
            @_activeItem.rating = $('.ui.rating').rating('get rating') or 0

            Storage.addComment @_activeItem, 'Facebook'

        $('body').on 'click', '.rose.comment', (evt) =>
            if $('.fbxWelcomeBoxName').length > 0
                item = @_likeObserver.handleNode $(evt.target).siblings(), 'status'
            else
                item = @_likeObserver.handleNode $(evt.target), 'timeline'

            @_activeItem = item.record.object

            @_getComment(@_activeItem.id)
            .then((comment) ->
                if comment?
                    activeComment = comment.record
                    $('.ui.form textarea').val(activeComment.text)
                    for rating, i in activeComment.rating
                        $('.ui.rating:eq(' + i + ')').rating 'set rating', rating
                else
                    $('.ui.form textarea').val ''
                    $('.ui.rating').rating 'set rating', 0
            )
            .then(() ->
                $('.ui.sidebar').sidebar 'push page'
                $('.ui.sidebar').sidebar 'show'
            )
