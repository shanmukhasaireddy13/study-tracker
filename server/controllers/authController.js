import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/usermodel.js';
// Google SSO via tokeninfo endpoint to avoid extra deps

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({ success: false, message: 'Missing Details' });
    }
    try {
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new userModel({ name, email, password:hashedPassword, role: 'user' });
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({ success: true, data: { id: user._id, role: user.role } });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: 'Email and password are required' });
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'Invalid email' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid password' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({ success: true, data: { id: user._id, role: user.role } });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        return res.json({ success: true, message: "Logged Out" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}
//sending verification otp to the user's email
export const isAuthenticated = async (req,res)=>{
    try {
        return res.json({success: true});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}
// removed OTP/email flows per assignment scope

export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ success: false, message: 'idToken required' });

        // Verify with Google tokeninfo
        const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (!resp.ok) return res.status(401).json({ success: false, message: 'Invalid Google token' });
        const payload = await resp.json();

        const aud = payload.aud;
        if (process.env.GOOGLE_CLIENT_ID && aud !== process.env.GOOGLE_CLIENT_ID) {
            return res.status(401).json({ success: false, message: 'Token audience mismatch' });
        }

        const email = payload.email;
        const name = payload.name || payload.given_name || 'Google User';
        if (!email) return res.status(400).json({ success: false, message: 'Email not present in token' });

        let user = await userModel.findOne({ email });
        if (!user) {
            // Create user with random password placeholder
            const randomPass = await bcrypt.hash(jwt.sign({ email, t: Date.now() }, process.env.JWT_SECRET || 'secret'), 10);
            user = await userModel.create({ name, email, password: randomPass, role: 'user' });
        } else if (!user.name && name) {
            user.name = name; await user.save();
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return res.json({ success: true, data: { id: user._id } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}



