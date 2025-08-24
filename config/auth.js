const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
     
      try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
          const email =
          (profile.emails && profile.emails.length > 0 && profile.emails[0].value) ||
             profile._json.email ||
              null;
       
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: email,
            role: 'user' 
          });

          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user._id); 
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); 
  } catch (err) {
    done(err, null);
  }
});
