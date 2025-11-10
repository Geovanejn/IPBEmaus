import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  FileText,
  Plus,
  Calendar,
  Users,
  FileDown,
  Eye,
  Edit,
  CheckCircle2,
  Clock,
  Lock,
  Loader2,
  X,
} from "lucide-react";
import { type Reuniao, type Ata, insertReuniaoSchema, insertAtaSchema } from "@shared/schema";

const reuniaoFormSchema = insertReuniaoSchema.extend({
  tipo: z.enum(["conselho", "congregacao", "diretoria"]),
  data: z.string().min(1, "Data e hora são obrigatórias"),
  local: z.string().min(1, "Local é obrigatório"),
});

const ataFormSchema = insertAtaSchema.extend({
  reuniaoId: z.string().min(1, "Selecione uma reunião"),
  conteudo: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres"),
});

type ReuniaoFormData = z.infer<typeof reuniaoFormSchema>;
type AtaFormData = z.infer<typeof ataFormSchema>;

export default function SecretariaAtas() {
  const { temPermissao, usuario } = useAuth();
  const { toast } = useToast();
  const [dialogNovaReuniao, setDialogNovaReuniao] = useState(false);
  const [dialogNovaAta, setDialogNovaAta] = useState(false);
  const [reuniaoParaAta, setReuniaoParaAta] = useState<Reuniao | null>(null);
  
  // Estados para campos dinâmicos
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [novoParticipante, setNovoParticipante] = useState("");

  const podeEditar = temPermissao("atas", "total");

  const { data: reunioesData = [], isLoading: isLoadingReunioes, isError: isErrorReunioes, refetch: refetchReunioes } = useQuery<Reuniao[]>({
    queryKey: ["/api/reunioes"],
  });

  const { data: atasData = [], isLoading: isLoadingAtas, isError: isErrorAtas, refetch: refetchAtas } = useQuery<Ata[]>({
    queryKey: ["/api/atas"],
  });

  const formReuniao = useForm<ReuniaoFormData>({
    resolver: zodResolver(reuniaoFormSchema),
    defaultValues: {
      tipo: "conselho",
      data: "",
      local: "",
      participantes: [],
      status: "agendada",
    },
  });

  const formAta = useForm<AtaFormData>({
    resolver: zodResolver(ataFormSchema),
    defaultValues: {
      reuniaoId: "",
      conteudo: "",
      aprovada: false,
      dataAprovacao: null,
      aprovadoPorId: null,
      pdfUrl: null,
      bloqueada: false,
      secretarioId: usuario?.id || "",
    },
  });

  const criarReuniaoMutation = useMutation({
    mutationFn: async (data: ReuniaoFormData) => {
      return await apiRequest("POST", "/api/reunioes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reunioes"] });
      toast({
        title: "Reunião agendada com sucesso!",
        description: "A reunião foi cadastrada no sistema.",
      });
      setDialogNovaReuniao(false);
      resetFormReuniao();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao agendar reunião",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const criarAtaMutation = useMutation({
    mutationFn: async (data: AtaFormData) => {
      return await apiRequest("POST", "/api/atas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/atas"] });
      toast({
        title: "Ata criada com sucesso!",
        description: "A ata foi registrada e está disponível para aprovação.",
      });
      setDialogNovaAta(false);
      setReuniaoParaAta(null);
      resetFormAta();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar ata",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const aprovarAtaMutation = useMutation({
    mutationFn: async (ataId: string) => {
      return await apiRequest("POST", `/api/atas/${ataId}/aprovar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/atas"] });
      toast({
        title: "Ata aprovada!",
        description: "A ata foi aprovada e bloqueada para edição.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar ata",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const atualizarReuniaoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ReuniaoFormData> }) => {
      return await apiRequest("PATCH", `/api/reunioes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reunioes"] });
      toast({
        title: "Reunião atualizada!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar reunião",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const gerarPdfAtaMutation = useMutation({
    mutationFn: async (ataId: string) => {
      return await apiRequest("POST", `/api/atas/${ataId}/gerar-pdf`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/atas"] });
      toast({
        title: "PDF gerado com sucesso!",
        description: "A ata foi convertida em PDF e está disponível para download.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const adicionarParticipante = () => {
    if (novoParticipante.trim()) {
      setParticipantes([...participantes, novoParticipante.trim()]);
      setNovoParticipante("");
    }
  };

  const removerParticipante = (index: number) => {
    setParticipantes(participantes.filter((_, i) => i !== index));
  };

  const resetFormReuniao = () => {
    formReuniao.reset({
      tipo: "conselho",
      data: "",
      local: "",
      participantes: [],
      status: "agendada",
    });
    setParticipantes([]);
  };

  const resetFormAta = () => {
    formAta.reset({
      reuniaoId: "",
      conteudo: "",
      aprovada: false,
      dataAprovacao: null,
      aprovadoPorId: null,
      pdfUrl: null,
      bloqueada: false,
      secretarioId: usuario?.id || "",
    });
  };

  const onSubmitReuniao = (data: ReuniaoFormData) => {
    const reuniaoData = {
      ...data,
      data: new Date(data.data).toISOString(),
      participantes: participantes.length > 0 ? participantes : null,
    };
    
    criarReuniaoMutation.mutate(reuniaoData);
  };

  const onSubmitAta = (data: AtaFormData) => {
    const ataData = {
      ...data,
      secretarioId: usuario?.id || "",
    };
    
    criarAtaMutation.mutate(ataData);
  };

  const abrirDialogAta = (reuniao: Reuniao) => {
    setReuniaoParaAta(reuniao);
    formAta.setValue("reuniaoId", reuniao.id);
    setDialogNovaAta(true);
  };

  const aprovarAta = (ataId: string) => {
    if (confirm("Tem certeza que deseja aprovar esta ata? Após aprovação, ela será bloqueada para edição.")) {
      aprovarAtaMutation.mutate(ataId);
    }
  };

  const marcarComoRealizada = (reuniaoId: string) => {
    atualizarReuniaoMutation.mutate({
      id: reuniaoId,
      data: { status: "realizada" },
    });
  };

  // Combinar reuniões com suas atas
  const reunioesComAtas: (Reuniao & { ata?: Ata })[] = reunioesData.map(r => ({
    ...r,
    ata: atasData.find(a => a.reuniaoId === r.id)
  }));

  const tipoReuniaoLabels = {
    conselho: "Conselho",
    congregacao: "Congregação",
    diretoria: "Diretoria",
  };

  const statusLabels = {
    agendada: "Agendada",
    realizada: "Realizada",
    cancelada: "Cancelada",
  };

  const statusColors = {
    agendada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    realizada: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelada: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  if (isLoadingReunioes || isLoadingAtas) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isErrorReunioes || isErrorAtas) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Erro ao carregar dados. Tente novamente.</p>
        <Button onClick={() => { refetchReunioes(); refetchAtas(); }} variant="outline" data-testid="button-tentar-novamente">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Secretaria de Atas
          </h1>
          <p className="text-muted-foreground mt-1">Registro de reuniões e deliberações oficiais</p>
        </div>
        {podeEditar && (
          <div className="flex gap-2 flex-wrap">
            <Dialog open={dialogNovaReuniao} onOpenChange={setDialogNovaReuniao}>
              <DialogTrigger asChild>
                <Button data-testid="button-nova-reuniao">
                  <Plus className="w-4 h-4 mr-2" />
                  Agendar Reunião
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agendar Nova Reunião</DialogTitle>
                  <DialogDescription>
                    Cadastre uma nova reunião oficial
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...formReuniao}>
                  <form onSubmit={formReuniao.handleSubmit(onSubmitReuniao)} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={formReuniao.control}
                        name="tipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Reunião *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-tipo-reuniao">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="conselho">Conselho</SelectItem>
                                <SelectItem value="congregacao">Congregação</SelectItem>
                                <SelectItem value="diretoria">Diretoria</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={formReuniao.control}
                        name="data"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data e Hora *</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                                data-testid="input-data-reuniao"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={formReuniao.control}
                      name="local"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Sala do Conselho"
                              {...field}
                              data-testid="input-local-reuniao"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormLabel>Participantes Esperados</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome do participante"
                          value={novoParticipante}
                          onChange={(e) => setNovoParticipante(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), adicionarParticipante())}
                          data-testid="input-novo-participante"
                        />
                        <Button type="button" onClick={adicionarParticipante} data-testid="button-adicionar-participante">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {participantes.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {participantes.map((participante, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded gap-2">
                              <span className="text-sm flex-1" data-testid={`text-participante-${idx}`}>{participante}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removerParticipante(idx)}
                                data-testid={`button-remover-participante-${idx}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogNovaReuniao(false)}
                        data-testid="button-cancelar-reuniao"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={criarReuniaoMutation.isPending}
                        data-testid="button-salvar-reuniao"
                      >
                        {criarReuniaoMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Agendar Reunião
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogNovaAta} onOpenChange={setDialogNovaAta}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Ata de Reunião</DialogTitle>
                  <DialogDescription>
                    {reuniaoParaAta && (
                      <>
                        {tipoReuniaoLabels[reuniaoParaAta.tipo as keyof typeof tipoReuniaoLabels]} -{" "}
                        {new Date(reuniaoParaAta.data).toLocaleDateString("pt-BR")}
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...formAta}>
                  <form onSubmit={formAta.handleSubmit(onSubmitAta)} className="space-y-4 mt-4">
                    <FormField
                      control={formAta.control}
                      name="conteudo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conteúdo da Ata *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Digite o conteúdo completo da ata da reunião..."
                              rows={15}
                              className="font-mono text-sm"
                              {...field}
                              data-testid="textarea-conteudo-ata"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Inclua: data, horário, local, participantes, pauta, deliberações e encerramento.
                          </p>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDialogNovaAta(false);
                          setReuniaoParaAta(null);
                        }}
                        data-testid="button-cancelar-ata"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={criarAtaMutation.isPending}
                        data-testid="button-salvar-ata"
                      >
                        {criarAtaMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Salvar Ata
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reunioes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="reunioes" data-testid="tab-reunioes">Reuniões</TabsTrigger>
          <TabsTrigger value="atas" data-testid="tab-atas">Atas</TabsTrigger>
        </TabsList>

        {/* Tab Reuniões */}
        <TabsContent value="reunioes" className="space-y-4">
          {reunioesComAtas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhuma reunião agendada ainda.
                  {podeEditar && " Clique em 'Agendar Reunião' para começar."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Reuniões Agendadas e Realizadas</CardTitle>
                <CardDescription>{reunioesComAtas.length} reuniões registradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reunioesComAtas
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map((reuniao) => (
                      <div
                        key={reuniao.id}
                        className="flex items-start gap-4 p-4 rounded-lg border hover-elevate"
                        data-testid={`card-reuniao-${reuniao.id}`}
                      >
                        <div className={`w-12 h-12 rounded-full ${
                          reuniao.status === "realizada" ? "bg-green-50 dark:bg-green-950" :
                          reuniao.status === "agendada" ? "bg-blue-50 dark:bg-blue-950" :
                          "bg-gray-50 dark:bg-gray-800"
                        } flex items-center justify-center flex-shrink-0`}>
                          {reuniao.status === "realizada" ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : reuniao.status === "agendada" ? (
                            <Clock className="w-6 h-6 text-blue-600" />
                          ) : (
                            <Calendar className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="secondary">
                                  {tipoReuniaoLabels[reuniao.tipo as keyof typeof tipoReuniaoLabels]}
                                </Badge>
                                <Badge className={statusColors[reuniao.status as keyof typeof statusColors]}>
                                  {statusLabels[reuniao.status as keyof typeof statusLabels]}
                                </Badge>
                                {reuniao.ata?.bloqueada && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Ata Bloqueada
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(reuniao.data).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  })} às {new Date(reuniao.data).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">📍 {reuniao.local}</p>
                              {reuniao.participantes && reuniao.participantes.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium mb-1 flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    Participantes:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {reuniao.participantes.map((p, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {p}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {reuniao.status === "agendada" && podeEditar && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => marcarComoRealizada(reuniao.id)}
                                  disabled={atualizarReuniaoMutation.isPending}
                                  data-testid={`button-marcar-realizada-${reuniao.id}`}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Marcar como Realizada
                                </Button>
                              )}
                              {reuniao.status === "realizada" && !reuniao.ata && podeEditar && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirDialogAta(reuniao)}
                                  data-testid={`button-criar-ata-${reuniao.id}`}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Criar Ata
                                </Button>
                              )}
                              {reuniao.ata && !reuniao.ata.aprovada && podeEditar && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => aprovarAta(reuniao.ata!.id)}
                                  disabled={aprovarAtaMutation.isPending}
                                  data-testid={`button-aprovar-ata-${reuniao.id}`}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Aprovar Ata
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Atas */}
        <TabsContent value="atas" className="space-y-4">
          {reunioesComAtas.filter((r) => r.ata).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhuma ata registrada ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Atas Registradas</CardTitle>
                <CardDescription>Histórico de atas de reuniões</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reunioesComAtas
                    .filter((r) => r.ata)
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map((reuniao) => (
                      <Card key={reuniao.id} className="border-2" data-testid={`card-ata-${reuniao.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <CardTitle className="text-lg">
                                  Ata - {tipoReuniaoLabels[reuniao.tipo as keyof typeof tipoReuniaoLabels]}
                                </CardTitle>
                                {reuniao.ata?.aprovada && (
                                  <Badge variant="default" className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Aprovada
                                  </Badge>
                                )}
                                {!reuniao.ata?.aprovada && (
                                  <Badge variant="secondary">Pendente de Aprovação</Badge>
                                )}
                                {reuniao.ata?.bloqueada && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Bloqueada
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(reuniao.data).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {reuniao.ata?.pdfUrl && (
                                <Button variant="outline" size="sm" asChild data-testid={`link-pdf-ata-${reuniao.id}`}>
                                  <a href={reuniao.ata.pdfUrl} target="_blank" rel="noopener noreferrer" download>
                                    <FileDown className="w-4 h-4 mr-2" />
                                    Baixar PDF
                                  </a>
                                </Button>
                              )}
                              {podeEditar && reuniao.ata && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => gerarPdfAtaMutation.mutate(reuniao.ata!.id)}
                                  disabled={gerarPdfAtaMutation.isPending}
                                  data-testid={`button-gerar-pdf-ata-${reuniao.id}`}
                                >
                                  {gerarPdfAtaMutation.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Gerando...
                                    </>
                                  ) : (
                                    <>
                                      <FileDown className="w-4 h-4 mr-2" />
                                      Gerar PDF
                                    </>
                                  )}
                                </Button>
                              )}
                              {!reuniao.ata?.aprovada && podeEditar && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => aprovarAta(reuniao.ata!.id)}
                                  disabled={aprovarAtaMutation.isPending}
                                  data-testid={`button-aprovar-ata-tab-${reuniao.id}`}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Aprovar Ata
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg text-sm font-sans">
                              {reuniao.ata?.conteudo}
                            </pre>
                          </div>
                          {reuniao.ata?.aprovada && reuniao.ata?.dataAprovacao && (
                            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                              Aprovada em {new Date(reuniao.ata.dataAprovacao).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
