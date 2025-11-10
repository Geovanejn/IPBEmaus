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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  Filter,
  Receipt,
  DollarSign,
  Loader2,
} from "lucide-react";
import { type TransacaoFinanceira, type Membro, insertTransacaoFinanceiraSchema } from "@shared/schema";

const transacaoFormSchema = insertTransacaoFinanceiraSchema.extend({
  valor: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return Math.round(num * 100); // Converter para centavos
    }
    return val;
  }),
});

type TransacaoFormData = z.infer<typeof transacaoFormSchema>;

export default function Financeiro() {
  const { usuario, temPermissao } = useAuth();
  const { toast } = useToast();
  const [dialogNovaTransacao, setDialogNovaTransacao] = useState(false);

  const podeEditar = temPermissao("financeiro", "total");

  const { data: transacoes = [], isLoading: isLoadingTransacoes, isError: isErrorTransacoes, refetch: refetchTransacoes } = useQuery<TransacaoFinanceira[]>({
    queryKey: ["/api/transacoes-financeiras"],
  });

  const { data: membros = [], isError: isErrorMembros, refetch: refetchMembros } = useQuery<Membro[]>({
    queryKey: ["/api/membros"],
  });

  const form = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoFormSchema),
    defaultValues: {
      tipo: "receita",
      categoria: "dizimo",
      descricao: "",
      valor: 0,
      data: new Date().toISOString().split("T")[0],
      membroId: null,
      centroCusto: "geral",
      metodoPagamento: null,
      comprovante: null,
      observacoes: null,
      criadoPorId: usuario?.id || "",
    },
  });

  const criarTransacaoMutation = useMutation({
    mutationFn: async (dados: z.infer<typeof transacaoFormSchema>) => {
      const res = await apiRequest("POST", "/api/transacoes-financeiras", dados);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes-financeiras"] });
      toast({
        title: "Transação registrada",
        description: "A transação foi registrada com sucesso",
      });
      setDialogNovaTransacao(false);
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao registrar transação",
        description: "Ocorreu um erro ao salvar a transação. Tente novamente.",
      });
    },
  });

  const onSubmit = (dados: z.infer<typeof transacaoFormSchema>) => {
    criarTransacaoMutation.mutate(dados);
  };

  if (isLoadingTransacoes) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isErrorTransacoes || isErrorMembros) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Erro ao carregar dados. Tente novamente.</p>
        <Button onClick={() => { refetchTransacoes(); refetchMembros(); }} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const transacoesComMembroNome: (TransacaoFinanceira & { membroNome?: string })[] = transacoes.map(t => {
    const membro = membros.find(m => m.id === t.membroId);
    return {
      ...t,
      membroNome: membro?.nome
    };
  });

  // Valores já vêm em centavos do backend (integers)
  const totalReceitas = transacoesComMembroNome
    .filter((t) => t.tipo === "receita")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDespesas = transacoesComMembroNome
    .filter((t) => t.tipo === "despesa")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  const formatarMoeda = (centavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  };

  const categoriaLabels = {
    dizimo: "Dízimo",
    oferta: "Oferta",
    despesa_geral: "Despesa Geral",
    despesa_social: "Despesa Social",
  };

  const centroCustoLabels = {
    geral: "Geral",
    social: "Social",
    missoes: "Missões",
    obras: "Obras",
  };

  const metodoPagamentoLabels = {
    dinheiro: "Dinheiro",
    transferencia: "Transferência",
    pix: "PIX",
    cartao: "Cartão",
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-8 h-8" />
            Módulo Financeiro
          </h1>
          <p className="text-muted-foreground mt-1">Controle de receitas e despesas</p>
        </div>
        {podeEditar && (
          <Dialog open={dialogNovaTransacao} onOpenChange={setDialogNovaTransacao}>
            <DialogTrigger asChild>
              <Button data-testid="button-nova-transacao">
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Transação Financeira</DialogTitle>
                <DialogDescription>
                  Cadastre uma receita ou despesa da igreja
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
                          <FormLabel>Tipo *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="receita">Receita</SelectItem>
                              <SelectItem value="despesa">Despesa</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$) *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {form.watch("tipo") === "receita" ? (
                                <>
                                  <SelectItem value="dizimo">Dízimo</SelectItem>
                                  <SelectItem value="oferta">Oferta</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="despesa_geral">Despesa Geral</SelectItem>
                                  <SelectItem value="despesa_social">Despesa Social</SelectItem>
                                </>
                              )}
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
                            <Input type="date" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="centroCusto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Centro de Custo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "geral"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="geral">Geral</SelectItem>
                              <SelectItem value="social">Social</SelectItem>
                              <SelectItem value="missoes">Missões</SelectItem>
                              <SelectItem value="obras">Obras</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="metodoPagamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Pagamento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="transferencia">Transferência</SelectItem>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="cartao">Cartão</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Descrição *</FormLabel>
                          <FormControl>
                            <Input placeholder="Descreva a transação" {...field} />
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
                            <Textarea 
                              placeholder="Informações adicionais (opcional)" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogNovaTransacao(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={criarTransacaoMutation.isPending} data-testid="button-salvar-transacao">
                      {criarTransacaoMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Salvar Transação"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-green-600">
              {formatarMoeda(totalReceitas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-red-600">
              {formatarMoeda(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatarMoeda(saldo)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Saldo atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Transações */}
      <Tabs defaultValue="todas" className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="todas" data-testid="tab-todas">Todas</TabsTrigger>
            <TabsTrigger value="receitas" data-testid="tab-receitas">Receitas</TabsTrigger>
            <TabsTrigger value="despesas" data-testid="tab-despesas">Despesas</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <TabsContent value="todas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Financeiras</CardTitle>
              <CardDescription>Histórico completo de transações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transacoesComMembroNome
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .map((transacao) => (
                    <div
                      key={transacao.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                      data-testid={`transacao-${transacao.id}`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-full ${
                          transacao.tipo === "receita" 
                            ? "bg-green-50 dark:bg-green-950" 
                            : "bg-red-50 dark:bg-red-950"
                        } flex items-center justify-center flex-shrink-0`}>
                          {transacao.tipo === "receita" ? (
                            <TrendingUp className="w-6 h-6 text-green-600" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{transacao.descricao}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                            <span>{new Date(transacao.data).toLocaleDateString("pt-BR")}</span>
                            <Badge variant="secondary" className="text-xs">
                              {categoriaLabels[transacao.categoria as keyof typeof categoriaLabels]}
                            </Badge>
                            {transacao.centroCusto && (
                              <span className="text-xs">
                                {centroCustoLabels[transacao.centroCusto as keyof typeof centroCustoLabels]}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-mono font-bold ${
                            transacao.tipo === "receita" ? "text-green-600" : "text-red-600"
                          }`}>
                            {transacao.tipo === "receita" ? "+" : "-"} {formatarMoeda(transacao.valor)}
                          </p>
                          {transacao.metodoPagamento && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {metodoPagamentoLabels[transacao.metodoPagamento as keyof typeof metodoPagamentoLabels]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Button variant="ghost" size="icon">
                          <Receipt className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receitas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receitas</CardTitle>
              <CardDescription>Dízimos, ofertas e entradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transacoesComMembroNome
                  .filter((t) => t.tipo === "receita")
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .map((transacao) => (
                    <div
                      key={transacao.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{transacao.descricao}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {new Date(transacao.data).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <p className="text-lg font-mono font-bold text-green-600">
                          + {formatarMoeda(transacao.valor)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas</CardTitle>
              <CardDescription>Gastos e saídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transacoesComMembroNome
                  .filter((t) => t.tipo === "despesa")
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .map((transacao) => (
                    <div
                      key={transacao.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
                          <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{transacao.descricao}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {new Date(transacao.data).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <p className="text-lg font-mono font-bold text-red-600">
                          - {formatarMoeda(transacao.valor)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
