import JWTAuthProvider from "@/services/jwt-auth/JWTAuthProvider";

const AppAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <JWTAuthProvider>{children}</JWTAuthProvider>;
};

export default AppAuthProvider;
