import type { User } from "@/types/user";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import jwtAxios, { setAuthToken, setRefreshToken } from ".";
import storageService from "../storageService";
interface JWTAuthAuthProviderProps {
  children: ReactNode;
}
interface SignInProps {
  phoneNumber: string;
  password: string;
}
interface JWTAuthActionsProps {
  signInUser: (data: SignInProps) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<boolean>;
}

export interface JWTAuthContextProps {
  user: User | null | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
}
const JWTAuthContext = createContext<JWTAuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
});
const JWTAuthActionsContext = createContext<JWTAuthActionsProps>({
  signInUser: async () => {},
  logout: () => {},
  refreshUser: () => Promise.resolve(),
  requestPasswordReset: () => Promise.resolve(false),
  resetPassword: () => Promise.resolve(false),
});
// Custom hooks to access auth contexts
export const useJWTAuth = () => useContext(JWTAuthContext);

export const useJWTAuthActions = () => useContext(JWTAuthActionsContext);

const JWTAuthProvider = ({ children }: JWTAuthAuthProviderProps) => {
  const [jwtAuthData, setJwtAuthData] = useState<JWTAuthContextProps>({
    user: undefined,
    isAuthenticated: false,
    isLoading: false,
  });
  useEffect(() => {
    const getAuthUser = async () => {
      setJwtAuthData((prevState) => ({
        ...prevState,
        isLoading: true,
      }));

      try {
        const [token, storedUser] = await Promise.all([
          storageService.getToken(),
          storageService.getUser(),
        ]);

        if (storedUser) {
          setJwtAuthData((prevState) => ({
            ...prevState,
            user: storedUser,
            isAuthenticated: true,
            isLoading: true,
          }));
        }

        if (!token) {
          setJwtAuthData((prevState) => ({
            ...prevState,
            user: storedUser ?? undefined,
            isAuthenticated: Boolean(storedUser),
            isLoading: false,
          }));
          return;
        }

        setAuthToken(token);
        const { data } = await jwtAxios.get("/auth/current-user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        await storageService.setUser(data);
        setJwtAuthData({
          user: data,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to initialize auth user:", error);
        setJwtAuthData({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    getAuthUser();
  }, []);

  const signInUser = async ({ phoneNumber, password }: SignInProps) => {
    try {
      const { data } = await jwtAxios.post("/auth/login", {
        phoneNumber,
        password,
      });
      const { metadata } = data;
      // Store authentication tokens
      await setAuthToken(metadata.accessToken);
      await setRefreshToken(metadata.refreshToken);

      // Update authentication state
      setJwtAuthData({
        user: metadata.user,
        isAuthenticated: true,
        isLoading: false,
      });
      // Persist user
      await storageService.setUser(metadata.user);
    } catch (error) {
      console.error("Login error in provider:", error);
      setJwtAuthData({
        ...jwtAuthData,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error; // Re-throw to let the component handle the error UI
    }
  };
  const logout = async () => {
    await setAuthToken();
    await setRefreshToken();
    await storageService.clearAll();
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

  const refreshUser = async () => {
    try {
      const token = await storageService.getToken();
      if (!token) return;

      setAuthToken(token);
      const { data } = await jwtAxios.get("/auth/current-user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setJwtAuthData((prevState) => ({
        ...prevState,
        user: data,
      }));

      // Update cached user in storage
      await storageService.setUser(data);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  return (
    <JWTAuthContext.Provider value={{ ...jwtAuthData }}>
      <JWTAuthActionsContext.Provider
        value={{
          signInUser,
          logout,
          refreshUser,
          requestPasswordReset,
          resetPassword,
        }}
      >
        {children}
      </JWTAuthActionsContext.Provider>
    </JWTAuthContext.Provider>
  );
};

export default JWTAuthProvider;
