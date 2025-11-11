import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mail,
  MessageSquare,
} from "lucide-react";

type Step = "solicitar" | "validar" | "acoes";

interface SessionData {
  sessionToken: string;
  expiresAt: string;
  titular: {
    nome: string;
    tipo: "membro" | "visitante";
  };
}

export default function PortalLGPDPublico() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("solicitar");
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  const [solicitacaoForm, setSolicitacaoForm] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
  });

  const [validacaoForm, setValidacaoForm] = useState({
    codigo: "",
  });

  const [canalEnvio, setCanalEnvio] = useState<"sms" | "email" | null>(null);

  const normalizarCPF = (cpf: string) => cpf.replace(/\D/g, "");

  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/lgpd/solicitar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...solicitacaoForm,
          cpf: normalizarCPF(solicitacaoForm.cpf),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao solicitar código");
      }

      setCanalEnvio(data.canal || "sms");
      setStep("validar");

      toast({
        title: "Código enviado",
        description: `Verifique seu ${data.canal === "email" ? "e-mail" : "SMS"} para obter o código de verificação.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/lgpd/validar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: validacaoForm.codigo,
          cpf: normalizarCPF(solicitacaoForm.cpf),
          dataNascimento: solicitacaoForm.dataNascimento,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Código inválido");
      }

      setSessionData(data);
      localStorage.setItem("lgpdSession", data.sessionToken);
      setStep("acoes");

      toast({
        title: "Verificação concluída",
        description: `Bem-vindo(a), ${data.titular.nome}!`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportarDados = async () => {
    if (!sessionData) return;

    setLoading(true);
    try {
      const res = await fetch("/api/lgpd/exportar-dados", {
        headers: {
          "x-lgpd-session": sessionData.sessionToken,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao exportar dados");
      }

      const dados = await res.json();
      const blob = new Blob([JSON.stringify(dados, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-${sessionData.titular.nome.replace(/\s/g, "_")}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      localStorage.removeItem("lgpdSession");
      setSessionData(null);
      setStep("solicitar");
      setSolicitacaoForm({ nome: "", cpf: "", dataNascimento: "", telefone: "" });
      setValidacaoForm({ codigo: "" });

      toast({
        title: "Dados exportados",
        description: "Seus dados foram exportados com sucesso. A sessão foi encerrada.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const [motivoExclusao, setMotivoExclusao] = useState("");

  const handleSolicitarExclusao = async () => {
    if (!sessionData) return;

    setLoading(true);
    try {
      const res = await fetch("/api/lgpd/solicitar-exclusao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-lgpd-session": sessionData.sessionToken,
        },
        body: JSON.stringify({ motivo: motivoExclusao }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao solicitar exclusão");
      }

      localStorage.removeItem("lgpdSession");
      setSessionData(null);
      setStep("solicitar");
      setSolicitacaoForm({ nome: "", cpf: "", dataNascimento: "", telefone: "" });
      setValidacaoForm({ codigo: "" });

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de exclusão foi registrada e será processada em até 30 dias.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, "");
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return valor;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Portal LGPD</h1>
          <p className="text-muted-foreground mt-2">
            Acesse e gerencie seus dados pessoais
          </p>
        </div>

        <Card>
          {step === "solicitar" && (
            <>
              <CardHeader>
                <CardTitle>Solicitar Acesso aos Dados</CardTitle>
                <CardDescription>
                  Informe seus dados para receber um código de verificação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSolicitarCodigo} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      required
                      value={solicitacaoForm.nome}
                      onChange={(e) =>
                        setSolicitacaoForm({ ...solicitacaoForm, nome: e.target.value })
                      }
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      required
                      value={solicitacaoForm.cpf}
                      onChange={(e) =>
                        setSolicitacaoForm({
                          ...solicitacaoForm,
                          cpf: formatarCPF(e.target.value),
                        })
                      }
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      required
                      value={solicitacaoForm.dataNascimento}
                      onChange={(e) =>
                        setSolicitacaoForm({
                          ...solicitacaoForm,
                          dataNascimento: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefone">Telefone (opcional)</Label>
                    <Input
                      id="telefone"
                      value={solicitacaoForm.telefone}
                      onChange={(e) =>
                        setSolicitacaoForm({ ...solicitacaoForm, telefone: e.target.value })
                      }
                      placeholder="(00) 00000-0000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Se não informar telefone, o código será enviado por e-mail
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Um código de verificação será enviado para confirmar sua identidade
                    </AlertDescription>
                  </Alert>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        {canalEnvio === "email" ? (
                          <Mail className="w-4 h-4 mr-2" />
                        ) : (
                          <MessageSquare className="w-4 h-4 mr-2" />
                        )}
                        Enviar Código
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {step === "validar" && (
            <>
              <CardHeader>
                <CardTitle>Validar Código</CardTitle>
                <CardDescription>
                  Digite o código de 6 dígitos enviado para seu{" "}
                  {canalEnvio === "email" ? "e-mail" : "telefone"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleValidarCodigo} className="space-y-4">
                  <div>
                    <Label htmlFor="codigo">Código de Verificação</Label>
                    <Input
                      id="codigo"
                      required
                      value={validacaoForm.codigo}
                      onChange={(e) =>
                        setValidacaoForm({
                          codigo: e.target.value.replace(/\D/g, "").slice(0, 6),
                        })
                      }
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      O código expira em 10 minutos. Você tem até 3 tentativas de validação.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStep("solicitar");
                        setValidacaoForm({ codigo: "" });
                      }}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Validar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {step === "acoes" && sessionData && (
            <>
              <CardHeader>
                <CardTitle>Gerenciar Seus Dados</CardTitle>
                <CardDescription>
                  Bem-vindo(a), {sessionData.titular.nome}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900 dark:text-green-100">
                    Identidade verificada com sucesso! Escolha uma ação abaixo.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="p-4 rounded-lg border hover-elevate">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Download className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">Exportar Meus Dados</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Baixe uma cópia completa de todos os seus dados pessoais em formato
                          JSON
                        </p>
                        <Button
                          onClick={handleExportarDados}
                          disabled={loading}
                          className="mt-3"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Exportando...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Exportar Dados
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border hover-elevate">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">Solicitar Exclusão de Dados</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Solicite a exclusão permanente de todos os seus dados pessoais do
                          sistema
                        </p>
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Motivo da exclusão (opcional)"
                            value={motivoExclusao}
                            onChange={(e) => setMotivoExclusao(e.target.value)}
                            rows={3}
                          />
                          <Button
                            onClick={handleSolicitarExclusao}
                            disabled={loading}
                            variant="destructive"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Solicitando...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Solicitar Exclusão
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Esta sessão expira em 30 minutos por segurança. Após realizar uma ação, a
                    sessão será encerrada.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </>
          )}
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Portal em conformidade com a LGPD (Lei nº 13.709/2018)
          </p>
          <p className="mt-1">
            Igreja Presbiteriana do Brasil - IPB Emaús
          </p>
        </div>
      </div>
    </div>
  );
}
