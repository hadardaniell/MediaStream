import bcrypt from 'bcrypt';
import { UsersModel } from '../models/usersModel.js';

export const listUsers = async (req, res) => {
    try { 
        const data = await UsersModel.getAll();
        res.json(data);
    } catch (e) { res.status(400).json({ error: e.message });}
};

export const getUser = async (req, res) => {
    const doc = await UsersModel.getById(req.params.id);
    if (!doc) return  res.status(404).json({ error: 'User not found' });
    res.json({ _id: doc._id, email: doc.email, name: doc.name, roles: doc.roles });
}

export const createUser = async (req, res) => {
    try {
        const { email, password, name = ' ', roles = 'user' } = req.body || {};
        const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
        const user = await UsersModel.create({email, passwordHash, name, roles});
        res.status(201).json({ _id: user._id, email: user.email, name: user.name, roles: user.roles });
    } catch (e) { res.status(400).json({ error: e.message });}
};

export const updateUser = async (req, res) => {
    try {
        const patch = { ...req.body };
        if (req.user.roles !== 'admin') delete patch.roles;
        if (patch.password) {
            patch.passwordHash = await bcrypt.hash(patch.password, 10);
            delete patch.password;
        }
        const updated = await UsersModel.updateById(req.params.id, patch);
        if (!updated) return res.status(404).json({ error: 'User not found' });
        res.json({ _id: updated._id, email: updated.email, name: updated.name, roles: updated.roles });
    } catch (e) { res.status(400).json({ error: e.message });}
};

export const deleteUser = async (req, res)  => {
    const ok = await UsersModel.deleteById(req.params.id);
    if (!ok) return res.status(404).json({ error: 'User not found' });
    res.json({ deleted: true, id: req.params.id });
};