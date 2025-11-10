import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Pastoral from "@/pages/pastoral";
import Financeiro from "@/pages/financeiro";
import Diaconal from "@/pages/diaconal";
import BoletimDominical from "@/pages/boletim";
import SecretariaAtas from "@/pages/atas";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { usuario } = useAuth();
  
  if (!usuario) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

ProtectedRoute.displayName = "ProtectedRoute";

function Router() {
  const { usuario } = useAuth();

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
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-7xl mx-auto">
              <Switch>
                <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
                <Route path="/pastoral" component={() => <ProtectedRoute component={Pastoral} />} />
                <Route path="/financeiro" component={() => <ProtectedRoute component={Financeiro} />} />
                <Route path="/diaconal" component={() => <ProtectedRoute component={Diaconal} />} />
                <Route path="/boletim" component={() => <ProtectedRoute component={BoletimDominical} />} />
                <Route path="/atas" component={() => <ProtectedRoute component={SecretariaAtas} />} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
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
