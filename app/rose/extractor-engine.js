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
