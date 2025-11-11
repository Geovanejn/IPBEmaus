import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface DadosLGPD {
  informacoesPessoais: {
    nome: string;
    email: string;
    cargo: string;
    ativo: boolean;
    criadoEm: string;
  };
  consentimento: {
    lgpd: boolean;
    dataConsentimento: string;
  };
}

export default function LGPD() {
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [exportando, setExportando] = useState(false);
  const [solicitando, setSolicitando] = useState(false);

  const { data: dados, isLoading, isError, refetch } = useQuery<DadosLGPD>({
    queryKey: ["/api/lgpd/meus-dados"],
    queryFn: async () => {
      const res = await fetch("/api/lgpd/meus-dados", {
        headers: {
          "x-user-id": usuario?.id || "",
        },
      });
      if (!res.ok) throw new Error("Erro ao carregar dados");
      return res.json();
    },
    enabled: !!usuario?.id,
  });

  const handleExportarDados = async () => {
    if (!usuario?.id) return;
    
    setExportando(true);
    try {
      const res = await fetch("/api/lgpd/exportar-dados", {
        headers: {
          "x-user-id": usuario.id,
        },
      });

      if (!res.ok) throw new Error("Erro ao exportar dados");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-${usuario.nome.replace(/\s/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Dados exportados",
        description: "Seus dados foram exportados com sucesso",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: "Não foi possível exportar seus dados. Tente novamente.",
      });
    } finally {
      setExportando(false);
    }
  };

  const handleSolicitarExclusao = async () => {
    if (!usuario?.id) return;
    
    setSolicitando(true);
    try {
      const res = await fetch("/api/lgpd/solicitar-exclusao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": usuario.id,
        },
      });

      if (!res.ok) throw new Error("Erro ao solicitar exclusão");

      const resultado = await res.json();

      toast({
        title: "Solicitação enviada",
        description: `Sua solicitação foi recebida. Seus dados serão excluídos em até ${resultado.prazoExclusao}.`,
      });

      // Recarregar dados após solicitação
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao solicitar exclusão",
        description: "Não foi possível processar sua solicitação. Tente novamente.",
      });
    } finally {
      setSolicitando(false);
    }
  };

  const cargoLabels = {
    PASTOR: "Pastor",
    PRESBITERO: "Presbítero",
    TESOUREIRO: "Tesoureiro",
    DIACONO: "Diácono",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !dados) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Erro ao carregar seus dados. Tente novamente.</p>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Portal de Privacidade LGPD
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie seus dados pessoais e privacidade</p>
      </div>

      {/* Banner de Consentimento */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Seus dados estão protegidos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                De acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), você tem total controle sobre seus dados pessoais.
                Todos os dados coletados são utilizados exclusivamente para a administração eclesiástica da IPB Emaús.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seus Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Seus Dados Pessoais
          </CardTitle>
          <CardDescription>Informações que mantemos sobre você</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
              <p className="text-base mt-1" data-testid="text-nome">{dados.informacoesPessoais.nome}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">E-mail</label>
              <p className="text-base mt-1" data-testid="text-email">{dados.informacoesPessoais.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cargo</label>
              <div className="mt-1">
                <Badge variant="outline" data-testid="badge-cargo">
                  {cargoLabels[dados.informacoesPessoais.cargo as keyof typeof cargoLabels]}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status da Conta</label>
              <div className="mt-1">
                <Badge variant={dados.informacoesPessoais.ativo ? "default" : "secondary"} data-testid="badge-status">
                  {dados.informacoesPessoais.ativo ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
              <p className="text-base mt-1" data-testid="text-data-cadastro">
                {new Date(dados.informacoesPessoais.criadoEm).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Consentimento LGPD</label>
              <div className="mt-1">
                <Badge variant={dados.consentimento.lgpd ? "default" : "secondary"} data-testid="badge-consentimento">
                  {dados.consentimento.lgpd ? "Concedido" : "Não Concedido"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seus Direitos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Seus Direitos Sob a LGPD
          </CardTitle>
          <CardDescription>Ações que você pode realizar com seus dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Exportar Dados */}
            <div className="flex items-start gap-4 p-4 rounded-lg border hover-elevate">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold">Portabilidade de Dados</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Baixe uma cópia completa de todos os seus dados pessoais em formato JSON
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportarDados}
                disabled={exportando}
                data-testid="button-exportar-dados"
              >
                {exportando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </>
                )}
              </Button>
            </div>

            {/* Solicitar Exclusão */}
            <div className="flex items-start gap-4 p-4 rounded-lg border hover-elevate">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold">Direito ao Esquecimento</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Solicite a exclusão permanente de seus dados pessoais do sistema
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" data-testid="button-solicitar-exclusao">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Solicitar Exclusão
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Confirmar Solicitação de Exclusão
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Ao solicitar a exclusão de seus dados, sua conta será desativada imediatamente
                        e todos os seus dados pessoais serão permanentemente excluídos em até 30 dias.
                      </p>
                      <p className="font-semibold">Esta ação é irreversível.</p>
                      <p>Tem certeza que deseja continuar?</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSolicitarExclusao}
                      disabled={solicitando}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {solicitando ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Solicitando...
                        </>
                      ) : (
                        "Sim, excluir meus dados"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre LGPD */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre a LGPD</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A Lei Geral de Proteção de Dados (LGPD) garante aos titulares de dados os seguintes direitos:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Confirmação da existência de tratamento de dados</li>
            <li>Acesso aos dados pessoais</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
            <li>Portabilidade dos dados a outro fornecedor</li>
            <li>Informação sobre compartilhamento de dados</li>
            <li>Revogação do consentimento</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Para mais informações ou dúvidas sobre privacidade, entre em contato com a liderança da igreja.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
