import bcrypt from 'bcrypt';
import { UsersModel } from '../models/usersModel.js';

const SALT_ROUNDS = 10;

export const register = async (req, res) => {
    try {
        const { email, password, name = ' ' } = req.body || {};
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });
        
        const existing = await UsersModel.getByEmail(email);
        if (existing)
            return res.status(409).json({ error: 'Email already in use' });

        const passowrdHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await UsersModel.create({
            email: String(email).trim().toLowerCase(),
            passwordHash,
            roles: 'user',
            name
        });

        req.session.userId = String(user._id);
        req.session.role = user.role;
        res.status(201).json({_id: user._id, email: user.email, name: user.name, roles: user.roles, name:user.name }); }
    catch (e) {res.status(400).json({ error: e.message });}
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });

        const user = await UsersModel.getByEmail(email);
        if (!user?.passwordHash) return res.status(401).json({ error: 'Invalid email or password' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

        req.session.userId = String(user._id);
        req.session.role = user.roles;
        res.json({_id: user._id, email: user.email, roles: user.roles, name:user.name }); }
    catch (e) {res.status(400).json({ error: e.message });}
};

export const logout = (req, res) => {
    req.session.destroy(() => res.json({ ok : true }));
};

export const me = (req, res) => {
    if (!req.user) return res.status(200).json(null);
    const { _id, email, roles, name } = req.user;
    res.json({ _id, email, roles, name });
};