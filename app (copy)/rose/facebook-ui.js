/*
Copyright (C) 2013-2015
    Oliver Hoffmann <oliverh855@gmail.com>
    Sebastian Ruhleder <sebastian.ruhleder@gmail.com>
    Felix Epp <work@felixepp.de>

This file is part of ROSE.

ROSE is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ROSE is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ROSE.  If not, see <http://www.gnu.org/licenses/>.
 */

import $ from 'jquery'
import _forEach from 'lodash/forEach'
// FIXIT: https://github.com/wycats/handlebars.js/issues/1102
import Handlebars from 'handlebars/dist/handlebars'
import i18n from 'i18next'

import SystemConfigModel from './models/system-config'
import UserSettingsModel from './models/user-settings'
import CommentsCollection from './collections/comments'
import ExtractorEngine from './extractor-engine'
import ExtractorCollection from './collections/extractors'
import log from './log'

var loadCss = function loadCss (link) {
    var cssLink
    cssLink = $('<link>')
    $('head').append(cssLink)
    return cssLink.attr({
        rel: 'stylesheet',
        type: 'text/css',
        href: kango.io.getResourceUrl(link)
    })
}

export default (function () {
    FacebookUI.prototype._activeComment = {}
    FacebookUI.prototype._comments = new CommentsCollection()
    FacebookUI.prototype._configs = new SystemConfigModel()
    FacebookUI.prototype._settings = new UserSettingsModel()
    FacebookUI.prototype._statusUpdateExtractor = {}
    FacebookUI.prototype._templates = []

    function FacebookUI () {
        this._configs.fetch()
        this._settings.fetch()
        this._comments.fetch()
        var extractorsCol = new ExtractorCollection()
        extractorsCol.fetch({success: function extractorsLoaded (col) {
            this._statusUpdateExtractor = col.findWhere({name: 'status-update'})
        }.bind(this)})

        // load styles
        loadCss('res/semantic/semantic.min.css')
        loadCss('res/main.css')

        // Init internationlization
        var options
        options = {
            debug: true, // remove on production
            fallbackLng: 'en',
            load: 'unspecific'
        }

        var isLanguageSet = this._settings.get('currentLanguage') !== null || this._settings.get('currentLanguage') !== undefined
        var isLanguageNotAutoDetect = this._settings.get('currentLanguage') !== 'auto'
        if (isLanguageSet && isLanguageNotAutoDetect) {
            options.lng = this._settings.get('currentLanguage')
        } else {
            options.lng = options.fallbackLng
        }

        var loadTranslation = new Promise(function (resolve) {
            var details, resource
            resource = 'res/locales/' + options.lng + '/translation.json'
            details = {
                url: resource,
                method: 'GET',
                async: false,
                contentType: 'text'
            }
            kango.xhr.send(details, function (data) {
                resolve(data.response)
            })
        })

        loadTranslation.then(function (data) {
            options.resStore = {}
            options.resStore[options.lng] = {translation: JSON.parse(data)}
            i18n.init(options)

            Handlebars.registerHelper('I18n', function (i18nKey) {
                var translation = i18n.t(i18nKey)
                return new Handlebars.SafeString(translation)
            })

            // Search for the container which is streamed with content
            // than attach ui and event + MutationObserver
            this.injectUI()
            var globalContainer = $('#globalContainer')[0]

            // create MutationObserver to inject elements when new content is loaded into DOM
            var MutationObserver = window.MutationObserver || window.WebKitMutationObserver
            var observer = new MutationObserver(this.redrawUI.bind(this))
            observer.observe(globalContainer, {
                childList: true,
                subtree: true
            })
        }.bind(this))
    }

    FacebookUI.prototype.injectUI = function () {
        this._registerEventHandlers()
        this._injectCommentRibbon()
        this._injectReminder()
        this._injectSidebar()
    }

    FacebookUI.prototype.redrawUI = function () {
        if ($('#stream_pagelet, #pagelet_timeline_recent, #pagelet_timeline_main_column, #pagelet_group_').length) {
            this._injectCommentRibbon()
            $('.ui.sidebar').sidebar()
            $('.ui.radio.checkbox').checkbox()
        }
    }

    FacebookUI.prototype._injectSidebar = function () {
        if ($('.ui.sidebar').length > 0) {
            return
        }
        return this._getTemplate('sidebar').then(function (source) {
            return Handlebars.compile(source)
        }).then(function (template) {
            $('body > div').wrapAll('<div class="pusher" />')

            var tpl
            try {
                tpl = template()
            } catch (e) {
                log('facebook-ui', e)
            }
            $('body').prepend(tpl)
            $('.ui.sidebar').sidebar()
            $('.ui.radio.checkbox').checkbox()
            if (this._configs.get('roseCommentsRatingIsEnabled')) {
                $('.ui.rating').rating()
                $('.ui.rating').prepend('<div class="ui mini horizontal label">(low)</div>').append('<div class="ui mini horizontal label">(high)</div>')
            } else {
                $('.ui.rating').remove()
            }
        }.bind(this))
    }

    FacebookUI.prototype._injectCommentRibbon = function () {
        this._getTemplate('commentLabel').then(function (source) {
            return Handlebars.compile(source)
        }).then(function (template) {
            $('.userContentWrapper')
        .not('.rose.comment + .userContentWrapper')
        .not($('.userContentWrapper')
          .has('div > .userContentWrapper'))
        .has('span > a > abbr > span')
        .before(template())
        })
    }

    FacebookUI.prototype._injectReminder = function () {
        if ($('.ui.nag').length === 0 && this._settings.get('commentReminderIsEnabled')) {
            this._getTemplate('reminder').then(function (source) {
                return Handlebars.compile(source)
            }).then(function (template) {
                $('body').append(template())
                $('.ui.nag').nag({ expires: 1 })
            })
        }
    }

    FacebookUI.prototype._getTemplate = function (template) {
        var promise
        var cachedTemplates = this._templates
        promise = new Promise(function (resolve) {
            if (cachedTemplates[template] !== undefined) {
                return resolve(cachedTemplates[template])
            } else {
                var details, resource
                resource = 'res/templates/' + template + '.hbs'
                details = {
                    url: resource,
                    method: 'GET',
                    async: false,
                    contentType: 'text'
                }
                return kango.xhr.send(details, function (data) {
                    cachedTemplates[template] = data.response
                    return resolve(data.response)
                })
            }
        })
        return promise
    }

    FacebookUI.prototype._registerEventHandlers = function () {
        // Start commenting
        $('body').on('click', '.rose.comment', function (evt) {
            // Receive id for content element
            var $container = $(evt.currentTarget).siblings('.userContentWrapper')
            var extractorResult = ExtractorEngine.extractFieldsFromContainer($container, this._statusUpdateExtractor, this._configs)

            if (extractorResult.contentId === undefined) {
                log('facebook-ui', 'Error: Could not obtain contentId!')
                return
            }

            // Show sidebar
            $('.ui.sidebar').sidebar('push page')
            $('.ui.sidebar').sidebar('show')

            // Check if comment for this content exists and set form
            this._activeComment = undefined
            this._comments.fetch({success: function onCommentsFetched () {
                this._activeComment = this._comments.findWhere({contentId: extractorResult.contentId})
                if (this._activeComment !== undefined) {
                    var activeComment = this._activeComment.toJSON()
                    if (activeComment.text !== undefined) {
                        _forEach(activeComment.text, (text, i) => $('.sidebar textarea:eq(' + i + ')').val(text))
                    } else {
                        $('.sidebar textarea').val('')
                    }

                    if (this._configs.get('roseCommentsRatingIsEnabled')) {
                        if (activeComment.rating !== undefined) {
                            _forEach(activeComment.rating, (rating, i) => $('.ui.rating:eq(' + i + ')').rating('set rating', rating))
                        } else {
                            $('.ui.rating').rating('set rating', 0)
                        }
                    }

                    $('.ui.checkbox').checkbox('uncheck')
                    if (activeComment.checkbox !== undefined) {
                        _forEach(activeComment.checkbox, (checkbox, i) => {
                            if (checkbox) $('.ui.checkbox:eq(' + i + ')').checkbox('check')
                        })
                    }
                } else {
                    let comment = {createdAt: (new Date()).toJSON(), type: 'post', network: 'facebook'}
                    comment.contentId = extractorResult.contentId
                    if (extractorResult.sharerId !== undefined) {
                        comment.sharerId = extractorResult.sharerId
                    }
                    this._activeComment = this._comments.create(comment)
                    $('.sidebar textarea').val('')
                    $('.ui.checkbox').checkbox('uncheck')
                    if (this._configs.get('roseCommentsRatingIsEnabled')) {
                        $('.ui.rating').rating('set rating', 0)
                    }
                }
            }.bind(this)})
        }.bind(this))

        // Save a comment
        $('body').on('click', '.sidebar .save.button', function () {
            var comment = {}
            comment.text = []
            $('.sidebar textarea').each(function getVals (i) {
                comment.text[i] = $(this).val()
            })
            if (this._configs.get('roseCommentsRatingIsEnabled')) {
                comment.rating = $('.ui.rating').rating('get rating') || []
            }
            comment.checkbox = $('.ui.checkbox').checkbox('is checked')
            comment.updatedAt = (new Date()).toJSON()
            this._activeComment.set(comment)
            this._activeComment.save()
            $('.ui.sidebar').sidebar('hide')
            $('.ui.sidebar.uncover').sidebar('hide')
        }.bind(this))
    }

    return FacebookUI
})()
