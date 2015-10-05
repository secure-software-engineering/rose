var gulp = require('gulp');
var changed = require('gulp-changed');
var connect = require('gulp-connect');
var gulpFilter = require('gulp-filter');
var jeditor = require('gulp-json-editor');
// var uglify = require('gulp-uglify');

var babelify = require('babelify');
var browserify = require('browserify');
var watchify = require('watchify');
var del = require('del');
var exec = require('child_process').exec;
var multimatch = require('multimatch');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

var ENV = {
  app: './app',
  dist: './dist',
  tmp: './kango-runtime/src/common',
  kangocli: './kango/kango.py',
  manifest: './app/extension_info.json'
};

var manifest = require(ENV.manifest);

gulp.task('build:contentscript', function() {
  var noBowerFiles = multimatch(manifest.content_scripts, ['**', '!bower_components/{,**/}*.*', '!res/{,**/}*.*', '!ui/{,**/}*.*']);

  return watchify(browserify(noBowerFiles, { paths: [ ENV.app ] }), watchify.args)
    .transform(babelify.configure({
        optional: ['es7.asyncFunctions']
      }))
    .bundle()
    .pipe(source('contentscript.js'))
    .pipe(buffer())
    // .pipe(uglify())
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('build:backgroundscript', function() {
  var noBowerFiles = multimatch(manifest.background_scripts, ['**', '!bower_components/{,**/}*.*', '!res/{,**/}*.*', '!ui/{,**/}*.*']);

  return watchify(browserify(noBowerFiles, { paths: [ ENV.app ] }), watchify.args)
    .transform(babelify.configure({
        optional: ['es7.asyncFunctions']
      }))
    .bundle()
    .pipe(source('backgroundscript.js'))
    .pipe(buffer())
    // .pipe(uglify())
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('build:manifest', function() {
  var contentscripts = manifest.content_scripts.filter(function (element) { return /bower_components|res\//.test(element); });
  var backgroundscripts = manifest.background_scripts.filter(function (element) { return /bower_components|res\//.test(element); });

  contentscripts.push('contentscript.js');
  backgroundscripts.push('backgroundscript.js');

  return gulp.src(ENV.app + '/extension_info.json')
    .pipe(jeditor(function(json) {
      json.content_scripts = contentscripts;
      json.background_scripts = backgroundscripts;
      return json;
    }))
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('build:survey', function() {

  return watchify(browserify('survey/survey.js', { paths: [ ENV.app ] }), watchify.args)
    .transform(babelify.configure({
        optional: ['es7.asyncFunctions']
      }))
    .bundle()
    .pipe(source('survey/survey.js'))
    .pipe(buffer())
    // .pipe(uglify())
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('copy:staticFiles', function() {
  return gulp.src([
      './icons/**/*',
      './res/**/*',
      './ui/**/*',
      './survey/**/*'
    ], { cwd: ENV.app, base: ENV.app})
    .pipe(changed(ENV.tmp))
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('copy:bowerFiles', function() {
  var filter = gulpFilter(function(file) {
    return /bower_components/.test(file.path);
  });

  var allScripts = manifest.content_scripts.concat(manifest.background_scripts);

  return gulp.src(allScripts, { cwd: ENV.app, base: ENV.app })
    .pipe(filter)
    .pipe(changed(ENV.tmp))
    // .pipe(uglify())
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('clean:dist', function(cb) {
  return del([ENV.dist], cb);
});

gulp.task('clean:tmp', function(cb) {
  return del([ENV.tmp], cb);
});

gulp.task('kango:build', [
  'build:backgroundscript',
  'build:contentscript',
  'build:manifest',
  'copy:bowerFiles',
  'copy:staticFiles'
], function(cb) {
  exec('python ' + ENV.kangocli + ' build kango-runtime --output-directory ' + ENV.dist, function(err) {
    cb(err);
  });
});

gulp.task('kango:chrome', [
  'build:backgroundscript',
  'build:contentscript',
  'build:manifest',
  'copy:bowerFiles',
  'copy:staticFiles'
], function(cb) {
  exec('python ' + ENV.kangocli + ' build kango-runtime --target chrome --no-pack --output-directory ' + ENV.dist, function(err) {
    cb(err);
  });
});

gulp.task('connect', function() {
  connect.server({
    root: ENV.app,
    livereload: true
  });
});

gulp.task('watch', function() {
  return gulp.watch(ENV.app + '/**/*', ['reload']);
});

gulp.task('reload', ['build:survey','kango:chrome'], function() {
  return gulp.src(ENV.app + '/**/*')
    .pipe(connect.reload());
});

gulp.task('build', ['clean:dist', 'clean:tmp', 'build:survey',], function() {
  gulp.start('kango:build');
});

gulp.task('default', ['clean:dist', 'clean:tmp', 'connect', 'build:survey',], function() {
  gulp.start('watch');
  gulp.start('kango:chrome');
});
