import userModel from "../models/usermodel.js";

export const getUserData = async (req,res)=>{
    try {
        const user = await userModel.findById(req.user.id);
        if(!user){
            return res.json({success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            userData:{
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

        
    } catch (error) {
        res.json({success: false, message: error.message });
        
    }
} 