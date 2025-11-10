import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";
import { type TransacaoFinanceira } from "@shared/schema";

export default function Financeiro() {
  const { temPermissao } = useAuth();
  const [dialogNovaTransacao, setDialogNovaTransacao] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState<"receita" | "despesa">("receita");

  const podeEditar = temPermissao("financeiro", "total");

  // Mock data para demonstração visual
  const transacoes: (TransacaoFinanceira & { membroNome?: string })[] = [
    {
      id: "1",
      tipo: "receita",
      categoria: "dizimo",
      descricao: "Dízimo - Maria Silva Santos",
      valor: 50000, // R$ 500,00
      data: "2024-11-03",
      membroId: "1",
      centroCusto: "geral",
      metodoPagamento: "transferencia",
      comprovante: null,
      observacoes: null,
      criadoPorId: "user1",
      criadoEm: new Date(),
      membroNome: "Maria Silva Santos",
    },
    {
      id: "2",
      tipo: "receita",
      categoria: "oferta",
      descricao: "Oferta de Missões",
      valor: 120000, // R$ 1.200,00
      data: "2024-11-03",
      membroId: null,
      centroCusto: "missoes",
      metodoPagamento: "dinheiro",
      comprovante: null,
      observacoes: "Culto dominical",
      criadoPorId: "user1",
      criadoEm: new Date(),
    },
    {
      id: "3",
      tipo: "despesa",
      categoria: "despesa_geral",
      descricao: "Energia Elétrica - Outubro",
      valor: 85000, // R$ 850,00
      data: "2024-11-01",
      membroId: null,
      centroCusto: "geral",
      metodoPagamento: "transferencia",
      comprovante: null,
      observacoes: null,
      criadoPorId: "user1",
      criadoEm: new Date(),
    },
    {
      id: "4",
      tipo: "despesa",
      categoria: "despesa_social",
      descricao: "Cestas Básicas",
      valor: 45000, // R$ 450,00
      data: "2024-11-02",
      membroId: null,
      centroCusto: "social",
      metodoPagamento: "dinheiro",
      comprovante: null,
      observacoes: "Distribuição diaconal",
      criadoPorId: "user1",
      criadoEm: new Date(),
    },
  ];

  const totalReceitas = transacoes
    .filter((t) => t.tipo === "receita")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDespesas = transacoes
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Transação Financeira</DialogTitle>
                <DialogDescription>
                  Cadastre uma receita ou despesa da igreja
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoTransacao">Tipo *</Label>
                    <Select value={tipoTransacao} onValueChange={(v) => setTipoTransacao(v as "receita" | "despesa")}>
                      <SelectTrigger id="tipoTransacao">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$) *</Label>
                    <Input id="valor" type="number" step="0.01" placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select>
                      <SelectTrigger id="categoria">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {tipoTransacao === "receita" ? (
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data">Data *</Label>
                    <Input id="data" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="centroCusto">Centro de Custo</Label>
                    <Select defaultValue="geral">
                      <SelectTrigger id="centroCusto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="geral">Geral</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="missoes">Missões</SelectItem>
                        <SelectItem value="obras">Obras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metodoPagamento">Método de Pagamento</Label>
                    <Select>
                      <SelectTrigger id="metodoPagamento">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input id="descricao" placeholder="Descreva a transação" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input id="observacoes" placeholder="Informações adicionais (opcional)" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogNovaTransacao(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Transação</Button>
                </div>
              </form>
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
                {transacoes
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
                {transacoes
                  .filter((t) => t.tipo === "receita")
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
                {transacoes
                  .filter((t) => t.tipo === "despesa")
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
