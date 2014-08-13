Ember.TEMPLATES["about"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"info letter icon\"></i>\n    <div class=\"content\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "about", options) : helperMissing.call(depth0, "I18n", "about", options))));
  data.buffer.push("\n        <div class=\"sub header\">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "aboutPage.subHeader", options) : helperMissing.call(depth0, "I18n", "aboutPage.subHeader", options))));
  data.buffer.push(".</div>\n    </div>\n</h3>\n<div class=\"ui basic segment\">\n    <p>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "aboutPage.infoText", options) : helperMissing.call(depth0, "I18n", "aboutPage.infoText", options))));
  data.buffer.push("</p>\n    <div class=\"ui divider\"></div>\n    ROSE ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "developedBy", options) : helperMissing.call(depth0, "I18n", "developedBy", options))));
  data.buffer.push("\n\n    <p>Oliver Hoffmann ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "and", options) : helperMissing.call(depth0, "I18n", "and", options))));
  data.buffer.push(" Sebastian Ruhleder</p>\n\n    <div class=\"ui basic segment\">\n    ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "sitAddress", options) : helperMissing.call(depth0, "I18n", "sitAddress", options))));
  data.buffer.push("\n    </div>\n    <p>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "aboutPage.furtherQuestions", options) : helperMissing.call(depth0, "I18n", "aboutPage.furtherQuestions", options))));
  data.buffer.push("</p>\n    <div class=\"ui divider\"></div>\n    <div class=\"ui basic vertical disabled segment\">\n        This program is free software;you can redistribute it and/or modify it under the terms of the GNU General Public License version as published by the Free Software Foundation;either version 3 of the License, or (at your option) any later version. </p>\n    </div>\n</div>\n");
  return buffer;
  
});

Ember.TEMPLATES["application"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "diary", options) : helperMissing.call(depth0, "I18n", "diary", options))));
  data.buffer.push("<i class=\"book icon\"></i>\n                ");
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "backup", options) : helperMissing.call(depth0, "I18n", "backup", options))));
  data.buffer.push("<i class=\"download disk icon\"></i>\n                ");
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "settings", options) : helperMissing.call(depth0, "I18n", "settings", options))));
  data.buffer.push("<i class=\"settings icon\"></i>\n                ");
  return buffer;
  }

function program7(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "interactions", options) : helperMissing.call(depth0, "I18n", "interactions", options))));
  data.buffer.push("\n                        ");
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "comments", options) : helperMissing.call(depth0, "I18n", "comments", options))));
  data.buffer.push("\n                        ");
  return buffer;
  }

function program11(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "privacy-settings", options) : helperMissing.call(depth0, "I18n", "privacy-settings", options))));
  data.buffer.push("\n                        ");
  return buffer;
  }

function program13(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "about", options) : helperMissing.call(depth0, "I18n", "about", options))));
  data.buffer.push("<i class=\"info letter icon\"></i>\n                ");
  return buffer;
  }

function program15(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentation", options) : helperMissing.call(depth0, "I18n", "documentation", options))));
  data.buffer.push("<i class=\"text file icon\"></i>\n                ");
  return buffer;
  }

  data.buffer.push("<div class=\"container\">\n    <div class=\"ui page grid\">\n        <div class=\"fluid five wide column\">\n            <div class=\"ui red fluid vertical small menu\">\n                <div class=\"header item\">\n                    <i class=\"home icon\"></i>\n                    ROSE\n                </div>\n                ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "diary", options) : helperMissing.call(depth0, "link-to", "diary", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "backup", options) : helperMissing.call(depth0, "link-to", "backup", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(5, program5, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "settings", options) : helperMissing.call(depth0, "link-to", "settings", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                <div class=\"header item\">\n                    <i class=\"user icon\"></i>\n                    ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "networks", options) : helperMissing.call(depth0, "I18n", "networks", options))));
  data.buffer.push("\n                </div>\n                <div class=\"item\">\n                    Facebook\n                    <i class=\"facebook icon\"></i>\n                    <div class=\"menu\">\n                        ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(7, program7, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "facebook.interactions", options) : helperMissing.call(depth0, "link-to", "facebook.interactions", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                        ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(9, program9, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "facebook.comments", options) : helperMissing.call(depth0, "link-to", "facebook.comments", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                        ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(11, program11, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "facebook.privacy", options) : helperMissing.call(depth0, "link-to", "facebook.privacy", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                    </div>\n                </div>\n                <div class=\"item\">\n                    Google+\n                    <i class=\"google plus icon\"></i>\n                    <div class=\"menu\">\n                        ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(7, program7, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "google.interactions", options) : helperMissing.call(depth0, "link-to", "google.interactions", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                        ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(9, program9, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "google.comments", options) : helperMissing.call(depth0, "link-to", "google.comments", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                        ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(11, program11, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "google.privacy", options) : helperMissing.call(depth0, "link-to", "google.privacy", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                    </div>\n                </div>\n                <div class=\"header item\">\n                    <i class=\"help icon\"></i>\n                    ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "help", options) : helperMissing.call(depth0, "I18n", "help", options))));
  data.buffer.push("\n                </div>\n                ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(13, program13, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "about", options) : helperMissing.call(depth0, "link-to", "about", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                ");
  stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
    'classNames': ("item")
  },hashTypes:{'classNames': "STRING"},hashContexts:{'classNames': depth0},inverse:self.noop,fn:self.program(15, program15, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentation", options) : helperMissing.call(depth0, "link-to", "documentation", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n            </div>\n        </div>\n        <div class=\"fluid eleven wide column\">\n            <div id=\"outlet\" class=\"ui segment\">\n                ");
  stack1 = helpers._triageMustache.call(depth0, "outlet", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n            </div>\n        </div>\n    </div>\n</div>\n");
  return buffer;
  
});

Ember.TEMPLATES["backup"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n    <div class=\"fluid ui icon labled right button disabled\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "restore", options) : helperMissing.call(depth0, "I18n", "restore", options))));
  data.buffer.push("\n        <i class=\"black upload disk icon\"></i>\n    </div>\n    ");
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n    <div ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
    'class': (":fluid :ui: :icon :labled :right :button isValid::disabled")
  },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
  data.buffer.push(" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "restore", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
  data.buffer.push(">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "restore", options) : helperMissing.call(depth0, "I18n", "restore", options))));
  data.buffer.push("\n        <i class=\"black upload disk icon\"></i>\n    </div>\n    ");
  return buffer;
  }

  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"download disk icon\"></i>\n    <div class=\"content\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "backup", options) : helperMissing.call(depth0, "I18n", "backup", options))));
  data.buffer.push("\n        <div class=\"sub header\">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "backupPage.subHeader", options) : helperMissing.call(depth0, "I18n", "backupPage.subHeader", options))));
  data.buffer.push(".</div>\n    </div>\n</h3>\n<div class=\"ui form\">\n    <div ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
    'class': (":field isEmptyOrValid::error")
  },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
  data.buffer.push(">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.textarea || (depth0 && depth0.textarea),options={hash:{
    'valueBinding': ("textfield")
  },hashTypes:{'valueBinding': "STRING"},hashContexts:{'valueBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "textarea", options))));
  data.buffer.push("\n    </div>\n    <div class=\"fluid ui positive icon labeled right button\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "backup", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "backup", options) : helperMissing.call(depth0, "I18n", "backup", options))));
  data.buffer.push("<i class=\"download disk icon\"></i></div>\n    <div class=\"ui horizontal divider\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "or", options) : helperMissing.call(depth0, "I18n", "or", options))));
  data.buffer.push("\n    </div>\n    ");
  stack1 = helpers['if'].call(depth0, "isEmpty", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n</div>\n");
  return buffer;
  
});

Ember.TEMPLATES["diary"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = '', stack1, helper, options;
  data.buffer.push("\n    <div class=\"comment\">\n        <a class=\"avatar\">\n        <i class=\"large circular file icon\"></i>\n        </a>\n        <div class=\"content\">\n            <a class=\"author\">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "you", options) : helperMissing.call(depth0, "I18n", "you", options))));
  data.buffer.push("</a>\n            <div class=\"metadata\">\n                <div class=\"date\" title=\"");
  data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "timeFormatted", "createdAt", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["ID","ID"],data:data})));
  data.buffer.push("\">");
  data.buffer.push(escapeExpression((helper = helpers.timeAgo || (depth0 && depth0.timeAgo),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data},helper ? helper.call(depth0, "createdAt", options) : helperMissing.call(depth0, "timeAgo", "createdAt", options))));
  data.buffer.push("</div>\n            </div>\n            <div class=\"text\">\n                ");
  stack1 = helpers._triageMustache.call(depth0, "content", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n            </div>\n            <div class=\"actions\">\n                <a class=\"edit\"");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "editEntry", "", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "edit", options) : helperMissing.call(depth0, "I18n", "edit", options))));
  data.buffer.push("</a>\n                <a class=\"delete\"");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "deleteEntry", "", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "delete", options) : helperMissing.call(depth0, "I18n", "delete", options))));
  data.buffer.push("</a>\n            </div>\n        </div>\n    </div>\n    ");
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n    <div class=\"ui info message\">\n        <div class=\"content\">\n            <div class=\"header\">\n                ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "diaryPage.messageHeader", options) : helperMissing.call(depth0, "I18n", "diaryPage.messageHeader", options))));
  data.buffer.push("\n            </div>\n            <p>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "diaryPage.messageContent", options) : helperMissing.call(depth0, "I18n", "diaryPage.messageContent", options))));
  data.buffer.push("!</p>\n        </div>\n    </div>\n    ");
  return buffer;
  }

  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"book icon\"></i>\n    <div class=\"content\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "diary", options) : helperMissing.call(depth0, "I18n", "diary", options))));
  data.buffer.push("\n        <div class=\"sub header\">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "diaryPage.subHeader", options) : helperMissing.call(depth0, "I18n", "diaryPage.subHeader", options))));
  data.buffer.push(".</div>\n    </div>\n</h3>\n<div class=\"ui form\">\n    <div class=\"field\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.textarea || (depth0 && depth0.textarea),options={hash:{
    'value': ("diaryText")
  },hashTypes:{'value': "ID"},hashContexts:{'value': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "textarea", options))));
  data.buffer.push("\n    </div>\n    <div class=\"two fluid ui buttons\">\n        <div class=\"ui button\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "cancel", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "cancel", options) : helperMissing.call(depth0, "I18n", "cancel", options))));
  data.buffer.push("</div>\n        <div class=\"ui positive button\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "saveEntry", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "save", options) : helperMissing.call(depth0, "I18n", "save", options))));
  data.buffer.push("</div>\n    </div>\n</div>\n<div class=\"ui divider\"></div>\n<div class=\"ui small comments\">\n    ");
  stack1 = helpers.each.call(depth0, {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),contexts:[],types:[],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n</div>\n");
  return buffer;
  
});

Ember.TEMPLATES["documentation"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"text file icon\"></i>\n    <div class=\"content\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentation", options) : helperMissing.call(depth0, "I18n", "documentation", options))));
  data.buffer.push("\n        <div class=\"sub header\">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.subHeader", options) : helperMissing.call(depth0, "I18n", "documentationPage.subHeader", options))));
  data.buffer.push(".</div>\n    </div>\n</h3>\n<h4>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.question1", options) : helperMissing.call(depth0, "I18n", "documentationPage.question1", options))));
  data.buffer.push("</h4>\n");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.answer1", options) : helperMissing.call(depth0, "I18n", "documentationPage.answer1", options))));
  data.buffer.push("\n<div class=\"ui divider\"></div>\n<h4>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.question2", options) : helperMissing.call(depth0, "I18n", "documentationPage.question2", options))));
  data.buffer.push("</h4>\n");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.answer2", options) : helperMissing.call(depth0, "I18n", "documentationPage.answer2", options))));
  data.buffer.push("\n<div class=\"ui divider\"></div>\n<h4>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.question3", options) : helperMissing.call(depth0, "I18n", "documentationPage.question3", options))));
  data.buffer.push("</h4>\n");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.answer3", options) : helperMissing.call(depth0, "I18n", "documentationPage.answer3", options))));
  data.buffer.push("\n<div class=\"ui divider\"></div>\n<h4>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.question4", options) : helperMissing.call(depth0, "I18n", "documentationPage.question4", options))));
  data.buffer.push("</h4>\n");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.answer4", options) : helperMissing.call(depth0, "I18n", "documentationPage.answer4", options))));
  data.buffer.push("\n<div class=\"ui divider\"></div>\n<h4>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.question5", options) : helperMissing.call(depth0, "I18n", "documentationPage.question5", options))));
  data.buffer.push("</h4>\n");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.answer5", options) : helperMissing.call(depth0, "I18n", "documentationPage.answer5", options))));
  data.buffer.push("\n<div class=\"ui divider\"></div>\n<h4>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.question6", options) : helperMissing.call(depth0, "I18n", "documentationPage.question6", options))));
  data.buffer.push("</h4>\n");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.answer6", options) : helperMissing.call(depth0, "I18n", "documentationPage.answer6", options))));
  data.buffer.push("\n<div class=\"ui divider\"></div>\n<h4>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.question7", options) : helperMissing.call(depth0, "I18n", "documentationPage.question7", options))));
  data.buffer.push("</h4>\n");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.answer7", options) : helperMissing.call(depth0, "I18n", "documentationPage.answer7", options))));
  data.buffer.push("\n<div class=\"ui divider\"></div>\n<h4>");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.question8", options) : helperMissing.call(depth0, "I18n", "documentationPage.question8", options))));
  data.buffer.push("</h4>\n");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "documentationPage.answer8", options) : helperMissing.call(depth0, "I18n", "documentationPage.answer8", options))));
  data.buffer.push("\n");
  return buffer;
  
});

Ember.TEMPLATES["facebook/comments"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = '', stack1, helper, options;
  data.buffer.push("\n        <div class=\"event\">\n            <div class=\"label\">\n                <i class=\"comment icon\"></i>\n                ");
  stack1 = helpers['if'].call(depth0, "item.hidden", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(2, program2, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n            </div>\n            <div class=\"content\">\n                <div class=\"date\" title=\"");
  data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "timeFormatted", "item.createdAt", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["ID","ID"],data:data})));
  data.buffer.push("\">\n                    ");
  data.buffer.push(escapeExpression((helper = helpers.timeAgo || (depth0 && depth0.timeAgo),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data},helper ? helper.call(depth0, "item.createdAt", options) : helperMissing.call(depth0, "timeAgo", "item.createdAt", options))));
  data.buffer.push("\n                </div>\n                <div class=\"summary\">\n                   ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "you", options) : helperMissing.call(depth0, "I18n", "you", options))));
  data.buffer.push(" created a comment\n                </div>\n                <div class=\"extra text\">\n                    ");
  stack1 = helpers._triageMustache.call(depth0, "item.record.text", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                </div>\n                <div class=\"actions\">\n                    ");
  stack1 = helpers['if'].call(depth0, "item.hidden", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(6, program6, data),fn:self.program(4, program4, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                    <a class=\"delete\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "delete", "item", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "delete", options) : helperMissing.call(depth0, "I18n", "delete", options))));
  data.buffer.push("</a>\n                </div>\n            </div>\n        </div>\n        ");
  return buffer;
  }
function program2(depth0,data) {
  
  
  data.buffer.push("\n                <i class=\"minus red sign icon\" title=\"Hello I am a popup\" data-variation=\"inverted\"></i>\n                ");
  }

function program4(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                    <a class=\"hide\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "show", "item", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "include", options) : helperMissing.call(depth0, "I18n", "include", options))));
  data.buffer.push("</a>\n                    ");
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                    <a class=\"hide\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "hide", "item", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "exclude", options) : helperMissing.call(depth0, "I18n", "exclude", options))));
  data.buffer.push("</a>\n                    ");
  return buffer;
  }

function program8(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n        <div class=\"ui info message\">\n            <div class=\"header\">\n                ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "commentsPage.messageHeader", options) : helperMissing.call(depth0, "I18n", "commentsPage.messageHeader", options))));
  data.buffer.push("\n            </div>\n            ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "commentsPage.messageContent", options) : helperMissing.call(depth0, "I18n", "commentsPage.messageContent", options))));
  data.buffer.push(".\n        </div>\n        ");
  return buffer;
  }

  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"comment icon\"></i>\n    <div class=\"content\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "comments", options) : helperMissing.call(depth0, "I18n", "comments", options))));
  data.buffer.push("\n        <div class=\"sub header\">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "commentsPage.subHeader", options) : helperMissing.call(depth0, "I18n", "commentsPage.subHeader", options))));
  data.buffer.push(".</div>\n    </div>\n</h3>\n<div class=\"comments\">\n    <div class=\"ui small pilled feed\">\n        ");
  stack1 = helpers.each.call(depth0, "item", "in", "activeComments", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(8, program8, data),fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n    </div>\n</div>\n");
  return buffer;
  
});

Ember.TEMPLATES["facebook/interactions"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = '', stack1, helper, options;
  data.buffer.push("\n    <div class=\"event\">\n        <div class=\"label\">\n            <i class=\"user icon\"></i>\n            ");
  stack1 = helpers['if'].call(depth0, "item.hidden", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(2, program2, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n        </div>\n        <div class=\"content\">\n            <div class=\"date\" title=\"");
  data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "timeFormatted", "item.createdAt", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["ID","ID"],data:data})));
  data.buffer.push("\">\n                ");
  data.buffer.push(escapeExpression((helper = helpers.timeAgo || (depth0 && depth0.timeAgo),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data},helper ? helper.call(depth0, "item.createdAt", options) : helperMissing.call(depth0, "timeAgo", "item.createdAt", options))));
  data.buffer.push("\n            </div>\n            <div class=\"summary clickable\">\n                ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "you", options) : helperMissing.call(depth0, "I18n", "you", options))));
  data.buffer.push(" created a ");
  stack1 = helpers._triageMustache.call(depth0, "item.record.type", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                <i class=\"icon triangle down\"></i>\n            </div>\n            <div class=\"extra text\">\n                ");
  data.buffer.push(escapeExpression((helper = helpers.pretty || (depth0 && depth0.pretty),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data},helper ? helper.call(depth0, "item", options) : helperMissing.call(depth0, "pretty", "item", options))));
  data.buffer.push("\n            </div>\n            <div class=\"actions\">\n                ");
  stack1 = helpers['if'].call(depth0, "item.hidden", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(6, program6, data),fn:self.program(4, program4, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                <a class=\"delete\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "delete", "item", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "delete", options) : helperMissing.call(depth0, "I18n", "delete", options))));
  data.buffer.push("</a>\n            </div>\n        </div>\n    </div>\n    ");
  return buffer;
  }
function program2(depth0,data) {
  
  
  data.buffer.push("\n            <i class=\"minus red sign icon\" title=\"Hello I am a popup\" data-variation=\"inverted\"></i>\n            ");
  }

function program4(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                <a class=\"hide\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "show", "item", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "include", options) : helperMissing.call(depth0, "I18n", "include", options))));
  data.buffer.push("</a>\n                ");
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n                <a class=\"hide\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "hide", "item", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
  data.buffer.push(">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "exclude", options) : helperMissing.call(depth0, "I18n", "exclude", options))));
  data.buffer.push("</a>\n                ");
  return buffer;
  }

function program8(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n    <div class=\"ui info message\">\n        <div class=\"header\">\n            ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "interactionsPage.messageHeader", options) : helperMissing.call(depth0, "I18n", "interactionsPage.messageHeader", options))));
  data.buffer.push("\n        </div>\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "interactionsPage.messageHeader", options) : helperMissing.call(depth0, "I18n", "interactionsPage.messageHeader", options))));
  data.buffer.push(".\n    </div>\n    ");
  return buffer;
  }

  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"star icon\"></i>\n    <div class=\"content\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "interactions", options) : helperMissing.call(depth0, "I18n", "interactions", options))));
  data.buffer.push("\n        <div class=\"sub header\">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "interactionsPage.subHeader", options) : helperMissing.call(depth0, "I18n", "interactionsPage.subHeader", options))));
  data.buffer.push("</div>\n    </div>\n</h3>\n<div class=\"ui small pilled feed\">\n    ");
  stack1 = helpers.each.call(depth0, "item", "in", "activeInteractions", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(8, program8, data),fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n</div>\n");
  return buffer;
  
});

Ember.TEMPLATES["facebook/privacy"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n<div class=\"ui small info message\">\n    <div class=\"header\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "privacyPage.messageHeader", options) : helperMissing.call(depth0, "I18n", "privacyPage.messageHeader", options))));
  data.buffer.push("\n    </div>\n    ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "privacyPage.messageContent", options) : helperMissing.call(depth0, "I18n", "privacyPage.messageContent", options))));
  data.buffer.push(".\n</div>\n");
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = '', stack1;
  data.buffer.push("\n");
  stack1 = helpers.each.call(depth0, "privacy", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(4, program4, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  stack1 = helpers.each.call(depth0, "timeline", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(4, program4, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
  }
function program4(depth0,data) {
  
  var buffer = '', stack1;
  data.buffer.push("\n<table class=\"ui small padded table segment\">\n    <thead>\n        <tr>\n            <th colspan=\"2\">");
  stack1 = helpers._triageMustache.call(depth0, "sectionName", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("</th>\n        </tr>\n    </thead>\n    <tbody>\n        ");
  stack1 = helpers.each.call(depth0, "settings", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(5, program5, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n    </tbody>\n</table>\n");
  return buffer;
  }
function program5(depth0,data) {
  
  var buffer = '', stack1;
  data.buffer.push("\n        <tr>\n            <td>");
  stack1 = helpers._triageMustache.call(depth0, "name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("</td>\n            <td>");
  stack1 = helpers._triageMustache.call(depth0, "value", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("</td>\n        </tr>\n        ");
  return buffer;
  }

  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"lock icon\"></i>\n    <div class=\"content\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "privacy-settings", options) : helperMissing.call(depth0, "I18n", "privacy-settings", options))));
  data.buffer.push("\n        <div class=\"sub header\">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "privacyPage.subHeader", options) : helperMissing.call(depth0, "I18n", "privacyPage.subHeader", options))));
  data.buffer.push(".</div>\n    </div>\n</h3>\n");
  stack1 = helpers['if'].call(depth0, "notAvailable", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
  
});

Ember.TEMPLATES["google/comments"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  


  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"comment icon\"></i>\n    <div class=\"content\">\n        Comments\n        <div class=\"sub header\">Have a look at all your comments.</div>\n    </div>\n</h3>\n");
  
});

Ember.TEMPLATES["google/interactions"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  


  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"star icon\"></i>\n    <div class=\"content\">\n        Interactions\n        <div class=\"sub header\">All your recent interactions.</div>\n    </div>\n</h3>\n");
  
});

Ember.TEMPLATES["google/privacy"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  


  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"lock icon\"></i>\n    <div class=\"content\">\n        Privacy Settings\n        <div class=\"sub header\">Have a look at all your settings.</div>\n    </div>\n</h3>\n");
  
});

Ember.TEMPLATES["index"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"home icon\"></i>\n    <div class=\"content\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "ROSE", options) : helperMissing.call(depth0, "I18n", "ROSE", options))));
  data.buffer.push("\n        <div class=\"sub header\">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "version", options) : helperMissing.call(depth0, "I18n", "version", options))));
  data.buffer.push(": ");
  stack1 = helpers._triageMustache.call(depth0, "version", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n    </div>\n</h3>\n");
  return buffer;
  
});

Ember.TEMPLATES["settings"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "enabled", options) : helperMissing.call(depth0, "I18n", "enabled", options))));
  data.buffer.push("\n    ");
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "disabled", options) : helperMissing.call(depth0, "I18n", "disabled", options))));
  data.buffer.push("\n    ");
  return buffer;
  }

  data.buffer.push("<h3 class=\"ui header\">\n    <i class=\"settings icon\"></i>\n    <div class=\"content\">\n        ");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "settings", options) : helperMissing.call(depth0, "I18n", "settings", options))));
  data.buffer.push("\n        <div class=\"sub header\">");
  data.buffer.push(escapeExpression((helper = helpers.I18n || (depth0 && depth0.I18n),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "settingsPage.subHeader", options) : helperMissing.call(depth0, "I18n", "settingsPage.subHeader", options))));
  data.buffer.push(".</div>\n    </div>\n</h3>\n<div class=\"ui toggle checkbox\">\n    ");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "Ember.Checkbox", {hash:{
    'checkedBinding': ("showReminder"),
    'id': ("reminder-checkbox")
  },hashTypes:{'checkedBinding': "STRING",'id': "STRING"},hashContexts:{'checkedBinding': depth0,'id': depth0},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push("\n    <label for=\"reminder-checkbox\">Comment reminder:\n    <b>");
  stack1 = helpers['if'].call(depth0, "showReminder", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("</b>\n    </label>\n</div>\n");
  return buffer;
  
});