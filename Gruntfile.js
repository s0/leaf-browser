module.exports = function(grunt) {
    'use strict';

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
                tasks: ['less'],
            }
        }
    });

    grunt.registerTask('default', ['less', 'watch']);
};
