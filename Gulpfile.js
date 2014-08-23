var gulp = require('gulp');
var browserify = require('gulp-browserify');
var jshint = require('gulp-jshint');
var shell = require('gulp-shell');
var uglify = require('gulp-uglify');

var del = require('del');
var runSequence = require('run-sequence');

var paths = {
    scripts: [
        'app/libs/**/*.js',
        'app/scripts/**/*.js',
        'app/main.js'
    ],
    icons: [
        'app/icons/*.png'
    ]
};

gulp.task('clean', function() {
    del(['kango_workspace/src/common/**/*'], {
        force: "true"
    });
});

gulp.task('jshint', function() {
    return gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('icons', function() {
    gulp.src('app/icons/*.png')
        .pipe(gulp.dest('kango_workspace/src/common/icons'));
});

gulp.task('kango-manifest', function() {
    gulp.src('app/extension_info.json')
        .pipe(gulp.dest('kango_workspace/src/common'));
});

gulp.task('kango-main', function() {
    gulp.src('app/main.js')
        .pipe(gulp.dest('kango_workspace/src/common'));
});

gulp.task('copy-res-folder', function() {
    gulp.src('app/res/**/*')
        .pipe(gulp.dest('kango_workspace/src/common/res'));
});

gulp.task('popup-build', shell.task([
    'ember build --output-path=../../kango_workspace/src/common/popup'
], {
    quiet: true,
    cwd: 'app/popup'
}));

gulp.task('kango-build', shell.task([
    'python kango/kango.py build --output-directory packages kango_workspace'
], {
    quiet: true
}));

gulp.task('scripts', function() {
    gulp.src('app/scripts/*.js')
        .pipe(browserify({
            insertGlobals: true
        }))
        .pipe(gulp.dest('kango_workspace/src/common/scripts'));
});

gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('default', function() {
    runSequence(
        [
            'clean',
            'jshint'
        ], [
            'copy-res-folder',
            'icons',
            'kango-main',
            'kango-manifest',
            'popup-build',
            'scripts'
        ],
        'kango-build');
});
