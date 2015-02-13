var gulp = require('gulp');
var gulpFilter = require('gulp-filter');
var jeditor = require('gulp-json-editor');
var shell = require('gulp-shell');
var uglify = require('gulp-uglify');

var to5ify = require('6to5ify');
var browserify = require('browserify');
var del = require('del');
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
  var noBowerFiles = multimatch(manifest.content_scripts, ['*', '!app/bower_components']);

  return browserify(noBowerFiles, { paths: [ ENV.app ] })
    .add(require.resolve('6to5/polyfill'))
    .transform(to5ify)
    .bundle()
    .pipe(source('contentscript.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('build:backgroundscript', function() {
  var noBowerFiles = multimatch(manifest.background_scripts, ['*', '!app/bower_components']);

  return browserify(noBowerFiles, { paths: [ ENV.app ] })
    .add(require.resolve('6to5/polyfill'))
    .transform(to5ify)
    .bundle()
    .pipe(source('backgroundscript.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('build:manifest', function() {
  var contentscripts = manifest.content_scripts.filter(function (element) { return /bower_components/.test(element); });
  var backgroundscripts = manifest.background_scripts.filter(function (element) { return /bower_components/.test(element); });

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

gulp.task('copy:staticFiles', function() {
  return gulp.src([
      './icons/**/*'
    ], { cwd: ENV.app, base: ENV.app})
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('copy:bowerFiles', function() {
  var filter = gulpFilter(function(file) {
    return /bower_components/.test(file.path);
  });

  var allScripts = manifest.content_scripts.concat(manifest.background_scripts);

  return gulp.src(allScripts, { cwd: ENV.app, base: ENV.app })
    .pipe(filter)
    .pipe(uglify())
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('clean:dist', function(cb) {
  return del([ENV.dist], cb);
});

gulp.task('clean:tmp', function(cb) {
  return del([ENV.tmp], cb);
});

gulp.task('kango:build', shell.task([
  'python ' + ENV.kangocli + ' build kango-runtime --output-directory dist'
]));

gulp.task('build', [
  'build:backgroundscript',
  'build:contentscript',
  'build:manifest',
  'copy:bowerFiles',
  'copy:staticFiles'
], function() {
  gulp.start('kango:build');
});

gulp.task('default', ['clean:dist', 'clean:tmp'], function() {
  gulp.start('build');
});
