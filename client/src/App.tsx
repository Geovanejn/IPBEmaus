import { Switch, Route, Redirect } from "wouter";
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
import { useLocation } from "wouter";
import { PERMISSOES_POR_CARGO, type Cargo } from "@shared/schema";

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

  // Define páginas permitidas para cada cargo
  const paginasPorCargo: Record<Cargo, Array<{ nome: string; rota: string }>> = {
    PASTOR: [
      { nome: "Dashboard", rota: "/" },
      { nome: "Pastoral", rota: "/pastoral" },
      { nome: "Financeiro", rota: "/financeiro" },
      { nome: "Diaconal", rota: "/diaconal" },
      { nome: "Boletim", rota: "/boletim" },
      { nome: "Atas", rota: "/atas" },
    ],
    PRESBITERO: [
      { nome: "Pastoral", rota: "/pastoral" },
      { nome: "Boletim", rota: "/boletim" },
      { nome: "Atas", rota: "/atas" },
    ],
    TESOUREIRO: [
      { nome: "Financeiro", rota: "/financeiro" },
    ],
    DIACONO: [
      { nome: "Diaconal", rota: "/diaconal" },
    ],
  };

  const paginasDisponiveis = paginasPorCargo[usuario.cargo];
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
  const { usuario, getRotaPadrão, temPermissao } = useAuth();

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

  // Verificação de permissão para cada rota
  const rotasPorCargo: Record<Cargo, string[]> = {
    PASTOR: ["/", "/pastoral", "/financeiro", "/diaconal", "/boletim", "/atas"],
    PRESBITERO: ["/pastoral", "/boletim", "/atas"],
    TESOUREIRO: ["/financeiro"],
    DIACONO: ["/diaconal"],
  };

  const rotasPermitidas = rotasPorCargo[usuario.cargo];

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Switch>
            {rotasPermitidas.includes("/") && <Route path="/" component={Dashboard} />}
            {rotasPermitidas.includes("/pastoral") && <Route path="/pastoral" component={Pastoral} />}
            {rotasPermitidas.includes("/financeiro") && <Route path="/financeiro" component={Financeiro} />}
            {rotasPermitidas.includes("/diaconal") && <Route path="/diaconal" component={Diaconal} />}
            {rotasPermitidas.includes("/boletim") && <Route path="/boletim" component={BoletimDominical} />}
            {rotasPermitidas.includes("/atas") && <Route path="/atas" component={SecretariaAtas} />}
            <Route path="/">
              <Redirect to={getRotaPadrão()} />
            </Route>
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
