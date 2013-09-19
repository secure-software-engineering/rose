;(function($) {
  // Sebastian Ruhleder, v. 0.0.2
  "use strict";
  
  var preprocess = function(structure) {
    return structure;
    
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
    
    $(node).find(pattern['tag']).each(function() {
      var fields = {}, currentNode = this, found = true;
      
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
            
            $(hook['node']).on(hook['type'], fields, function(event) {
              event.stopImmediatePropagation();
              
              var func = events[hook['event']];
              
              func(event.data);
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
    return findPattern(compilePattern($(preprocess(options['structure']))), this, options['events'], 0);
  };
})(jQuery);