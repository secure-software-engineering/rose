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

import log from './log'
import ExtractorCollection from './collections/extractors'
import ExtractsCollection from './collections/extracts'
import {sha1 as hash} from './crypto'
import ConfigsModel from './models/system-config'

class ExtractorEngine {
    constructor (extractorCollection) {
        if (extractorCollection !== undefined) {
            this.extractors = extractorCollection
        } else {
            this.extractors = new ExtractorCollection()
            this.extractors.fetch()
        }
        this.extracts = new ExtractsCollection()
        this.extracts.fetch()
        this.configs = new ConfigsModel()
        this.configs.fetch()
        this.scheduled = []
    }

    storeExtract (extractor, extracts = {}) {
        var data = {}

        // Time
        data.createdAt = Date.now()

        // Save extractor name and version
        data.origin = {
            extractor: extractor.get('name'),
            network: extractor.get('network'),
            version: extractor.get('version')
        }
        data.fields = extracts

        // Logging interaction
        this.extracts.create(data)
        log('ExtractorEngine', 'New extract stored: ' + JSON.stringify(data))
    }

    static extractFieldsFromContainer ($container, extractor, configs) {
        var fields = extractor.get('fields')
        var data = {}

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i]
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
                        datum = hash(datum, configs.get('salt'), configs.get('hashLength'))
                    }

                    data[field.name] = datum
                }
            }
        }

        return data
    }

    extractFieldsFromContainerByName ($container, extractorName) {
        var extractor = this.extractors.findWhere({name: extractorName})
        return ExtractorEngine.extractFieldsFromContainer($container, extractor, this.configs)
    }

    handleURL (extractor) {
        $.get(extractor.get('informationUrl'), function handleExtratorResponse (htmlContent) {
            log('ExtractorEngine', 'processing: ' + extractor.get('name'))

            var $container = $(htmlContent)
            var entry = {}

            if (extractor.get('container')) {
                $container = $container.find(extractor.get('container'))
            }

            entry = ExtractorEngine.extractFieldsFromContainer($container, extractor)

            if (entry !== undefined && entry !== {}) {
                this.storeExtract(extractor, entry)
            } else {
                log('ExtractorEngine', extractor.get('name') + ' returned no results!')
            }
        }.bind(this))
    }

    register (scheduler) {
        log('ExtractorEngine', 'Register to Execution Service')
        let periodicExtractors = this.extractors.where({type: 'url'})

        for (var i = 0; i < periodicExtractors.length; i++) {
            this.scheduled.push(periodicExtractors[i].get('name'))
            scheduler(periodicExtractors[i].get('name'), periodicExtractors[i].get('interval'), this.handleURL.bind(this, periodicExtractors[i]))
        }
    }
}

/**
 * @module Core
 * @submodule Extractor Engine
 */
export default ExtractorEngine
