var gulp = require('gulp');
var browserify = require('gulp-browserify');
var shell = require('gulp-shell');
var uglify = require('gulp-uglify');

var del = require('del');
var runSequence = require('run-sequence');

gulp.task('clean', function() {
    del(['dist/src/common/**/*'], {
        force: "true"
    });
});

gulp.task('icons', function() {
    gulp.src('app/icons/*.png')
        .pipe(gulp.dest('dist/src/common/icons'));
});

gulp.task('kango-manifest', function() {
    gulp.src('app/extension_info.json')
        .pipe(gulp.dest('dist/src/common'));
});

gulp.task('kango-main', function() {
    gulp.src('app/main.js')
        .pipe(gulp.dest('dist/src/common'));
});

gulp.task('copy-res-folder', function() {
    gulp.src('app/res/**/*')
        .pipe(gulp.dest('dist/src/common/res'));
});

gulp.task('popup-build', shell.task([
    'ember build --output-path=../../dist/src/common/popup'
], {
    quiet: true,
    cwd: 'app/popup'
}));

gulp.task('kango-build', shell.task([
    'python kango/kango.py build --output-directory packages dist'
], {
    quiet: true
}));

gulp.task('scripts', function() {
    gulp.src('app/scripts/*.js')
        .pipe(browserify({
            insertGlobals: true
        }))
        .pipe(gulp.dest('dist/src/common/scripts'));
});

gulp.task('default', function() {
    runSequence(
        'clean', [
            'copy-res-folder',
            'icons',
            'kango-main',
            'kango-manifest',
            'popup-build',
            'scripts'
        ],
        'kango-build');
});
