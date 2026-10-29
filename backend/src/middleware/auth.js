import dotenv from 'dotenv';
dotenv.config();

const ADMIN_SECRET = process.env.ADMIN_API_KEY || 'admin-secret-codequest-2026';

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'];

  // Accept either x-admin-key header or Bearer admin token
  if (adminKey === ADMIN_SECRET) {
    req.user = { role: 'admin', name: 'Admin User' };
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === ADMIN_SECRET || token === 'admin-jwt-token') {
      req.user = { role: 'admin', name: 'Admin User' };
      return next();
    }
  }

  return res.status(403).json({
    error: 'Access denied. Administrator privileges required.'
  });
}
