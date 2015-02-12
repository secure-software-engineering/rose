var gulp = require('gulp');
var del = require('del');
var shell = require('gulp-shell');

var browserify = require("browserify");
var to5ify = require("6to5ify");
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var jeditor = require("gulp-json-editor");

function clone(a) {
   return JSON.parse(JSON.stringify(a));
}

var ENV = {
  app: './app',
  dist: './dist',
  tmp: './kango-runtime/src/common',
  kangocli: './kango/kango.py',
  manifest: './app/extension_info.json'
}

var manifest = require(ENV.manifest);

gulp.task('build:contentscript', function() {
  return browserify(manifest.content_scripts, { paths: [ ENV.app ]})
    .transform(to5ify)
    .bundle()
    .pipe(source('contentscript.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('build:backgroundscript', function() {
  return browserify(manifest.background_scripts, { paths: [ ENV.app ] })
    .transform(to5ify)
    .bundle()
    .pipe(source('backgroundscript.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('build:manifest', function() {
  gulp.src(ENV.app + '/extension_info.json')
    .pipe(jeditor(function(json) {
      json.content_scripts = ['contentscript.js'];
      json.background_scripts = ['backgroundscript.js'];
      return json;
    }))
    .pipe(gulp.dest(ENV.tmp));
});

gulp.task('copy:staticfiles', function() {
  gulp.src([
      './icons/**/*'
    ], { cwd: ENV.app, base: 'app'})
    .pipe(gulp.dest(ENV.tmp))
})

gulp.task('clean:dist', function(cb) {
  del([ENV.dist], cb);
})

gulp.task('clean:tmp', function(cb) {
  del([ENV.tmp], cb);
})

gulp.task('kango:build', shell.task([
  'python ' + ENV.kangocli + ' build kango-runtime --output-directory dist'
]))

gulp.task('build', [
  'build:backgroundscript',
  'build:contentscript',
  'build:manifest',
  'copy:staticfiles'
], function() {
  gulp.start('kango:build')
});

gulp.task('default', ['clean:dist', 'clean:tmp'], function() {
  gulp.start('build');
});
