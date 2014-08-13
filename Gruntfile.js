module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    config: {
      directories: {
        packages: 'packages',
        stage: 'dist',
        build: 'build',
        kangoscript: 'dist/src/common'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy HH:MM") %> */\n'
      },
      dist: {
        files: {
          'build/<%= pkg.name %>.content.min.js': ['build/<%= pkg.name %>.content.js'],
          'build/<%= pkg.name %>.background.min.js': ['build/<%= pkg.name %>.background.js']
        }
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js'],
      options: {
        globals: {
          console: true,
          module: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.directories.build %>',
          dest: '<%= config.directories.kangoscript %>/scripts',
          src: [
            'rose.content.min.js',
            'rose.background.min.js'
          ]
        }]
      }
    },
    browserify: {
      dist: {
        options: {
          require: [
            './bower_components/jquery/dist/jquery.min.js',
            './dependencies/jquery.patterns.shim.js',
            './bower_components/underscore/underscore.js',
            './bower_components/jsrsasign/jsrsasign-4.7.0-all-min.js'
          ],
          alias: [
            './bower_components/jquery/dist/jquery.min.js:jquery',
            './dependencies/jquery.patterns.shim.js:jquery-patterns',
            './bower_components/underscore/underscore.js:underscore',
            './bower_components/jsrsasign/jsrsasign-4.7.0-all-min.js:jsrsasign'
          ],
          shit: {}
        },
        files: {
          'build/<%= pkg.name %>.content.js': ['src/components/**/*.js', '!src/components/background/*.js', 'src/app-content.js'],
          'build/<%= pkg.name %>.background.js': ['src/components/**/*.js', '!src/components/content/*.js', 'src/app-background.js']
        }
      }
    },
    shell: {
      kango: {
        command: 'kango.py build --output-directory <%= config.directories.packages %> <%= config.directories.stage %>'
      }
    },
    emberTemplates: {
      options: {
        templateBasePath: /dist\/src\/common\/popup\/templates\//
      },
      dist: {
        options: {
          precompile: true
        },
        files: {
          "dist/src/common/popup/scripts/templates.js": "dist/src/common/popup/templates/**/*.hbs"
        }
      }
    },
    bowercopy: {
      options: {
        clean: false
      },
      main: {
        options: {
          destPrefix: "dist/src/common/popup/components"
        },
        files: {
          "normalize-css/normalize.css": "normalize-css/normalize.css",
          "semantic-ui/build/packaged/css/semantic.css": "semantic-ui/build/packaged/css/semantic.css",
          "jquery/jquery.js": "jquery/dist/jquery.js",
          "handlebars/handlebars.js": "handlebars/handlebars.js",
          "ember/ember.js": "ember/ember.js",
          "i18next/i18next.js": "i18next/i18next.js",
          "moment/moment.js": "moment/moment.js",
          "moment/lang/de.js": "moment/lang/de.js",
          "semantic-ui/build/packaged/javascript/semantic.js": "semantic-ui/build/packaged/javascript/semantic.js"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-ember-templates');
  grunt.loadNpmTasks('grunt-bowercopy');

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('default', ['jshint', 'emberTemplates:dist', 'bowercopy', 'browserify', 'uglify', 'copy', 'shell']);
};
