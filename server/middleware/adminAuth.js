import userModel from '../models/usermodel.js';

// Admin authentication middleware
export const isAdmin = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        // Get user from database
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if user is admin with specific email
        if (user.role !== 'admin' || user.email !== 'admin@tracker.com') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        // Add user info to request
        req.admin = user;
        next();
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error during admin authentication' 
        });
    }
};

// Create admin user (for initial setup)
export const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and password are required' 
            });
        }

        // Only allow creating admin with specific email
        if (email !== 'admin@tracker.com') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only admin@tracker.com is allowed for admin access' 
            });
        }

        // Check if admin already exists
        const existingAdmin = await userModel.findOne({ email: 'admin@tracker.com' });
        if (existingAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Admin user already exists' 
            });
        }

        // Create admin user
        const admin = await userModel.create({
            name,
            email,
            password,
            role: 'admin'
        });

        res.status(201).json({ 
            success: true, 
            message: 'Admin user created successfully',
            data: { id: admin._id, name: admin.name, email: admin.email }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};
