module.exports = function(grunt) {
    var username = grunt.option('username') || '';
    var password = grunt.option('password') || '';
    var email = grunt.option('email') || '';
    grunt.registerTask('publish', 'Publish the latest version of this plugin', function() {
        var done = this.async(),
            npm = require('npm');
        npm.load({}, function(err) {
            npm.registry.adduser("http://registry.npmjs.org/", username, password, email, function(err) {
                if (err) {
                    console.log("addUser Error");
                    console.log(err);
                    done(false);
                } else {
                    console.log("user added");
                    npm.config.set("email", email, "user");
                    npm.commands.publish([], function(err) {
                        console.log(err || "Published to registry");
                        done(!err);
                    });
                }
            });
        });
    });
    grunt.registerTask('default', 'todo', function() {
        console.log('default called')
    });
}