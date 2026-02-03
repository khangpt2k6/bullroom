import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Middleware to verify Clerk JWT token and attach user info to request
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify the token with Clerk
      const session = await clerkClient.sessions.verifySession(
        token.split('_')[0], // session ID is before the underscore
        token
      );

      if (!session) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
        return;
      }

      // Get user info from Clerk
      const user = await clerkClient.users.getUser(session.userId);

      // Attach user info to request
      req.userId = user.id;
      req.userEmail = user.emailAddresses[0]?.emailAddress || '';

      next();
    } catch (clerkError: any) {
      console.error('Clerk verification error:', clerkError);
      res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
      return;
    }
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication verification failed'
    });
    return;
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work both authenticated and unauthenticated
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without auth
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const session = await clerkClient.sessions.verifySession(
        token.split('_')[0],
        token
      );

      if (session) {
        const user = await clerkClient.users.getUser(session.userId);
        req.userId = user.id;
        req.userEmail = user.emailAddresses[0]?.emailAddress || '';
      }
    } catch (clerkError) {
      // Token invalid, but that's okay for optional auth
      console.warn('Optional auth token invalid:', clerkError);
    }

    next();
  } catch (error) {
    // Error in optional auth should not block the request
    console.error('Optional auth error:', error);
    next();
  }
};
