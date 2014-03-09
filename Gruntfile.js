var exec = require('child_process').exec;

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        browserify: {
            options: {
                debug: true,
                aliasMappings: {
                    cwd: 'src',
                    src: ['**/*.js']
                }
            },
            dist: {
                files: {
                    'lib/main.js': ['src/canvas-x.js']
                }
            }
        },
        traceur: {
            options: {
                // traceur options here
            },
            custom: {
                files:{
                    'lib/main.js': ['src/canvas-x.js']
                }
            },
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'lib/main.js',
                dest: 'lib/main.min.js'
            }
        },

        watch: {
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['default']
            }
        }
    });

    //grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-traceur');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('test', 'Run Mocha tests', function (testname) {
        var done = this.async();
        var grep = '';
        if (testname) {
            grep = ' --grep ' + testname.replace(' ', '\\ ');
        }
        exec('find test -name "*.js" | xargs ./node_modules/mocha/bin/mocha' + grep, function (error, stdout, stderr) {
            if (error) {
                return done(error);
            }
            done( grunt.log.write(stdout) );
        });
    });
    grunt.registerTask('default', function () {
        var done = this.async();
        exec('traceur --out lib/main.js src/canvas-x.js', function (error, stdout, stderr) {
            if (error) {
                return done(error);
            }
            done( grunt.log.write(stdout) );
        });
    });
    grunt.registerTask('production', ['traceur', 'uglify']);
};
