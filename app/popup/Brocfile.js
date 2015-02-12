/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var mergeTrees = require('broccoli-merge-trees');
var pickFiles = require('broccoli-static-compiler');

var app = new EmberApp();

app.import('bower_components/semantic-ui/build/packaged/css/semantic.css');
app.import('bower_components/roboto-fontface/roboto-fontface.css');

app.import('bower_components/momentjs/moment.js');

// Use `app.import` to add additional libraries to the generated
// output files.
//
// If you need to use different assets in different
// environments, specify an object as the first parameter. That
// object's keys should be the environment name and the values
// should be the asset to use in that environment.
//
// If the library that you are including contains AMD or ES6
// modules that you would like to import into your application
// please specify an object with the list of modules as keys
// along with the exports of each module as its value.

var semanticFonts = pickFiles('bower_components/semantic-ui/build/packaged/fonts', {
    srcDir: '/',
    files: ['**/*'],
    destDir: '/fonts'
});

var robotoFonts = pickFiles('bower_components/roboto-fontface/fonts', {
    srcDir: '/',
    files: ['**/Roboto-Regular.*', '**/Roboto-Bold.*'],
    destDir: 'assets/fonts'
});

module.exports = mergeTrees([app.toTree(), semanticFonts, robotoFonts]);
