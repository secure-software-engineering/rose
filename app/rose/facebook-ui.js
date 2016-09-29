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

import './facebook-ui.css'

import _forEach from 'lodash/forEach'
import Handlebars from 'hbsfy/runtime'
import i18n from 'i18next'
import $ from 'jquery'
import cookie from 'jquery.cookie'
import checkbox from 'semantic-ui-checkbox'
import nag from 'semantic-ui-nag'
import rating from 'semantic-ui-rating'
import sidebar from 'semantic-ui-sidebar'

import SystemConfigModel from './models/system-config'
import UserSettingsModel from './models/user-settings'
import CommentsCollection from './collections/comments'
import ExtractorEngine from './extractor-engine'
import ExtractorCollection from './collections/extractors'
import log from './log'

import templateCommentLabel from '../res/templates/commentLabel.hbs'
import templateReminder from '../res/templates/reminder.hbs'
import templateSidebar from '../res/templates/sidebar.hbs'

import localeEn from '../res/locales/en/translation.json'
import localeDe from '../res/locales/de/translation.json'

$.fn.checkbox = checkbox
$.fn.cookie = cookie
$.fn.nag = nag
$.fn.rating = rating
$.fn.sidebar = sidebar

$.extend($.easing, {
    easeOutQuad: function (x, t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b
    }
})

Handlebars.registerHelper('I18n', function (key) {
    var translation = i18n.t(key)
    return new Handlebars.SafeString(translation)
})

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

        // Init internationlization
        var options
        options = {
            fallbackLng: 'en',
            load: 'unspecific',
            resources: {
                en: { translation: localeEn },
                de: { translation: localeDe }
            }
        }

        var isLanguageSet = this._settings.get('currentLanguage') !== null || this._settings.get('currentLanguage') !== undefined
        var isLanguageNotAutoDetect = this._settings.get('currentLanguage') !== 'auto'
        if (isLanguageSet && isLanguageNotAutoDetect) {
            options.lng = this._settings.get('currentLanguage')
        } else {
            options.lng = options.fallbackLng
        }

        i18n.init(options)

        this.injectUI()
    }

    FacebookUI.prototype.injectUI = function () {
        this._registerEventHandlers()
        this._injectCommentRibbon()
        this._injectReminder()
        this._injectSidebar()

        // create MutationObserver to inject elements when new content is loaded into DOM
        var globalContainer = $('#globalContainer')[0]
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver
        var observer = new MutationObserver(this.redrawUI.bind(this))
        observer.observe(globalContainer, {
            childList: true,
            subtree: true
        })
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
        $('body > div').wrapAll('<div class="pusher" />')

        $('body').prepend(templateSidebar())
        $('.ui.sidebar').sidebar()
        $('.ui.radio.checkbox').checkbox()
        if (this._configs.get('roseCommentsRatingIsEnabled')) {
            $('.ui.rating').rating()
            $('.ui.rating').prepend('<div class="ui mini horizontal label">(low)</div>').append('<div class="ui mini horizontal label">(high)</div>')
        } else {
            $('.ui.rating').remove()
        }
    }

    FacebookUI.prototype._injectCommentRibbon = function () {
        $('.userContentWrapper')
            .not('.rose.comment + .userContentWrapper')
            .not($('.userContentWrapper')
                .has('div > .userContentWrapper'))
            .has('span > a > abbr > span')
            .before(templateCommentLabel())
    }

    FacebookUI.prototype._injectReminder = function () {
        if ($('.ui.nag').length === 0 && this._settings.get('commentReminderIsEnabled')) {
            $('body').append(templateReminder())
            $('.ui.nag').nag({ expires: 1 })
        }
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
                        $('.sidebar textarea').val(activeComment.text)
                    } else {
                        $('.sidebar textarea').val('')
                    }

                    if (this._configs.get('roseCommentsRatingIsEnabled')) {
                        if (activeComment.rating !== undefined) {
                            _forEach(activeComment.rating, (rating, i) => {
                                $('.ui.rating:eq(' + i + ')').rating('set rating', rating)
                            })
                        } else {
                            $('.ui.rating').rating('set rating', 0)
                        }
                    }

                    $('.ui.checkbox').checkbox('uncheck')
                    if (activeComment.checkbox !== undefined) {
                        _forEach(activeComment.checkbox, (checkbox, i) => {
                            if (checkbox) {
                                $('.ui.checkbox:eq(' + i + ')').checkbox('check')
                            }
                        })
                    }
                } else {
                    let comment = {
                        createdAt: Date.now(),
                        type: 'post',
                        network: 'facebook'
                    }
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
            comment.text = ''
            $('.sidebar textarea').each(function getVals (i) {
                comment.text += $(this).val()
            })
            if (this._configs.get('roseCommentsRatingIsEnabled')) {
                comment.rating = $('.ui.rating').rating('get rating') || []
            }
            comment.checkbox = $('.ui.checkbox').checkbox('is checked')
            comment.updatedAt = Date.now()
            this._activeComment.set(comment)
            this._activeComment.save()
            $('.ui.sidebar').sidebar('hide')
            $('.ui.sidebar.uncover').sidebar('hide')
        }.bind(this))
    }

    return FacebookUI
})()
