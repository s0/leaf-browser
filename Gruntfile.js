module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

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
            all: {
                files: ['styles/**/*.less'],
                tasks: ['less', 'jshint'],
            }
        },
        jshint: {
          files: [
            'Gruntfile.js',
            'js/**/*.js',
            '!js/lib/**/*.js',
          ],
        },
    });

    grunt.registerTask('default', ['jshint', 'less', 'watch']);
};
