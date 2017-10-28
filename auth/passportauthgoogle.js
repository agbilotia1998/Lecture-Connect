module.exports =  function(passport, GoogleStrategy, config, mongoose,userModel) {
  
  GoogleStrategy = new GoogleStrategy({
    clientID:config.googleAuth.clientID,
    clientSecret:config.googleAuth.clientSecret,
    callbackURL:config.googleAuth.callbackURL,
    profileFields:['id', 'displayName','photos']
  }, function(accessToken, refreshToken, profile, done) {
    
    userModel.findOne({'profileID':profile.id}, function(err, result) {
      if(result){
        done(null, result);
      } else {
        var newUser = new userModel({
          profileID:profile.id,
          fullname:profile.displayName,
          profilePic:profile.photos[0].value || ''
        });
        newUser.save(function(err){
          done(null, newUser);
        })
      }
    })
  });
  
  var HttpsProxyAgent = require('https-proxy-agent');
  if (process.env['https_proxy']) {
    var httpsProxyAgent = new HttpsProxyAgent(process.env['https_proxy']);
    GoogleStrategy._oauth2.setAgent(httpsProxyAgent);
  }
  
  passport.use(GoogleStrategy);
};