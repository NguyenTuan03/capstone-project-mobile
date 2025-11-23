import JWTAuthProvider from "@/services/jwt-auth/JWTAuthProvider";
import { SocketProvider } from "../SocketContext";

const AppAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <JWTAuthProvider>
      <SocketProvider>{children}</SocketProvider>
    </JWTAuthProvider>
  );
};

export default AppAuthProvider;
