import {sha1 as hash} from 'rose/crypto';

/**
 * Move innerHtml Fields to "content" attribute
 */
var preprocess = function(structure) {
  //recursion is obsolete use replace
  for(;;) {
    var match = /<(.+)>\{(.+)\}<(.+)>/gi.exec(structure);

    if(match === null) {
      return structure;
    }

    structure = '<' + match[1] + ' content="{' + match[2] + '}"><' + match[3] + '>';
  }
};

/**
 * FIXME: Why compiling the pattern with each click, that is ridonkoulus??? Maybe on importing observers
 */
var compilePattern = function(structure) {
  var name = structure.prop('tagName');
  var fields = [], conditions = [], events = [];

  $.each(structure[0].attributes, function(i, attr) {
    var entry = {
      'name': attr.name,
      'value': attr.value
    };

    if(/^\{.+\}$/.test(attr.value)) {
      entry.value = attr.value.slice(1,-1);
      fields.push(entry);
    }
    else if(/^\[.+\]$/.test(attr.value)) {
      entry.value = attr.value.slice(1, -1);
      events.push(entry);
    } else {
      conditions.push(entry);
    }
  });

  var children = [];
  structure.children().each(function() {
    var childPattern = compilePattern($(this));

    children.push(childPattern);
  });

  return {
    'tag': name,
    'fields': fields,
    'conditions': conditions,
    'events': events,
    'children': children
  };
};

var model = Backbone.Model.extend({

  initialize: function(options) {
    var patterns = this.get('patterns');
    for (var j = 0; j < patterns.length; j++) {
      var pattern = patterns[j];
      if (!kango.ui) {
        pattern.process = eval('(' + pattern.process + ')');
        pattern.structure = compilePattern($(preprocess(pattern.pattern)));
      }
    }
    this.set('patterns', patterns);
  },

  sync: Backbone.kangoforage.sync('Observer')
});

export default model;
