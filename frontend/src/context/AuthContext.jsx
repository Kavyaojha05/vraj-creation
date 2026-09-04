import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // INITIAL AUTH CHECK & PROFILE FETCH
  // =====================================================
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      let parsedUser = null;

      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);
          if (parsedUser) {
            setUser(parsedUser);
          }
        } catch (error) {
          console.error("Local storage user parse error:", error);
        }
      }

      try {
        const response = await api.get("/auth/profile");

        if (response?.data) {
          const profileUser = response.data;
          const updatedUser = {
            ...(parsedUser || {}),
            ...(profileUser || {}),
          };

          if (!profileUser.name && parsedUser?.name) {
            updatedUser.name = parsedUser.name;
          }
          if (!profileUser.username && parsedUser?.username) {
            updatedUser.username = parsedUser.username;
          }
          if (!profileUser.email && parsedUser?.email) {
            updatedUser.email = parsedUser.email;
          }

          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error("Profile sync failed:", error);

        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // =====================================================
  // REGISTER (FIXED: NO AUTO-LOGIN, PENDING APPROVAL ONLY)
  // =====================================================
  const register = async (name, email, password) => {
    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      const data = response?.data || {};

      // NOTE: Naye user ko register hone par token aur login state nahi deni hai,
      // kyunki uska account 'pending' state me hai aur admin approval zaroori hai.

      return {
        success: true,
        message:
          data.message ||
          "Registration successful! Admin approval ke baad aap login kar sakenge.",
      };
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      return {
        success: false,
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Registration failed.",
      };
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================
  const login = async (email, password) => {
    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const data = response?.data || {};

      const token =
        data.token ||
        data.accessToken ||
        data.data?.token;

      const loggedInUser =
        data.user ||
        data.data?.user;

      if (!token) {
        return {
          success: false,
          message:
            data.message ||
            data.error ||
            "Token missing in backend response.",
        };
      }

      if (!loggedInUser) {
        return {
          success: false,
          message:
            "User information missing in backend response.",
        };
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);

      return {
        success: true,
        user: loggedInUser,
        token,
        message: data.message || "Login successful.",
      };
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      return {
        success: false,
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Login failed. Please check your credentials.",
      };
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // =====================================================
  // AUTH CONTEXT VALUE
  // =====================================================
  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// =====================================================
// USE AUTH
// =====================================================
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

export default AuthContext;