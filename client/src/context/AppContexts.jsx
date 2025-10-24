import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContent = createContext()

export const AppContextProvider = (props)=>{
    axios.defaults.withCredentials = true;

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const[isLoggedin, setIsLoggedin] = useState(false)
    const[userData, setUserData] = useState(false)
    const[authChecked, setAuthChecked] = useState(false)

    const getAuthState = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/v1/auth/is-auth')
            if(data.success){
                setIsLoggedin(true)
                await getUserData()
            } else {
                setIsLoggedin(false)
            }
        } catch (error) {
            setIsLoggedin(false)
        } finally {
            setAuthChecked(true)
        }
    }

    const getUserData = async () => {
        try {
            const {data} = await axios.get(backendUrl+ '/api/v1/user/data') 
            data.success ? setUserData(data.userData): toast.error(data.message) 
        } catch (error) {
            toast.error(error.message)

    
        }

    }
    
    useEffect(()=>{
        getAuthState();
    },[])
    const value ={
        backendUrl,
        isLoggedin, setIsLoggedin,
        userData, setUserData,
        getUserData,
        authChecked

    }
    return(
        <AppContent.Provider value={value}>
            {props.children}
        </AppContent.Provider>
    )
}
    
