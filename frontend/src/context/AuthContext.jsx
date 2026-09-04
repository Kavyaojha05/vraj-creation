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

<<<<<<< HEAD
      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);
=======
      // Restore user immediately from localStorage
      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
          if (parsedUser) {
            setUser(parsedUser);
          }
        } catch (error) {
          console.error("Local storage user parse error:", error);
        }
      }

<<<<<<< HEAD
=======
      // =================================================
      // SYNC USER WITH BACKEND
      // =================================================
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      try {
        const response = await api.get("/auth/profile");

        if (response?.data) {
          const profileUser = response.data;
<<<<<<< HEAD
=======

          // IMPORTANT:
          // Keep saved user information such as name
          // if backend profile doesn't return it.
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
          const updatedUser = {
            ...(parsedUser || {}),
            ...(profileUser || {}),
          };

<<<<<<< HEAD
          if (!profileUser.name && parsedUser?.name) {
            updatedUser.name = parsedUser.name;
          }
          if (!profileUser.username && parsedUser?.username) {
            updatedUser.username = parsedUser.username;
          }
          if (!profileUser.email && parsedUser?.email) {
=======
          // If backend doesn't return name,
          // keep the name from localStorage.
          if (
            !profileUser.name &&
            parsedUser?.name
          ) {
            updatedUser.name = parsedUser.name;
          }

          // Same for username
          if (
            !profileUser.username &&
            parsedUser?.username
          ) {
            updatedUser.username = parsedUser.username;
          }

          // Same for email
          if (
            !profileUser.email &&
            parsedUser?.email
          ) {
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
            updatedUser.email = parsedUser.email;
          }

          setUser(updatedUser);
<<<<<<< HEAD
          localStorage.setItem("user", JSON.stringify(updatedUser));
=======

          localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
          );
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
        }
      } catch (error) {
        console.error("Profile sync failed:", error);

<<<<<<< HEAD
=======
        // Token expired / invalid
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
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
<<<<<<< HEAD
  // REGISTER (FIXED: NO AUTO-LOGIN, PENDING APPROVAL ONLY)
=======
  // REGISTER
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
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

<<<<<<< HEAD
      // NOTE: Naye user ko register hone par token aur login state nahi deni hai,
      // kyunki uska account 'pending' state me hai aur admin approval zaroori hai.
=======
      const token =
        data.token ||
        data.accessToken ||
        data.data?.token;

      const loggedInUser =
        data.user ||
        data.data?.user;

      if (token && loggedInUser) {
        localStorage.setItem("token", token);
        localStorage.setItem(
          "user",
          JSON.stringify(loggedInUser)
        );

        setUser(loggedInUser);
      }
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7

      return {
        success: true,
        message:
          data.message ||
<<<<<<< HEAD
          "Registration successful! Admin approval ke baad aap login kar sakenge.",
=======
          "Registration successful.",
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
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

<<<<<<< HEAD
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
=======
      // Save token
      localStorage.setItem("token", token);

      // Save complete user
      localStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      // Update state
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      setUser(loggedInUser);

      return {
        success: true,
        user: loggedInUser,
        token,
<<<<<<< HEAD
        message: data.message || "Login successful.",
=======
        message:
          data.message ||
          "Login successful.",
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
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
<<<<<<< HEAD
=======

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
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