import { createContext, useContext, useState, ReactNode } from "react";
import { type Cargo, PERMISSOES_POR_CARGO } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo: Cargo;
}

interface AuthContextType {
  usuario: Usuario | null;
  login: (email: string, senha: string, cargo: Cargo) => Promise<void>;
  logout: () => void;
  temPermissao: (modulo: keyof typeof PERMISSOES_POR_CARGO.PASTOR, nivel?: "total" | "leitura") => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const stored = localStorage.getItem("usuario_ipb");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, senha: string, cargo: Cargo) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        senha,
        cargo,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao fazer login");
      }

      const user: Usuario = await response.json();
      setUsuario(user);
      localStorage.setItem("usuario_ipb", JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem("usuario_ipb");
  };

  const temPermissao = (modulo: keyof typeof PERMISSOES_POR_CARGO.PASTOR, nivel: "total" | "leitura" = "leitura") => {
    if (!usuario) return false;
    const permissaoModulo = PERMISSOES_POR_CARGO[usuario.cargo][modulo];
    if (permissaoModulo === "nenhum") return false;
    if (nivel === "total") return permissaoModulo === "total";
    return permissaoModulo === "total" || permissaoModulo === "leitura";
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, temPermissao }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
