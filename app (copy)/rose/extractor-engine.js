/*
Copyright (C) 2015
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
import _filter from 'lodash/filter'

import log from './log'
import {sha1 as hash} from './crypto'

class ExtractorEngine {
    constructor (spec) {
        this.config = spec.config
        this.extractors = spec.extractors
        this.extracts = spec.extracts
        this.store = spec.store
    }

    storeExtract (extractor, extracts = {}) {
        var data = {}

        // Time
        data.createdAt = (new Date()).toJSON()

        // Save extractor name and version
        data.origin = {
            extractor: extractor.name,
            network: extractor.network,
            version: extractor.version
        }
        data.fields = extracts

        // Logging interaction
        this.store.create('extract', data)
            .then((record) => log('ExtractorEngine', 'New extract stored: ' + JSON.stringify(record)))
    }

    static extractFieldsFromContainer ($container, extractor, configs) {
        var fields = extractor.fields
        var data = {}

        for (let field of fields) {
            var $elem
            if (field.selector !== undefined) {
                $elem = $container.find(field.selector)
            } else {
                $elem = $container
            }
            if ($elem.length) {
                var datum
                if (field.attr === 'content') {
                    datum = $elem.html()
                } else {
                    datum = $elem.attr(field.attr)
                }
                // something found?
                if (datum !== '') {
                    // extract detailed info with match
                    if (field.match !== undefined) {
                        var matches = datum.match(new RegExp(field.match, 'g'))
                        if (matches !== null) {
                            datum = matches[0]
                        } else {
                            log('ExtractorEngine', 'RegEx ' + field.match + ' for field ' + field.name + ' failed on ' + datum)
                            continue
                        }
                    }

                    if (field.hash) {
                        datum = hash(datum, configs.salt, configs.hashLength)
                    }

                    data[field.name] = datum
                }
            }
        }

        return data
    }

    extractFieldsFromContainerByName ($container, extractorName) {
        var extractor = this.extractors.findWhere({name: extractorName})
        return ExtractorEngine.extractFieldsFromContainer($container, extractor, this.config)
    }

    handleURL (extractor) {
        $.get(extractor.informationUrl, function handleExtratorResponse (htmlContent) {
            log('ExtractorEngine', 'processing: ' + extractor.name)

            var $container = $(htmlContent)
            var entry = {}

            if (extractor.container) {
                $container = $container.find(extractor.container)
            }

            entry = ExtractorEngine.extractFieldsFromContainer($container, extractor)

            if (entry !== undefined && entry !== {}) {
                this.storeExtract(extractor, entry)
            } else {
                log('ExtractorEngine', extractor.name + ' returned no results!')
            }
        }.bind(this))
    }

    register (scheduler) {
        let periodicExtractors = _filter(this.extractors, { type: 'url' })

        for (let periodicExtractor of periodicExtractors) {
            scheduler(periodicExtractor.name, periodicExtractor.interval, this.handleURL.bind(this, periodicExtractor))
        }
    }
}

/**
 * @module Core
 * @submodule Extractor Engine
 */
export default ExtractorEngine
