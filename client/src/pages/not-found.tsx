import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, FileQuestion } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function NotFound() {
  const { usuario, getRotaPadrão } = useAuth();
  const [, setLocation] = useLocation();

  const handleVoltar = () => {
    const rotaPadrao = usuario ? getRotaPadrão() : "/login";
    setLocation(rotaPadrao);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <FileQuestion className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Página Não Encontrada</CardTitle>
          <CardDescription>
            A página que você está procurando não existe ou foi removida.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            className="w-full" 
            onClick={handleVoltar}
            data-testid="button-voltar-inicio"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
