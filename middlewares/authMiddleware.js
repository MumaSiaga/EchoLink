module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  },

  redirectIfLoggedIn: function (req, res, next) {
    if (req.isAuthenticated()) return res.redirect('/chat');
    next();
  }
};