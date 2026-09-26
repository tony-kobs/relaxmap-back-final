import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Location } from '../models/location.js';

export const getUserById = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('_id name avatar');
        
        if (!user) {
            throw createHttpError(404, 'User not found');
        }

        res.status(200).json({
            status: 200,
            message: 'Successfully found user',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            throw createHttpError(404, 'User not found');
        }

        res.status(200).json({
            status: 200,
            message: 'Successfully found current user',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateCurrentUser = async (req, res, next) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            throw createHttpError(404, 'User not found');
        }

        res.status(200).json({
            status: 200,
            message: 'Successfully updated user',
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

export const getUserLocations = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const locations = await Location.find({ userId });

        res.status(200).json({
            status: 200,
            message: 'Successfully found user locations',
            data: locations,
        });
    } catch (error) {
        next(error);
    }
};