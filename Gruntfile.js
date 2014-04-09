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
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/**/*.js', '!src/app.js', 'src/app.js'],
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy HH:MM") %> */\n'
      },
      dist: {
        files: {
          'build/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
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
          dest: '<%= config.directories.kangoscript %>',
          src: [
            'rose.min.js'
          ]
        }]
      }
    },
    browserify: {
      dist: {
        files: {
          'build/<%= pkg.name %>.js': ['src/**/*.js', '!src/app.js', 'src/app.js']
        },
        options: {
          transform: ['debowerify']
        }
      }
    },
    shell: {
      kango: {
        command: 'kango.py build --output-directory <%= config.directories.packages %> <%= config.directories.stage %>'
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

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('default', ['jshint', 'browserify', 'uglify', 'copy', 'shell']);
};