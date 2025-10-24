import jwt from "jsonwebtoken";
import userModel from "../models/usermodel.js";

const userAuth = async( req, res, next)=>{
    const {token} = req.cookies;
    
    if(!token){
        return res.json({sucess: false, message: 'Not Authorized. Login Again'})

    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if(tokenDecode.id){
            req.body.userId = tokenDecode.id
            // Always fetch latest role from DB to reflect promotions without re-login
            const user = await userModel.findById(tokenDecode.id).select('role');
            req.user = { id: tokenDecode.id, role: user?.role || 'user' }
        }
        else{
            return res.json({sucess: false, message: 'Not Authorized. Login Again'})
        }
        next();
        
    } catch (error) {
        return res.json({sucess: false, message: error.message})

    }
}
export default userAuth;