// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '167042607230891', // your App ID
        'clientSecret'    : 'b4171ce558b2b05bdb9fbf41ff9a5bb5', // your App Secret
        'callbackURL'     : 'http://localhost:8080/auth/facebook/callback',
        'profileURL' : 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
        'profileFields'   : ['id', 'email', 'name'] // For requesting permissions from Facebook API

    },

    'twitterAuth' : {
        'consumerKey'        : 'your-consumer-key-here',
        'consumerSecret'     : 'your-client-secret-here',
        'callbackURL'        : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'         : '941727595819-l9tmp1eq8mn9m6c6m2g2q11udrg00maj.apps.googleusercontent.com',
        'clientSecret'     : 'xRJ_Tmjuu5DbHHVPidniHE4W',
        'callbackURL'      : 'http://localhost:8080/auth/google/callback'
    }

};
