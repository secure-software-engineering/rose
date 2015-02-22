(function($) {
  // Sebastian Ruhleder, Felix Epp, v. 0.0.8
  'use strict';
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

  var findPattern = function(pattern, $node, events, level) {
    var data = [], hooks = [], success = false;

    $node.find('> ' + pattern.tag).each(function() {
      var fields = {}, $currentNode = $(this), found = true;

      for(var i in pattern.conditions) {
        var condition = pattern.conditions[i];

        if(condition.name === 'class') {
          var classes = condition.value.split(' ');

          for (var j = classes.length - 1; j >= 0; j--) {
            if(!$currentNode.hasClass(classes[j])) {
              return;
            }
          }

        } else {
          if($currentNode.attr(condition.name) !== condition.value) {
            return;
          }
        }
      }

      pattern.children.forEach( function(child) {
        var rec = findPattern(child, $currentNode, events, level + 1);

        found &= rec.success;

        var merged = [].concat.apply([], rec.data); //do not understand line?
        for(var n in merged) {
          var set = merged[n];

          for(var key in set) {
            fields[key] = set[key];
          }
        }

        merged = [].concat.apply([], rec.hooks); //do not understand line?
        for(var m in merged) {
          var hook = merged[m];

          hooks.push(hook);
        }
      });

      if(found) {
        success = true;

        for(var p in pattern.fields) {
          var field = pattern.fields[p];

          if(field.name === 'content') {
            fields[field.value] = $currentNode.html();
          } else {
            fields[field.value] = $currentNode.attr(field.name);
          }
        }

        data.push(fields);

        for(var q in pattern.events) {
          var event = pattern.events[q];

          var hook = {
            'node': $currentNode,
            'type': event.name,
            'event': event.value
          };

          hooks.push(hook);
        }

        if(level === 0) {
          for(var h in hooks) {
            var hooki = hooks[h];

            var proceed = true;
            var registeredEvents = $._data(hooki.node, 'events');
            if(registeredEvents !== undefined && registeredEvents.click !== undefined) {
              for(var r in registeredEvents.click) {
                var registeredEvent = registeredEvents.click[r];

                if(registeredEvent.data !== undefined) {
                  if(registeredEvent.data.pattern !== undefined) {
                    proceed = false;
                  }
                }
              }
            }

            if(!proceed) {
              continue;
            }

            $(hooki.node).on(hooki.type, {'pattern': 'yes', 'fields': fields}, function(event) {
              var func = events[hooki.event];

              func(event.data.fields);
            });
          }
        }
      }
    });

    return {
      'success': success,
      'data': data,
      'hooks': hooks
    };
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

  $.fn.extend({
    applyPattern : function(options) {
      // Compile pattern
      var pattern = compilePattern($(preprocess(options.structure)));

      // Wrap node in container
      var $node = $('<div></div>').append(this.clone()); //.wrap() possible?

      return findPattern(pattern, $node, options.events, 0);
    }});
})(jQuery);
