;(function($) {
  // Sebastian Ruhleder, v. 0.0.3
  "use strict";

  var preprocess = function(structure) {
    for(;;) {
      var match = /\<(.+)\>\{(.+)\}\<(.+)\>/gi.exec(structure);

      if(match == null) {
        return structure;
      }

      structure = '<' + match[1] + ' content="{' + match[2] + '}"><' + match[3] + '>';
    }
  };

  var findPattern = function(pattern, node, events, level) {
    var data = [], hooks = [], success = false;

    $(node).find("> " + pattern['tag']).each(function() {
      var fields = {}, currentNode = this, found = true;

      var conditionsSatisfied = true;
      for(var i in pattern['conditions']) {
        var condition = pattern['conditions'][i];

        if(condition['name'] == "class") {
          var classes = condition['value'].split(" ");

          for(var i in classes) {
            var c = classes[i];

            if(!$(currentNode).hasClass(c)) {
              conditionsSatisfied = false;
            }
          }
        } else {
          if($(currentNode).attr(condition['name']) != condition['value']) {
            conditionsSatisfied = false;
          }
        }
      }

      if(!conditionsSatisfied) {
        return;
      }

      $.each(pattern['children'], function(i, child) {
        var rec = findPattern(child, currentNode, events, level + 1);

        found &= rec['success'];

        var merged = [].concat.apply([], rec['data']);
        for(var i in merged) {
          var set = merged[i];

          for(var key in set) {
            fields[key] = set[key];
          }
        }

        var merged = [].concat.apply([], rec['hooks']);
        for(var i in merged) {
          var hook = merged[i];

          hooks.push(hook);
        }
      });

      if(found) {
        success = true;

        for(var i in pattern['fields']) {
          var field = pattern['fields'][i];

          if(field['name'] == 'content') {
            fields[field['value']] = $(currentNode).html();
          } else {
            fields[field['value']] = $(currentNode).attr(field['name']);
          }
        }

        data.push(fields);

        for(var i in pattern['events']) {
          var event = pattern['events'][i];

          var hook = {
            'node': currentNode,
            'type': event['name'],
            'event': event['value']
          };

          hooks.push(hook);
        }

        if(level == 0) {
          for(var i in hooks) {
            var hook = hooks[i];

            var proceed = true;
            var registeredEvents = $._data(hook['node'], "events");
            if(registeredEvents !== undefined) {
              if(registeredEvents['click'] !== undefined) {
                for(var j in registeredEvents['click']) {
                  var registeredEvent = registeredEvents['click'][j];

                  if(registeredEvent['data'] !== undefined) {
                    if(registeredEvent['data']['pattern'] !== undefined) {
                      proceed = false;
                    }
                  }
                }
              }
            }

            if(!proceed) {
              continue;
            }

            $(hook['node']).on(hook['type'], {'pattern': 'yes', 'fields': fields}, function(event) {
              var func = events[hook['event']];

              func(event.data['fields']);
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

  var compilePattern = function(structure) {
    var name = structure.prop('tagName');

    var fields = [], conditions = [], events = [];
    $.each(structure[0].attributes, function(i, attr) {
      var entry = {
        'name': attr.name,
        'value': attr.value
      };

      if(attr.value.match(/^\{.+\}$/gi)) {
        entry['value'] = entry['value'].replace(/[\{\}]/gi, "");

        fields.push(entry);
      } else if(attr.value.match(/^\[.+\]$/gi)) {
        entry['value'] = entry['value'].replace(/[\[\]]/gi, "");

        events.push(entry);
      } else {
        conditions.push(entry);
      }
    });

    var children = [];
    structure.children().each(function() {
      var childPattern = compilePattern($(this))

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

  $.fn.applyPattern = function(options) {
    // Compile pattern
    var pattern = compilePattern($(preprocess(options['structure'])));

    // Wrap node in container
    var node = $("<div></div>").append(this.clone());

    return findPattern(pattern, node, options['events'], 0);
  };
})(jQuery);
