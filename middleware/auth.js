function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.redirect('/admin/login');
}

// Makes admin login state available to all EJS views without passing manually each time
function exposeAdminState(req, res, next) {
  res.locals.isAdmin = !!(req.session && req.session.adminId);
  next();
}

module.exports = { requireAdmin, exposeAdminState };
