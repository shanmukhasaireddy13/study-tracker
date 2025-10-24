import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import userModel from './models/usermodel.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await userModel.findOne({ email: 'admin@tracker.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new userModel({
            name: 'Admin',
            email: 'admin@tracker.com',
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log('Email: admin@tracker.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

createAdmin();
