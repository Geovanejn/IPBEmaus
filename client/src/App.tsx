import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Pastoral from "@/pages/pastoral";
import Financeiro from "@/pages/financeiro";
import Diaconal from "@/pages/diaconal";
import BoletimDominical from "@/pages/boletim";
import SecretariaAtas from "@/pages/atas";
import Relatorios from "@/pages/relatorios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Church, LogOut, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERMISSOES_POR_CARGO, type Cargo } from "@shared/schema";
import type { ComponentType } from "react";

// Configuração centralizada de rotas
interface RouteConfig {
  path: string;
  component: ComponentType;
  allowedCargos: Cargo[];
  name: string;
}

const ROUTES: RouteConfig[] = [
  {
    path: "/",
    component: Dashboard,
    allowedCargos: ["PASTOR"],
    name: "Dashboard",
  },
  {
    path: "/pastoral",
    component: Pastoral,
    allowedCargos: ["PASTOR", "PRESBITERO"],
    name: "Pastoral",
  },
  {
    path: "/financeiro",
    component: Financeiro,
    allowedCargos: ["PASTOR", "TESOUREIRO"],
    name: "Financeiro",
  },
  {
    path: "/diaconal",
    component: Diaconal,
    allowedCargos: ["PASTOR", "DIACONO"],
    name: "Diaconal",
  },
  {
    path: "/boletim",
    component: BoletimDominical,
    allowedCargos: ["PASTOR", "PRESBITERO"],
    name: "Boletim",
  },
  {
    path: "/atas",
    component: SecretariaAtas,
    allowedCargos: ["PASTOR", "PRESBITERO"],
    name: "Atas",
  },
  {
    path: "/relatorios",
    component: Relatorios,
    allowedCargos: ["PASTOR", "PRESBITERO", "TESOUREIRO", "DIACONO"],
    name: "Relatórios",
  },
];

// Componente de proteção de rotas
function ProtectedRoute({ 
  component: Component, 
  allowedCargos 
}: { 
  component: ComponentType; 
  allowedCargos: Cargo[] 
}) {
  const { usuario, getRotaPadrão } = useAuth();
  
  if (!usuario) {
    return <Redirect to="/login" />;
  }
  
  if (!allowedCargos.includes(usuario.cargo)) {
    return <Redirect to={getRotaPadrão()} />;
  }
  
  return <Component />;
}

function AppHeader() {
  const { usuario, logout, temPermissao, getRotaPadrão } = useAuth();
  const [, setLocation] = useLocation();

  if (!usuario) return null;

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

  // Busca páginas permitidas usando a configuração centralizada
  const paginasDisponiveis = ROUTES.filter(route => 
    route.allowedCargos.includes(usuario.cargo)
  ).map(route => ({
    nome: route.name,
    rota: route.path
  }));

  const temMultiplasPaginas = paginasDisponiveis.length > 1;

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Church className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-bold text-sm">IPB Emaús</h2>
          <p className="text-xs text-muted-foreground">Sistema Integrado</p>
        </div>
      </div>

      <div className="flex-1" />

      {temMultiplasPaginas && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-menu">
              <Menu className="w-4 h-4 mr-2" />
              Menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Navegação</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {paginasDisponiveis.map((pagina) => (
              <DropdownMenuItem
                key={pagina.rota}
                onClick={() => setLocation(pagina.rota)}
                data-testid={`menu-${pagina.rota.slice(1) || "dashboard"}`}
              >
                {pagina.nome}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {getInitials(usuario.nome)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="text-sm font-medium">{usuario.nome}</p>
          <Badge variant="secondary" className="text-xs w-fit">
            {cargoLabels[usuario.cargo]}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
}

function Router() {
  const { usuario, getRotaPadrão } = useAuth();

  if (!usuario) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/">
          <Redirect to="/login" />
        </Route>
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Switch>
            {/* Redireciona usuários autenticados que tentam acessar /login */}
            <Route path="/login">
              <Redirect to={getRotaPadrão()} />
            </Route>
            
            {/* Alias: /painel redireciona para / (Dashboard) */}
            <Route path="/painel">
              <Redirect to="/" />
            </Route>
            
            {ROUTES.map((route) => (
              <Route key={route.path} path={route.path}>
                <ProtectedRoute 
                  component={route.component} 
                  allowedCargos={route.allowedCargos} 
                />
              </Route>
            ))}
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
