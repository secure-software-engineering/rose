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
import log from 'rose/log';
import ExtractorCollection from 'rose/collections/extractors';
import {sha1 as hash} from 'rose/crypto';

class ExtractorEngine {
  constructor(extractorCollection) {
    if (extractorCollection !== undefined) {
      this.extractors = extractorCollection;
    }
    else {
      this.extractors = new ExtractorCollection();
      this.extractors.fetch();
    }
  }

  static extractFieldsFromContainer($container, extractor) {
    var fields = extractor.get('fields');
    var data = {};

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var $elem;
      if (field.selector !== undefined) {
        $elem = $container.find(field.selector);
      }
      else {
        $elem = $container;
      }
      if ($elem.length) {
        var datum;
        if (field.attr === 'content') {
          datum = $elem.html();
        }
        else {
          datum = $elem.attr(field.attr);
        }
        //something found?
        if (datum !== '') {

          //extract detailed info with match
          if (field.match !== undefined) {
            datum = datum.match(new RegExp(field.match, 'g'))[0];
          }

          if (field.hash) {
            datum = hash(datum);
          }

          data[field.name] = datum;
        }
      }
    }

    return data;

  }

  extractFieldsFromContainerByName($container, extractorName) {
    var extractor = this.extractors.findWhere({name: extractorName});
    return ExtractorEngine.extractFieldsFromContainer($container, extractor);
  }

  handleURL(extractor) {
    $.get(extractor.get('informationUrl'), function handleExtratorResponse(htmlContent) {

      log('ExtractorEngine','processing: ' + extractor.get('name'));

      var $container = $(htmlContent);
      var entry = {};

      if (extractor.get('container')) {
        $container = $container.find(extractor.get('container'));
      }

      entry = ExtractorEngine.extractFieldsFromContainer($container, extractor);

      if (entry !== undefined && entry !== {}) {
        //store Extract
        console.log(entry);
      }
    }.bind(this));
  }

  schedule(extractor) {
    log('ExtractorEngine', 'Apply extractor: ' + extractor.get('name'));

    //FIXME: Schedule extractor task after login
    //Heartbeat.schedule(extractor.name, extractor.interval, {}, function() {
        // Iterate through extracts and execute them
        // for (var i in extractor.extracts) {
        //     var extract = extractor.extracts[i];

        //     // Handle extraction process
        //     handle(extract);
        // }
    //});
    this.handleURL(extractor);
  }

  add(extractor) {
    log('ExtractorEngine', 'Add extractor: ' + extractor.name);

    // Push to extractors list
    this.extractors.push(extractor);
  }

  register() {
    //FIXME: Filter extractor by network
    log('ExtractorEngine', 'Register to Execution Service');
    let periodicExtractors = this.extractors.where({type: 'url'});

    for (var i = 0; i < periodicExtractors.length; i++) {
      // Apply extractor and register it to Heartbeat
      this.schedule(periodicExtractors[i]);
    }

  }
}

/**
 * @module Core
 * @submodule Extractor Engine
 */
export default ExtractorEngine;
