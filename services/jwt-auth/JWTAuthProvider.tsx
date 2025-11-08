import { UserType } from "@/types/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import jwtAxios, { setAuthToken, setRefreshToken } from ".";
interface JWTAuthAuthProviderProps {
  children: ReactNode;
}
interface SignInProps {
  email: string;
  password: string;
}
interface JWTAuthActionsProps {
  signInUser: (data: SignInProps) => void;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<boolean>;
}

interface JWTAuthContextProps {
  user: UserType | null | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
}
const JWTAuthContext = createContext<JWTAuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
});
const JWTAuthActionsContext = createContext<JWTAuthActionsProps>({
  signInUser: () => {},
  logout: () => {},
  requestPasswordReset: () => Promise.resolve(false),
  resetPassword: () => Promise.resolve(false),
});
// Custom hooks to access auth contexts
export const useJWTAuth = () => useContext(JWTAuthContext);

export const useJWTAuthActions = () => useContext(JWTAuthActionsContext);

const JWTAuthProvider = ({ children }: JWTAuthAuthProviderProps) => {
  const [jwtAuthData, setJwtAuthData] = useState<JWTAuthContextProps>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
  useEffect(() => {
    const getAuthUser = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setJwtAuthData({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }
      setAuthToken(token);
      try {
        const { data } = await jwtAxios.get("/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setJwtAuthData({
          user: data,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        setJwtAuthData({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    getAuthUser();
  }, []);

  const signInUser = async ({ email, password }: SignInProps) => {
    try {
      const { data } = await jwtAxios.post("auth/login", {
        email,
        password,
      });
      const { metadata } = data;
      // Store authentication tokens
      setAuthToken(metadata.accessToken);
      setRefreshToken(metadata.refresh_token);

      // Update authentication state
      setJwtAuthData({
        user: metadata.user,
        isAuthenticated: true,
        isLoading: false,
      });
      // Persist user per remember option
      try {
        AsyncStorage.setItem("user", JSON.stringify(metadata.user));
      } catch {}
    } catch {
      setJwtAuthData({
        ...jwtAuthData,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };
  const logout = async () => {
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("refreshToken");
    await AsyncStorage.removeItem("user");
    setJwtAuthData({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await jwtAxios.post("auth/request-password-reset", {
        email,
      });
      return true;
    } catch {
      return false;
    }
  };
  const resetPassword = async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      await jwtAxios.post("auth/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });
      return true;
    } catch {
      return false;
    }
  };
  return (
    <JWTAuthContext.Provider value={{ ...jwtAuthData }}>
      <JWTAuthActionsContext.Provider
        value={{ signInUser, logout, requestPasswordReset, resetPassword }}
      >
        {children}
      </JWTAuthActionsContext.Provider>
    </JWTAuthContext.Provider>
  );
};

export default JWTAuthProvider;
