import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SolicitacaoLGPD {
  id: string;
  tipo: string;
  status: string;
  tipoTitular: string;
  titularId: string;
  titularNome: string;
  titularEmail: string;
  motivo: string | null;
  justificativaRecusa: string | null;
  responsavelId: string | null;
  dataAtendimento: string | null;
  arquivoExportacao: string | null;
  criadoEm: string;
}

interface LogConsentimento {
  id: string;
  tipoTitular: string;
  titularId: string;
  titularNome: string;
  acao: string;
  consentimentoAnterior: boolean;
  consentimentoNovo: boolean;
  usuarioId: string | null;
  ipAddress: string | null;
  criadoEm: string;
}

interface LogAuditoria {
  id: string;
  modulo: string;
  acao: string;
  descricao: string;
  registroId: string | null;
  usuarioId: string;
  usuarioNome: string;
  usuarioCargo: string;
  ipAddress: string | null;
  criadoEm: string;
}

export default function LGPDAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<SolicitacaoLGPD | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [acao, setAcao] = useState<"aprovar" | "recusar" | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const { data: solicitacoes, isLoading: carregandoSolicitacoes } = useQuery<SolicitacaoLGPD[]>({
    queryKey: ["/api/lgpd/solicitacoes"],
  });

  const { data: logsConsentimento, isLoading: carregandoConsentimento } = useQuery<LogConsentimento[]>({
    queryKey: ["/api/lgpd/logs-consentimento"],
    queryFn: async () => {
      const res = await fetch("/api/lgpd/logs-consentimento", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao carregar logs de consentimento");
      return res.json();
    },
  });

  const { data: logsAuditoria, isLoading: carregandoAuditoria } = useQuery<LogAuditoria[]>({
    queryKey: ["/api/lgpd/logs-auditoria"],
  });

  const processarSolicitacaoMutation = useMutation({
    mutationFn: async (params: { id: string; status: string; justificativaRecusa?: string }) => {
      const res = await fetch(`/api/lgpd/solicitacoes/${params.id}/processar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: params.status,
          justificativaRecusa: params.justificativaRecusa,
        }),
      });
      if (!res.ok) throw new Error("Erro ao processar solicitação");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lgpd/solicitacoes"] });
      setDialogAberto(false);
      setSolicitacaoSelecionada(null);
      setJustificativa("");
      toast({
        title: "Solicitação processada",
        description: "A solicitação foi processada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    },
  });

  const exportarDadosTitularMutation = useMutation({
    mutationFn: async (params: { tipoTitular: string; titularId: string }) => {
      const res = await fetch(`/api/lgpd/exportar-titular/${params.tipoTitular}/${params.titularId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao exportar dados");
      return res.json();
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dados-titular-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Dados exportados",
        description: "Os dados do titular foram exportados com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    },
  });

  const excluirDadosTitularMutation = useMutation({
    mutationFn: async (params: { tipoTitular: string; titularId: string; solicitacaoId: string }) => {
      const res = await fetch(`/api/lgpd/excluir-titular/${params.tipoTitular}/${params.titularId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitacaoId: params.solicitacaoId,
        }),
      });
      if (!res.ok) throw new Error("Erro ao excluir dados");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lgpd/solicitacoes"] });
      toast({
        title: "Dados excluídos",
        description: "Os dados do titular foram excluídos permanentemente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    },
  });

  const handleAprovarSolicitacao = (solicitacao: SolicitacaoLGPD) => {
    setSolicitacaoSelecionada(solicitacao);
    setAcao("aprovar");
    setDialogAberto(true);
  };

  const handleRecusarSolicitacao = (solicitacao: SolicitacaoLGPD) => {
    setSolicitacaoSelecionada(solicitacao);
    setAcao("recusar");
    setDialogAberto(true);
  };

  const handleConfirmarAcao = async () => {
    if (!solicitacaoSelecionada) return;

    if (acao === "aprovar") {
      if (solicitacaoSelecionada.tipo === "exportacao") {
        await exportarDadosTitularMutation.mutateAsync({
          tipoTitular: solicitacaoSelecionada.tipoTitular,
          titularId: solicitacaoSelecionada.titularId,
        });
      } else if (solicitacaoSelecionada.tipo === "exclusao") {
        await excluirDadosTitularMutation.mutateAsync({
          tipoTitular: solicitacaoSelecionada.tipoTitular,
          titularId: solicitacaoSelecionada.titularId,
          solicitacaoId: solicitacaoSelecionada.id,
        });
      }
      await processarSolicitacaoMutation.mutateAsync({
        id: solicitacaoSelecionada.id,
        status: "concluida",
      });
    } else if (acao === "recusar") {
      await processarSolicitacaoMutation.mutateAsync({
        id: solicitacaoSelecionada.id,
        status: "recusada",
        justificativaRecusa: justificativa,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      em_andamento: { label: "Em Andamento", variant: "secondary" },
      concluida: { label: "Concluída", variant: "default" },
      recusada: { label: "Recusada", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    const tipoConfig: Record<string, { label: string; icon: any }> = {
      acesso: { label: "Acesso", icon: Eye },
      exportacao: { label: "Exportação", icon: Download },
      exclusao: { label: "Exclusão", icon: XCircle },
    };

    const config = tipoConfig[tipo] || { label: tipo, icon: FileText };
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </div>
    );
  };

  const getAcaoConsentimentoBadge = (acao: string) => {
    const acaoConfig: Record<string, { label: string; variant: "default" | "destructive" }> = {
      concedido: { label: "Concedido", variant: "default" },
      revogado: { label: "Revogado", variant: "destructive" },
    };

    const config = acaoConfig[acao] || { label: acao, variant: "default" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Gerenciamento LGPD
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie solicitações e logs de conformidade com a LGPD
        </p>
      </div>

      <Tabs defaultValue="solicitacoes">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="solicitacoes">
            Solicitações
            {solicitacoes && solicitacoes.filter(s => s.status === "pendente").length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {solicitacoes.filter(s => s.status === "pendente").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="consentimento">Logs de Consentimento</TabsTrigger>
          <TabsTrigger value="auditoria">Logs de Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações LGPD</CardTitle>
              <CardDescription>
                Gerencie solicitações de acesso, exportação e exclusão de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {carregandoSolicitacoes ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : solicitacoes && solicitacoes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titular</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {solicitacoes.map((solicitacao) => (
                      <TableRow key={solicitacao.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{solicitacao.titularNome}</p>
                            <p className="text-sm text-muted-foreground">{solicitacao.titularEmail}</p>
                            <Badge variant="outline" className="mt-1">
                              {solicitacao.tipoTitular}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{getTipoBadge(solicitacao.tipo)}</TableCell>
                        <TableCell>{getStatusBadge(solicitacao.status)}</TableCell>
                        <TableCell>
                          {format(new Date(solicitacao.criadoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {solicitacao.status === "pendente" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAprovarSolicitacao(solicitacao)}
                                disabled={processarSolicitacaoMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRecusarSolicitacao(solicitacao)}
                                disabled={processarSolicitacaoMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Recusar
                              </Button>
                            </div>
                          )}
                          {solicitacao.status === "recusada" && solicitacao.justificativaRecusa && (
                            <p className="text-sm text-muted-foreground">
                              Motivo: {solicitacao.justificativaRecusa}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma solicitação encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consentimento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Consentimento</CardTitle>
              <CardDescription>
                Histórico de alterações de consentimento LGPD
              </CardDescription>
            </CardHeader>
            <CardContent>
              {carregandoConsentimento ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : logsConsentimento && logsConsentimento.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titular</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Alteração</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsConsentimento.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.titularNome}</p>
                            <Badge variant="outline" className="mt-1">
                              {log.tipoTitular}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{getAcaoConsentimentoBadge(log.acao)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className={log.consentimentoAnterior ? "text-green-600" : "text-red-600"}>
                              {log.consentimentoAnterior ? "Sim" : "Não"}
                            </span>
                            {" → "}
                            <span className={log.consentimentoNovo ? "text-green-600" : "text-red-600"}>
                              {log.consentimentoNovo ? "Sim" : "Não"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ipAddress || "N/A"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(log.criadoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum log de consentimento encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Histórico completo de ações no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {carregandoAuditoria ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : logsAuditoria && logsAuditoria.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsAuditoria.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">{log.modulo}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{log.acao}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.usuarioNome}</p>
                            <p className="text-xs text-muted-foreground">{log.usuarioCargo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm truncate">{log.descricao}</p>
                        </TableCell>
                        <TableCell>
                          {format(new Date(log.criadoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum log de auditoria encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acao === "aprovar" ? "Aprovar" : "Recusar"} Solicitação
            </DialogTitle>
            <DialogDescription>
              {acao === "aprovar"
                ? `Você está prestes a ${solicitacaoSelecionada?.tipo === "exclusao" ? "excluir permanentemente os dados" : "exportar os dados"} de ${solicitacaoSelecionada?.titularNome}. Esta ação não pode ser desfeita.`
                : "Informe o motivo da recusa da solicitação"}
            </DialogDescription>
          </DialogHeader>

          {acao === "recusar" && (
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa da Recusa</Label>
              <Textarea
                id="justificativa"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Explique o motivo da recusa..."
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarAcao}
              disabled={
                processarSolicitacaoMutation.isPending ||
                exportarDadosTitularMutation.isPending ||
                excluirDadosTitularMutation.isPending ||
                (acao === "recusar" && !justificativa.trim())
              }
              variant={acao === "aprovar" ? "default" : "destructive"}
            >
              {(processarSolicitacaoMutation.isPending ||
                exportarDadosTitularMutation.isPending ||
                excluirDadosTitularMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {acao === "aprovar" ? "Aprovar e Processar" : "Recusar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
