import bcrypt from 'bcrypt';
import { isValidObjectId } from 'mongoose';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';
import { setSessionCookies, clearSessionCookies } from '../services/auth.js'; 
import { notImplemented } from '../utils/notImplemented.js';
import crypto from 'node:crypto';

export const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        res.status(201).json({
            status: 201,
            message: 'Successfully registered a user!',
            data: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

       


        const accessToken = crypto.randomBytes(30).toString('hex');
        const refreshToken = crypto.randomBytes(30).toString('hex');
        const accessTokenValidUntil = new Date(Date.now() + 15 * 60 * 1000); 
        const refreshTokenValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 


        const session = await Session.create({
            userId: user._id,
            accessToken,
            refreshToken,
            accessTokenValidUntil,
            refreshTokenValidUntil,
        });

    
        setSessionCookies(res, session);

        res.status(200).json({
            status: 200,
            message: 'Successfully logged in!',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

export const logoutUser = async (req, res) => {
    const { sessionId } = req.cookies ?? {};
    
    if (sessionId && isValidObjectId(sessionId)) {
        await Session.findByIdAndDelete(sessionId);
    }

    clearSessionCookies(res);
    res.status(204).end();
};

export const getSession = async (req, res, next) => {
    try {
        const { sessionId } = req.cookies;
        if (!sessionId) {
            return res.status(401).json({ message: 'No session ID provided' });
        }

        const session = await Session.findById(sessionId);
        if (!session || new Date() > new Date(session.refreshTokenValidUntil)) {
            return res.status(401).json({ message: 'Session expired or invalid' });
        }

        const user = await User.findById(session.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        res.status(200).json({
            status: 200,
            message: 'Successfully retrieved session',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const refreshUserSession = async (req, res, next) => {
    try {
        const { sessionId, refreshToken } = req.cookies;
        if (!sessionId || !refreshToken) {
            return res.status(401).json({ message: 'Session or token missing' });
        }

        const session = await Session.findOne({ _id: sessionId, refreshToken });
        if (!session || new Date() > new Date(session.refreshTokenValidUntil)) {
            return res.status(401).json({ message: 'Session expired' });
        }

        await Session.findByIdAndDelete(sessionId);

        res.status(200).json({
            status: 200,
            message: 'Successfully refreshed session',
        });
    } catch (error) {
        next(error);
    }
};

export const requestResetEmail = notImplemented;
export const resetPassword = notImplemented;