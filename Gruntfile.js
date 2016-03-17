module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-zip');

    grunt.initConfig({
        less: {
            dev: {
                options: {
                    sourceMap: true,
                    sourceMapFilename: 'styles/css/style.css.map'
                },
                files: {
                    'styles/css/style.css': 'styles/less/main.less'
                }
            }
        },
        watch: {
            less: {
                files: ['styles/**/*.less'],
                tasks: ['less'],
            },
            js: {
                files: ['js/**/*.js'],
                tasks: ['jshint'],
            }
        },
        jshint: {
          files: [
            'Gruntfile.js',
            'js/**/*.js',
            '!js/lib/**/*.js',
          ],
        },
        zip: {
          'dist.zip': [
            'fonts/**/*',
            'images/**/*',
            'js/**/*',
            'styles/css/**/*',
            'background.js',
            'index.html',
            'manifest.json']
        }
    });

    grunt.registerTask('default', ['less', 'jshint']);
    grunt.registerTask('dist', ['default', 'zip']);
};
