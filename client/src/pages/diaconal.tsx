import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Heart,
  Plus,
  ShoppingBasket,
  Home,
  Handshake,
  DollarSign,
  Calendar,
  User,
  Loader2,
  UserPlus,
  Mail,
  Phone,
} from "lucide-react";
import { type AcaoDiaconal, type Usuario, type Visitante, insertAcaoDiaconalSchema, insertVisitanteSchema } from "@shared/schema";

const acaoDiaconalFormSchema = insertAcaoDiaconalSchema.extend({
  valorGasto: z.union([z.string(), z.number(), z.null()]).transform((val) => {
    if (!val || val === "") return null;
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? null : Math.round(num * 100);
    }
    return val;
  }).nullable(),
});

type AcaoDiaconalFormData = z.infer<typeof acaoDiaconalFormSchema>;
type VisitanteFormData = z.infer<typeof insertVisitanteSchema>;

export default function Diaconal() {
  const { usuario, temPermissao } = useAuth();
  const { toast } = useToast();
  const [dialogNovaAcao, setDialogNovaAcao] = useState(false);
  const [dialogNovoVisitante, setDialogNovoVisitante] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("acoes");

  const podeEditar = temPermissao("diaconal", "total");

  const { data: acoes = [], isLoading: isLoadingAcoes, isError: isErrorAcoes, refetch: refetchAcoes } = useQuery<AcaoDiaconal[]>({
    queryKey: ["/api/acoes-diaconais"],
  });

  const { data: usuarios = [], isError: isErrorUsuarios, refetch: refetchUsuarios } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios"],
  });

  const { data: visitantes = [], isLoading: isLoadingVisitantes, isError: isErrorVisitantes, refetch: refetchVisitantes } = useQuery<Visitante[]>({
    queryKey: ["/api/visitantes"],
  });

  const form = useForm<AcaoDiaconalFormData>({
    resolver: zodResolver(acaoDiaconalFormSchema),
    defaultValues: {
      tipo: "cesta_basica",
      descricao: "",
      beneficiario: "",
      telefone: null,
      endereco: null,
      valorGasto: null,
      data: new Date().toISOString().split("T")[0],
      responsavelId: usuario?.id || "",
      observacoes: null,
    },
  });

  const formVisitante = useForm<VisitanteFormData>({
    resolver: zodResolver(insertVisitanteSchema),
    defaultValues: {
      nome: "",
      email: null,
      telefone: null,
      endereco: null,
      comoConheceu: null,
      membroConvidouId: null,
      dataVisita: new Date().toISOString().split("T")[0],
      observacoes: null,
      status: "novo",
      consentimentoLGPD: true,
    },
  });

  const criarAcaoMutation = useMutation({
    mutationFn: async (dados: AcaoDiaconalFormData) => {
      const res = await apiRequest("POST", "/api/acoes-diaconais", dados);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acoes-diaconais"] });
      toast({
        title: "Ação registrada",
        description: "A ação diaconal foi registrada com sucesso",
      });
      setDialogNovaAcao(false);
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao registrar ação",
        description: "Ocorreu um erro ao salvar a ação. Tente novamente.",
      });
    },
  });

  const criarVisitanteMutation = useMutation({
    mutationFn: async (dados: VisitanteFormData) => {
      const res = await apiRequest("POST", "/api/visitantes", dados);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitantes"] });
      toast({
        title: "Visitante cadastrado",
        description: "O visitante foi cadastrado com sucesso",
      });
      setDialogNovoVisitante(false);
      formVisitante.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar visitante",
        description: "Ocorreu um erro ao salvar o visitante. Tente novamente.",
      });
    },
  });

  const onSubmit = (dados: AcaoDiaconalFormData) => {
    criarAcaoMutation.mutate(dados);
  };

  if (isLoadingAcoes) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isErrorAcoes || isErrorUsuarios) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Erro ao carregar dados. Tente novamente.</p>
        <Button onClick={() => { refetchAcoes(); refetchUsuarios(); }} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const acoesComResponsavel: (AcaoDiaconal & { responsavelNome?: string })[] = acoes.map(a => {
    const responsavel = usuarios.find(u => u.id === a.responsavelId);
    return {
      ...a,
      responsavelNome: responsavel?.nome || `Responsável #${a.responsavelId.substring(0, 8)}`
    };
  });

  const totalGasto = acoesComResponsavel
    .filter((a) => a.valorGasto)
    .reduce((sum, a) => sum + (typeof a.valorGasto === 'number' ? a.valorGasto : 0), 0);

  const acoesPorTipo = {
    cesta_basica: acoesComResponsavel.filter((a) => a.tipo === "cesta_basica").length,
    visita: acoesComResponsavel.filter((a) => a.tipo === "visita").length,
    ajuda_financeira: acoesComResponsavel.filter((a) => a.tipo === "ajuda_financeira").length,
    oracao: acoesComResponsavel.filter((a) => a.tipo === "oracao").length,
  };

  const formatarMoeda = (centavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  };

  const tipoLabels = {
    cesta_basica: "Cesta Básica",
    visita: "Visita",
    oracao: "Oração",
    ajuda_financeira: "Ajuda Financeira",
    outro: "Outro",
  };

  const tipoIcons = {
    cesta_basica: ShoppingBasket,
    visita: Home,
    oracao: Handshake,
    ajuda_financeira: DollarSign,
    outro: Heart,
  };

  const tipoColors = {
    cesta_basica: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    visita: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    oracao: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    ajuda_financeira: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    outro: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="w-8 h-8" />
          Módulo Diaconal
        </h1>
        <p className="text-muted-foreground mt-1">Registro de ações sociais e assistência</p>
      </div>

      {/* Tabs */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="acoes" data-testid="tab-acoes">Ações Diaconais</TabsTrigger>
          <TabsTrigger value="visitantes" data-testid="tab-visitantes">Visitantes</TabsTrigger>
        </TabsList>

        {/* Aba de Ações Diaconais */}
        <TabsContent value="acoes" className="space-y-6">
          <div className="flex items-center justify-end gap-4 flex-wrap">
            {podeEditar && (
              <Dialog open={dialogNovaAcao} onOpenChange={setDialogNovaAcao}>
            <DialogTrigger asChild>
              <Button data-testid="button-nova-acao">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Ação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Ação Diaconal</DialogTitle>
                <DialogDescription>
                  Cadastre uma ação social realizada pela diaconia
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Ação *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cesta_basica">Cesta Básica</SelectItem>
                              <SelectItem value="visita">Visita</SelectItem>
                              <SelectItem value="oracao">Oração</SelectItem>
                              <SelectItem value="ajuda_financeira">Ajuda Financeira</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="data"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Descrição da Ação *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva a ação realizada" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="beneficiario"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nome do Beneficiário *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 98765-4321" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, bairro" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valorGasto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Gasto (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Informações adicionais (opcional)" rows={2} {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-muted/50 p-4 rounded-lg md:col-span-2">
                    <p className="text-sm text-muted-foreground">
                      ℹ️ Se informar um valor gasto, o sistema criará automaticamente uma despesa no Módulo Financeiro com centro de custo "Social".
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 md:col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogNovaAcao(false)}
                      data-testid="button-cancelar-acao"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={criarAcaoMutation.isPending}
                      data-testid="button-salvar-acao"
                    >
                      {criarAcaoMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Registrar Ação
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cestas Básicas</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <ShoppingBasket className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{acoesPorTipo.cesta_basica}</div>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Home className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{acoesPorTipo.visita}</div>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orações</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <Handshake className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{acoesPorTipo.oracao}</div>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Gasto</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-950 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatarMoeda(totalGasto)}</div>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ações Diaconais</CardTitle>
          <CardDescription>{acoes.length} ações registradas este mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {acoesComResponsavel
              .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
              .map((acao) => {
                const TipoIcon = tipoIcons[acao.tipo as keyof typeof tipoIcons];
                return (
                  <div
                    key={acao.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover-elevate"
                    data-testid={`acao-${acao.id}`}
                  >
                    <div className={`w-12 h-12 rounded-full ${
                      acao.tipo === "cesta_basica" ? "bg-green-50 dark:bg-green-950" :
                      acao.tipo === "visita" ? "bg-blue-50 dark:bg-blue-950" :
                      acao.tipo === "oracao" ? "bg-purple-50 dark:bg-purple-950" :
                      "bg-yellow-50 dark:bg-yellow-950"
                    } flex items-center justify-center flex-shrink-0`}>
                      <TipoIcon className={`w-6 h-6 ${
                        acao.tipo === "cesta_basica" ? "text-green-600" :
                        acao.tipo === "visita" ? "text-blue-600" :
                        acao.tipo === "oracao" ? "text-purple-600" :
                        "text-yellow-600"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{acao.descricao}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                            <Badge className={tipoColors[acao.tipo as keyof typeof tipoColors]}>
                              {tipoLabels[acao.tipo as keyof typeof tipoLabels]}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(acao.data).toLocaleDateString("pt-BR")}
                            </span>
                            {acao.valorGasto && (
                              <span className="flex items-center gap-1 font-mono font-medium text-yellow-600">
                                <DollarSign className="w-3 h-3" />
                                {formatarMoeda(acao.valorGasto)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span><strong>Beneficiário:</strong> {acao.beneficiario}</span>
                        </div>
                        {acao.telefone && (
                          <span className="text-muted-foreground">
                            {acao.telefone}
                          </span>
                        )}
                      </div>
                      {acao.endereco && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📍 {acao.endereco}
                        </p>
                      )}
                      {acao.observacoes && (
                        <p className="text-sm mt-2 p-3 bg-muted/30 rounded-md">
                          {acao.observacoes}
                        </p>
                      )}
                      {acao.responsavelNome && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Responsável: {acao.responsavelNome}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Aba de Visitantes */}
        <TabsContent value="visitantes" className="space-y-6">
          <div className="flex items-center justify-end gap-4 flex-wrap">
            {podeEditar && (
              <Dialog open={dialogNovoVisitante} onOpenChange={setDialogNovoVisitante}>
                <DialogTrigger asChild>
                  <Button data-testid="button-novo-visitante">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar Visitante
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Visitante</DialogTitle>
                    <DialogDescription>
                      Registre informações do visitante para acompanhamento diaconal
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...formVisitante}>
                    <form onSubmit={formVisitante.handleSubmit((data) => criarVisitanteMutation.mutate(data))} className="space-y-4 mt-4">
                      <FormField
                        control={formVisitante.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do visitante" {...field} data-testid="input-nome-visitante" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={formVisitante.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="email@exemplo.com" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={formVisitante.control}
                          name="telefone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input placeholder="(11) 98765-4321" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={formVisitante.control}
                        name="endereco"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, número, bairro" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={formVisitante.control}
                          name="dataVisita"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data da Visita *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={formVisitante.control}
                          name="comoConheceu"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Como conheceu a igreja?</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Convite de membro, redes sociais..." {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={formVisitante.control}
                        name="observacoes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Informações adicionais" rows={3} {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDialogNovoVisitante(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={criarVisitanteMutation.isPending} data-testid="button-salvar-visitante">
                          {criarVisitanteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Cadastrar
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Lista de Visitantes */}
          {isLoadingVisitantes ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : isErrorVisitantes ? (
            <div className="flex flex-col items-center justify-center h-32 gap-4">
              <p className="text-destructive">Erro ao carregar visitantes.</p>
              <Button onClick={() => refetchVisitantes()} variant="outline">Tentar Novamente</Button>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Visitantes Registrados
                </CardTitle>
                <CardDescription>Total: {visitantes.length} visitantes</CardDescription>
              </CardHeader>
              <CardContent>
                {visitantes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum visitante cadastrado</p>
                ) : (
                  <div className="space-y-4">
                    {visitantes.map((visitante) => (
                      <div key={visitante.id} className="p-4 border rounded-lg space-y-2 hover-elevate" data-testid={`visitante-${visitante.id}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold">{visitante.nome}</h4>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                              {visitante.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {visitante.email}
                                </span>
                              )}
                              {visitante.telefone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {visitante.telefone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(visitante.dataVisita).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                          <Badge variant={visitante.status === "novo" ? "default" : "secondary"}>
                            {visitante.status === "novo" ? "Novo" : visitante.status === "em_acompanhamento" ? "Em Acompanhamento" : visitante.status}
                          </Badge>
                        </div>
                        {visitante.endereco && (
                          <p className="text-sm text-muted-foreground">📍 {visitante.endereco}</p>
                        )}
                        {visitante.comoConheceu && (
                          <p className="text-sm text-muted-foreground">ℹ️ {visitante.comoConheceu}</p>
                        )}
                        {visitante.observacoes && (
                          <p className="text-sm mt-2 p-3 bg-muted/30 rounded-md">{visitante.observacoes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
