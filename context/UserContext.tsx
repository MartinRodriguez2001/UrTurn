import { useContext, createContext, useState, Children } from "react";

interface AuthContextType {
    user: string | null;
    login: (username: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({Children}: {Children: React.ReactNode}) => {
    const [user, setUser] = useState<string | null>(null);
    const login = (username: string) => setUser(username);
    const logout = () => setUser(null);
    
    return (
        <AuthContext.Provider value={{user, login, logout}}>
            {Children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth tiene que ser usando con un AuthProvider");
    return context;
}

