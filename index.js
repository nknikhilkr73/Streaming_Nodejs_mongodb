
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const express = require('express');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));



app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);


app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb://127.0.0.1:27017/job", { useNewUrlParser: true });
mongoose.connect(
  "mongodb+srv://nknikhilkr73:lTimO8ISQVSlN4Jq@cluster0.zoeey6c.mongodb.net/job",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,

});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user.id);
  });
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error(err);
    done(err, null);
  }
});

const videoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  url: String,
});

const Video = mongoose.model('Video', videoSchema);

app.get("/", function (req, res) {
    res.render("home");
  });

  app.get("/register", function(req, res){
    res.render("signup")
  })

  app.get("/login", function(req, res){
    res.render("login")
  })


app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (req.body.username === "") {
        res.send(
          "<script>alert('Please Enter a Username'); window.location.href='/register';</script>"
        );
      } else if (req.body.password === "") {
        res.send(
          "<script>alert('Please enter the password'); window.location.href='/register';</script>"
        );
      } else if (err) {
        res.send(
          "<script>alert('Username already exists'); window.location.href='/register';</script>"
        );
      } else {
        passport.authenticate("local")(req, res, function () {
          console.log(res.status);
          res.redirect("/recording");
        });
      }
    }
  );
});


app.get("/videos",async function(req, res){
  try{
    console.log(req.user._id);
 const user= User.findById(req.user._id)
      if (user) {
        
        const videos = await Video.find({ user: req.user._id }).exec();
        videos.forEach(video => {
          console.log(video.url);
        });
        res.render("videos", { videos: videos });
      }
  }
  catch(err){
    res.redirect("/login")
  }
  
})

app.get("/recording", async function (req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      res.render("recording");
    }
    else{
      res.redirect("/login")
    }
  } catch (err) {
    
    res.redirect("/login")
  }
});
app.get("/logout", function (req, res) {
 
  res.redirect("/");
});


app.post("/login", async function (req, res) {
  try {
    const foundUser = await User.findOne({ username: req.body.username });
    const user = new User({
      username: req.body.username,
      password : req.body.password,
    });
  
    if (foundUser) {
      req.login(user, function (err) {  // Change 'user' to 'foundUser' here
        if (err) {
          
          res.send(
            "<script>alert('Wrong username or password'); window.location.href='/login';</script>"
          );
        } else {console.log("found");
          passport.authenticate("local")(req, res, function () {
            res.redirect("/recording");
          });
        }
      });
    } else {
      res.send(
        "<script>alert('This username is not registered'); window.location.href='/register';</script>"
      );
    }
  } catch (err) {
    console.log("error occurred");
    res.send(
      "<script>alert('Server Error'); window.location.href='/login';</script>"
    );
  }
});




app.post('/storeurl', async (req, res) => {

  const recordingUrl = req.body.recordingUrl;

  // Here, you would store the recordingUrl in your database

  const currentUser = req.user; 

  const newVideo = new Video({
    user: currentUser, // Reference to the user
    url: recordingUrl,
  });

  try {
    // Save the new video to the database
    const savedVideo = await newVideo.save();
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Error storing recording URL:', error);
    res.sendStatus(500);
  }
});


app.post('/submitting', (req, res) => {
  if(  req.isAuthenticated() === false) {
    res.sendStatus(400)
    
  }
  res.sendStatus(200); 
});




app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});

