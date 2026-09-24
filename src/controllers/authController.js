import { isValidObjectId } from 'mongoose';
import { Session } from '../models/session.js';
import { clearSessionCookies } from '../services/auth.js';
import { notImplemented } from '../utils/notImplemented.js';

export const registerUser = notImplemented;
export const loginUser = notImplemented;

export const logoutUser = async (req, res) => {
    const { sessionId } = req.cookies ?? {};
    
    if (sessionId && isValidObjectId(sessionId)) {
        await Session.findByIdAndDelete(sessionId);
    }

    clearSessionCookies(res);
    res.status(204).end();
};

export const refreshUserSession = notImplemented;
export const getSession = notImplemented;
export const requestResetEmail = notImplemented;
export const resetPassword = notImplemented;
