module.exports =  function(passport, FBStrategy, config, mongoose) {
	
	var user = new mongoose.Schema({
		profileID:String,
		fullname:String,
		profilePic:String
	})

	var userModel = mongoose.model('user', user);

	passport.serializeUser(function(user, done){
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		userModel.findById(id, function(err, user) {
			done(err, user);
		})
	});
  
  FBStrategy = new FBStrategy({
    clientID:config.fb.appID,
    clientSecret:config.fb.appSecret,
    callbackURL:config.fb.callbackURL,
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
  })
	
  var HttpsProxyAgent = require('https-proxy-agent');
  if (process.env['https_proxy']) {
    var httpsProxyAgent = new HttpsProxyAgent(process.env['https_proxy']);
    FBStrategy._oauth2.setAgent(httpsProxyAgent);
  }

	passport.use(FBStrategy);
}