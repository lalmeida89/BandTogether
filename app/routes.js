module.exports = function(app, passport) {
  var User       = require('../app/models/user');
  var Chat       = require('../app/models/chats');
// normal routes ===============================================================



    // PROFILE SECTION =========================
    app.get('/dashboard', isLoggedIn, function(req, res) {
      console.log(req.user);
      let arr = req.user.likes.concat(req.user.dislikes);
      arr.push(req.user.id);
      console.log(arr);
      User.find( { _id: { $nin: arr } } ).exec().then(x => {
        res.render('dashboard.ejs', {
            user : req.user,
            all  : x
        });
      }).catch(error => {throw error});
    });

    app.post('/dashboard', isLoggedIn, function(req, res) {
    //check for likes from another user
      User.findOne({_id:req.body.id}).exec().then(them => {
        if (them.likes.indexOf(req.user._id) != -1 && req.body.value == 'likes'){
          //match found
          let chat = new Chat();
          let a = { userId : req.user._id, userName : req.user.name};
          let b = { userId : them._id, userName : them.name}
          chat.users.push(a);
          chat.users.push(b);
          chat.save(function(err,room) {

            //once we find a match, create match id
            them.matches.push({userId:req.user._id, chatId: room._id, userName: req.user.name});
            req.user.matches.push({userId: req.body.id, chatId: room._id, userName: req.body.name});
            them.save();

            //saves likes and dislikes to logged in user
            req.user[req.body.value].push(req.body.id);
            req.user.save();
            res.json({match:req.body});
          });

        } else {
          //saves likes and dislikes to logged in user
          req.user[req.body.value].push(req.body.id);
          req.user.save();
          res.json({match: null});
        };
      });
    });


    app.get('/profile', isLoggedIn, function(req, res) {
      User.find().exec().then(x => {

        res.render('profile.ejs', {
            user : req.user,
            all  : x
        });
      })
    });

    app.get('/matches', isLoggedIn, function(req, res) {
      User.find().exec().then(x => {
        console.log(x.matches);

        res.render('matches.ejs', {
            user : req.user,
            all  : x
        });
      });
    });

    app.get('/chat/:chatId', isLoggedIn, function(req, res) {
      Chat.findOne({_id:req.params.chatId}, function(err, x) {
        res.render('chat.ejs', {
            user   : req.user,
            chats  : x.chats,
            users  : x.users
        });
      });
    });

    app.post('/chat/:chatId', isLoggedIn, function(req, res) {
      console.log('save-post');
      console.log(req.body);
      console.log(req.params);
      Chat.update(
        { _id: req.params.chatId },
        { $push: { chats: {message : req.body.chat, owner : req.user._id}}},
        function(r) {
          console.log('pineapple', r);
          res.redirect(`/chat/${req.params.chatId}`)
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/dashboard', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================


        // show the signup form
        app.get('/', function(req, res) {
            res.render('index.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/', passport.authenticate('local-signup', {
            successRedirect : '/intro', // redirect to the edit profile section
            failureRedirect : '/', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        app.post('/signup', passport.authenticate('local-signup', {
          successRedirect : '/intro', // redirect to the edit profile section
          failureRedirect : '/', // redirect back to the signup page if there is an error
          failureFlash : true // allow flash messages
        }));


        app.get('/intro', isLoggedIn, function(req,res) {
          res.render('intro.ejs');
        });

        app.get('/customize', isLoggedIn, function(req, res) {
          console.log(req.user);
            res.render('customize.ejs', {
              message: req.flash('signupMessage'),
              user : req.user
            });
        });

        app.post('/customize', isLoggedIn, function(req, res) {
            console.log(req.user, req.body);
            req.user.name = req.body.name;
            req.user.bio  = req.body.bio;
            req.user.genres = req.body.genres;
            req.user.youtube = getId(req.body.youtube);
            req.user.seeking = req.body.seeking;
            req.user.save(function(err) {
              res.redirect('/profile');
              console.log('im inside you');
            });

            //res.end();
        });

        function getId(url) {
          var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          var match = url.match(regExp);

          if (match && match[2].length == 11) {
            return match[2];
          } else {
            return 'PUZn1I6llJs';
          }
        }

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/customize',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

        // handle the callback after twitter has authenticated the user
        app.get('/auth/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

        // the callback after google has authenticated the user
        app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
