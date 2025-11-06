// middlewares/sessionMiddleware.js
import { UsersModel } from '../models/usersModel.js';

export const attachUser = async (req, res, next) => {
    try {
        if (req.session?.userId) {
            const user = await UsersModel.getById(req.session.userId);
            req.user = user; // עכשיו profilesController יכול להשתמש ב-req.user
        }
    } catch (err) {
        console.error('attachUser error', err);
    }
    next();
};
