var gulp = require('gulp')
var ava = require('gulp-ava')
var gutil = require('gulp-util')
var eslint = require('gulp-eslint')
var plumber = require('gulp-plumber')

var exec = require('child_process').exec
var notifier = require('node-notifier')
var runSequence = require('run-sequence')
var del = require('del')
var livereload = require('gulp-livereload')
var named = require('vinyl-named')
var webpack = require('webpack')
var webpackStream = require('webpack-stream')
var webpackConfig = require('./webpack.config.js')

var config = {
    production: !!gutil.env.production || !!gutil.env.prod,
    packagingDir: 'dist',
    stagingDir: 'kango-runtime/src/common'
}

if (config.production) {
    webpackConfig.plugins.push(new webpack.optimize.DedupePlugin())
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin())
} else {
    webpackConfig.devtool = 'inline-source-map'
    webpackConfig.debug = true
}

gulp.task('clean', function () {
    return del(['dist', 'kango-runtime/src/common/**/*'])
})

gulp.task('lint', function () {
    return gulp.src(['app/**/*.js', '!app/ui/**/*', '!app/res/**/*'])
        .pipe(eslint())
        .pipe(eslint.format())
})

gulp.task('test', function () {
    return gulp.src('tests/**/*.spec.js')
        .pipe(ava())
})

gulp.task('copy', function () {
    return gulp.src([
        'app/icons/**/*',
        'app/res/**/*',
        'app/ui/**/*',
        'app/extension_info.json'
    ], { base: 'app' })
        .pipe(gulp.dest(config.stagingDir))
})

gulp.task('kango-build', function (cb) {
    var command = 'python kango/kango.py build --output-directory ' + config.packagingDir + ' kango-runtime'
    exec(command, function () {
        cb()
    })
})

gulp.task('background-script', function () {
    return gulp.src('app/background_app.js')
        .pipe(plumber())
        .pipe(named())
        .pipe(webpackStream(webpackConfig))
        .pipe(gulp.dest(config.stagingDir))
})

gulp.task('content-script', function () {
    return gulp.src('app/content_app.js')
        .pipe(plumber())
        .pipe(named())
        .pipe(webpackStream(webpackConfig))
        .pipe(gulp.dest(config.stagingDir))
})

gulp.task('notify', function () {
    notifier.notify({
        title: 'Gulp notification',
        message: 'Build successful!'
    })
})

gulp.task('livereload', function () {
    livereload.reload()
})

gulp.task('build', function (callback) {
    runSequence(
        'clean',
        'lint',
        ['copy', 'background-script', 'content-script'],
        'kango-build',
        ['notify', 'livereload'],
        callback
    )
})

gulp.task('watch', ['build'], function () {
    livereload.listen()
    gulp.watch('app/**/*', ['test', 'build'])
    gulp.watch('tests/**/*', ['test'])
})

gulp.task('default', ['build'])
