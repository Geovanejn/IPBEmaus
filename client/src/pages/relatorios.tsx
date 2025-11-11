import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Users,
  DollarSign,
  Heart,
  Calendar,
  TrendingUp,
  TrendingDown,
  Loader2,
  BarChart3,
} from "lucide-react";

export default function Relatorios() {
  const { temPermissao } = useAuth();
  const { toast } = useToast();
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Query para relatório pastoral
  const { data: relatorioPastoral, isLoading: loadingPastoral, refetch: refetchPastoral } = useQuery({
    queryKey: ["/api/relatorios/pastoral", dataInicio, dataFim],
    enabled: temPermissao("pastoral", "leitura") && !!dataInicio && !!dataFim,
  });

  // Query para relatório financeiro
  const { data: relatorioFinanceiro, isLoading: loadingFinanceiro, refetch: refetchFinanceiro } = useQuery({
    queryKey: ["/api/relatorios/financeiro", dataInicio, dataFim],
    enabled: temPermissao("financeiro", "leitura") && !!dataInicio && !!dataFim,
  });

  // Query para relatório diaconal
  const { data: relatorioDiaconal, isLoading: loadingDiaconal, refetch: refetchDiaconal } = useQuery({
    queryKey: ["/api/relatorios/diaconal", dataInicio, dataFim],
    enabled: temPermissao("diaconal", "leitura") && !!dataInicio && !!dataFim,
  });

  const exportarRelatorio = (tipo: string) => {
    const params = new URLSearchParams();
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);

    const url = `/api/relatorios/export/${tipo}?${params.toString()}`;
    
    // Cria um link temporário para download
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download iniciado",
      description: `Relatório ${tipo} está sendo baixado.`,
    });
  };

  const gerarRelatorios = () => {
    if (!dataInicio || !dataFim) {
      toast({
        title: "Selecione o período",
        description: "Informe a data de início e fim para gerar os relatórios.",
        variant: "destructive",
      });
      return;
    }

    if (temPermissao("pastoral", "leitura")) refetchPastoral();
    if (temPermissao("financeiro", "leitura")) refetchFinanceiro();
    if (temPermissao("diaconal", "leitura")) refetchDiaconal();
  };

  const formatarValor = (centavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Relatórios e Análises
        </h1>
        <p className="text-muted-foreground mt-1">Visualize e exporte relatórios detalhados</p>
      </div>

      {/* Filtros de período */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Período</CardTitle>
          <CardDescription>Selecione as datas de início e fim para gerar os relatórios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                data-testid="input-data-inicio"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                data-testid="input-data-fim"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={gerarRelatorios} className="w-full" data-testid="button-gerar-relatorios">
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatórios
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de relatórios */}
      <Tabs defaultValue="pastoral" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {temPermissao("pastoral", "leitura") && (
            <TabsTrigger value="pastoral" data-testid="tab-pastoral">
              <Users className="w-4 h-4 mr-2" />
              Pastoral
            </TabsTrigger>
          )}
          {temPermissao("financeiro", "leitura") && (
            <TabsTrigger value="financeiro" data-testid="tab-financeiro">
              <DollarSign className="w-4 h-4 mr-2" />
              Financeiro
            </TabsTrigger>
          )}
          {temPermissao("diaconal", "leitura") && (
            <TabsTrigger value="diaconal" data-testid="tab-diaconal">
              <Heart className="w-4 h-4 mr-2" />
              Diaconal
            </TabsTrigger>
          )}
        </TabsList>

        {/* Relatório Pastoral */}
        {temPermissao("pastoral", "leitura") && (
          <TabsContent value="pastoral" className="space-y-4">
            {loadingPastoral ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : relatorioPastoral ? (
              <>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => exportarRelatorio("pastoral")}
                    data-testid="button-exportar-pastoral"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{relatorioPastoral.resumo.totalMembros}</div>
                      <p className="text-xs text-muted-foreground">
                        {relatorioPastoral.resumo.membrosAtivos} ativos
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Novos Membros</CardTitle>
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{relatorioPastoral.resumo.novosMembrosPeriodo}</div>
                      <p className="text-xs text-muted-foreground">No período selecionado</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Aniversariantes</CardTitle>
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{relatorioPastoral.resumo.aniversariantesMes}</div>
                      <p className="text-xs text-muted-foreground">Neste mês</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Visitantes por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium">Novos</p>
                        <p className="text-2xl font-bold">{relatorioPastoral.visitantesPorStatus.novo}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Em Acompanhamento</p>
                        <p className="text-2xl font-bold">{relatorioPastoral.visitantesPorStatus.em_acompanhamento}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Tornaram-se Membros</p>
                        <p className="text-2xl font-bold">{relatorioPastoral.visitantesPorStatus.membro}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Inativos</p>
                        <p className="text-2xl font-bold">{relatorioPastoral.visitantesPorStatus.inativo}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {relatorioPastoral.novosMembros.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Novos Membros no Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {relatorioPastoral.novosMembros.map((membro: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">{membro.nome}</p>
                              <p className="text-sm text-muted-foreground">{membro.email || "Sem email"}</p>
                            </div>
                            <Badge>{membro.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Selecione um período e clique em "Gerar Relatórios" para visualizar os dados.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Relatório Financeiro */}
        {temPermissao("financeiro", "leitura") && (
          <TabsContent value="financeiro" className="space-y-4">
            {loadingFinanceiro ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : relatorioFinanceiro ? (
              <>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => exportarRelatorio("financeiro")}
                    data-testid="button-exportar-financeiro"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatarValor(relatorioFinanceiro.resumo.totalReceitas)}
                      </div>
                      <p className="text-xs text-muted-foreground">No período</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatarValor(relatorioFinanceiro.resumo.totalDespesas)}
                      </div>
                      <p className="text-xs text-muted-foreground">No período</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${relatorioFinanceiro.resumo.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatarValor(relatorioFinanceiro.resumo.saldo)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {relatorioFinanceiro.resumo.totalTransacoes} transações
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Receitas por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(relatorioFinanceiro.receitasPorCategoria).map(([categoria, valor]: [string, any]) => (
                          <div key={categoria} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{categoria.replace("_", " ")}</span>
                            <span className="font-medium text-green-600">{formatarValor(valor)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Despesas por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(relatorioFinanceiro.despesasPorCategoria).map(([categoria, valor]: [string, any]) => (
                          <div key={categoria} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{categoria.replace("_", " ")}</span>
                            <span className="font-medium text-red-600">{formatarValor(valor)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Por Centro de Custo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(relatorioFinanceiro.porCentroCusto).map(([centro, dados]: [string, any]) => (
                        <div key={centro} className="p-3 bg-muted rounded-lg">
                          <p className="font-medium capitalize mb-2">{centro}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Receitas: </span>
                              <span className="font-medium text-green-600">{formatarValor(dados.receitas)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Despesas: </span>
                              <span className="font-medium text-red-600">{formatarValor(dados.despesas)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Selecione um período e clique em "Gerar Relatórios" para visualizar os dados.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Relatório Diaconal */}
        {temPermissao("diaconal", "leitura") && (
          <TabsContent value="diaconal" className="space-y-4">
            {loadingDiaconal ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : relatorioDiaconal ? (
              <>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => exportarRelatorio("diaconal")}
                    data-testid="button-exportar-diaconal"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Ações</CardTitle>
                      <Heart className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{relatorioDiaconal.resumo.totalAcoes}</div>
                      <p className="text-xs text-muted-foreground">No período</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Valor Investido</CardTitle>
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatarValor(relatorioDiaconal.resumo.valorTotalGasto)}
                      </div>
                      <p className="text-xs text-muted-foreground">Total gasto</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Beneficiários</CardTitle>
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{relatorioDiaconal.resumo.beneficiariosAtendidos}</div>
                      <p className="text-xs text-muted-foreground">Pessoas atendidas</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Ações por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(relatorioDiaconal.acoesPorTipo).map(([tipo, quantidade]: [string, any]) => (
                        <div key={tipo} className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground capitalize">{tipo.replace("_", " ")}</p>
                          <p className="text-2xl font-bold">{quantidade}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {relatorioDiaconal.acoes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ações Realizadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {relatorioDiaconal.acoes.map((acao: any) => (
                          <div key={acao.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{acao.beneficiario}</p>
                              <p className="text-sm text-muted-foreground">{acao.descricao}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(acao.data + "T00:00:00").toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="mb-1 capitalize">
                                {acao.tipo.replace("_", " ")}
                              </Badge>
                              {acao.valorGasto > 0 && (
                                <p className="text-sm font-medium">{formatarValor(acao.valorGasto)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Selecione um período e clique em "Gerar Relatórios" para visualizar os dados.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
