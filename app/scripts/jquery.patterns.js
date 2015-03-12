(function($) {
  // Sebastian Ruhleder, Felix Epp, v. 0.1.0
  'use strict';

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

  $.fn.extend({
    applyPattern : function(options) {
      // Wrap node in container
      var $node = $('<div></div>').append(this.clone()); //.wrap() possible?

      return findPattern(options.structure, $node, options.events, 0);
    }});
})(jQuery);
