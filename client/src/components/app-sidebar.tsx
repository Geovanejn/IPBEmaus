import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Church,
  Users,
  Wallet,
  Heart,
  Newspaper,
  FileText,
  LayoutDashboard,
  LogOut,
  Lock,
  Shield,
} from "lucide-react";
import { PERMISSOES_POR_CARGO } from "@shared/schema";

export function AppSidebar() {
  const { usuario, logout, temPermissao } = useAuth();
  const [location, setLocation] = useLocation();

  if (!usuario) return null;

  const permissoes = PERMISSOES_POR_CARGO[usuario.cargo];

  const modulos = [
    {
      nome: "Dashboard",
      icone: LayoutDashboard,
      rota: "/",
      permissao: "total" as const,
      modulo: "pastoral" as const,
    },
    {
      nome: "Pastoral",
      icone: Users,
      rota: "/pastoral",
      permissao: permissoes.pastoral,
      modulo: "pastoral" as const,
    },
    {
      nome: "Financeiro",
      icone: Wallet,
      rota: "/financeiro",
      permissao: permissoes.financeiro,
      modulo: "financeiro" as const,
    },
    {
      nome: "Diaconal",
      icone: Heart,
      rota: "/diaconal",
      permissao: permissoes.diaconal,
      modulo: "diaconal" as const,
    },
    {
      nome: "Boletim Dominical",
      icone: Newspaper,
      rota: "/boletim",
      permissao: permissoes.boletim,
      modulo: "boletim" as const,
    },
    {
      nome: "Secretaria de Atas",
      icone: FileText,
      rota: "/atas",
      permissao: permissoes.atas,
      modulo: "atas" as const,
    },
    {
      nome: "Privacidade LGPD",
      icone: Shield,
      rota: "/lgpd",
      permissao: permissoes.lgpd,
      modulo: "lgpd" as const,
    },
  ];

  const modulosVisiveis = modulos.filter((m) => m.permissao !== "nenhum");

  const cargoLabels = {
    PASTOR: "Pastor",
    PRESBITERO: "Presbítero",
    TESOUREIRO: "Tesoureiro",
    DIACONO: "Diácono",
  };

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Church className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate">IPB Emaús</h2>
            <p className="text-xs text-muted-foreground truncate">Sistema Integrado</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modulosVisiveis.map((modulo) => {
                const isActive = location === modulo.rota;
                const isReadOnly = modulo.permissao === "leitura";
                const Icon = modulo.icone;

                return (
                  <SidebarMenuItem key={modulo.rota}>
                    <SidebarMenuButton
                      onClick={() => setLocation(modulo.rota)}
                      isActive={isActive}
                      className="group"
                      data-testid={`link-${modulo.rota.slice(1) || "dashboard"}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1">{modulo.nome}</span>
                      {isReadOnly && (
                        <Lock className="w-3 h-3 text-muted-foreground opacity-60" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(usuario.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{usuario.nome}</p>
            <Badge variant="secondary" className="text-xs mt-1">
              {cargoLabels[usuario.cargo]}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full justify-start"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
