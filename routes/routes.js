module.exports = function(express, app, passport, config, rooms){
	var router = express.Router();

	router.get('/', function(req, res, next) {
		res.render('index');
	})

	function securePages(req, res, next) {
		if(req.isAuthenticated()){
			next();
		}else{
			res.redirect('/');
		}
	}


	router.get('/auth/facebook', passport.authenticate('facebook'));
	router.get('/auth/facebook/callback', passport.authenticate('facebook', {
		successRedirect:'/user',
		failureRedirect:'/'
	}))

  router.get('/auth/google', passport.authenticate('google',{scope : ['profile', 'email']}));
  router.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect:'/user/',
    failureRedirect:'/'
  }))
	
	router.get('/user',securePages ,function(req, res, next) {
		res.render('user', {title:'Dashboard', user:req.user,config:config});
	})


		var MongoClient = require('mongodb').MongoClient;
		var url = "mongodb://siddhant:harshsri@ds025973.mlab.com:25973/chatbox";

//Logout and Gethelp Page
	router.get('/user/gethelp',securePages ,function(req, res, next) {
		res.render('gethelp', {title:'Get Help', user:req.user,config:config,a:0});
	});

	router.get('/user/gethelp/room/:id', securePages , function(req, res, next) {
		var room_name = findTitle(req.params.id);
		res.render('room', {user:req.user, room_number:req.params.id, config:config, room_name:room_name})
	});

	router.get("/reqtran/:course",function(req, res, next) {
    res.render("page",{course:req.params.course});
  });

	function findTitle(room_id) {
		var n=0;
		while(n < rooms.length) {
			if (rooms[n].room_number == room_id) {
				return rooms[n].room_name;
				break;
			}
			else {
				n++;
				continue;
			}
		}
	}
	
	router.get('/logout', function (req, res, next) {
		req.logout();
		res.redirect('/');
	});

	app.use('/', router);
}