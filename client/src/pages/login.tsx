import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Church, Lock, Mail, Shield } from "lucide-react";
import logoIpbEmaus from "@assets/Logo IPE Completo sem fundo_1762855505939.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, getRotaPadrão } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !senha) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, senha);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a) ao Sistema IPB Emaús!`,
      });
      setLocation(getRotaPadrão());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: "Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img 
              src={logoIpbEmaus} 
              alt="Logo IPB Emaús" 
              className="h-24 w-auto"
            />
          </div>
          <CardDescription className="text-base">Sistema Integrado de Gestão Eclesiástica</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@igreja.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-10"
                  data-testid="input-senha"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Acesso Público
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/portal-lgpd")}
              data-testid="button-portal-lgpd"
            >
              <Shield className="w-4 h-4 mr-2" />
              Portal LGPD - Meus Dados Pessoais
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Sistema exclusivo para liderança da IPB Emaús</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
