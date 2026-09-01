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

      // Fast UI render using saved user
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Local storage user parse error", e);
        }
      }

      // Sync with backend profile endpoint
      try {
        const response = await api.get("/auth/profile");
        if (response?.data) {
          setUser(response.data);
          localStorage.setItem("user", JSON.stringify(response.data));
        }
      } catch (error) {
        console.error("Profile sync failed:", error);
        // Token expired/invalid handling
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
  // REGISTER METHOD
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
      const token = data.token || data.accessToken;
      const loggedInUser = data.user;

      if (token && loggedInUser) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setUser(loggedInUser);
      }

      return {
        success: true,
        message: data.message || "Registration successful.",
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
  // LOGIN METHOD
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
  // LOGOUT METHOD
  // =====================================================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

export default AuthContext;