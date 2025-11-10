import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Membro, Visitante, TransacaoFinanceira, AcaoDiaconal } from "@shared/schema";
import {
  Users,
  Wallet,
  Heart,
  Newspaper,
  FileText,
  TrendingUp,
  Calendar,
  UserPlus,
  DollarSign,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const { usuario, temPermissao } = useAuth();
  const [, setLocation] = useLocation();

  const { data: membros = [] } = useQuery<Membro[]>({ queryKey: ["/api/membros"], enabled: !!usuario && temPermissao("pastoral") });
  const { data: visitantes = [] } = useQuery<Visitante[]>({ queryKey: ["/api/visitantes"], enabled: !!usuario && temPermissao("pastoral") });
  const { data: transacoes = [] } = useQuery<TransacaoFinanceira[]>({ queryKey: ["/api/transacoes-financeiras"], enabled: !!usuario && temPermissao("financeiro") });
  const { data: acoesDiaconais = [] } = useQuery<AcaoDiaconal[]>({ queryKey: ["/api/acoes-diaconais"], enabled: !!usuario && temPermissao("diaconal") });

  if (!usuario) return null;

  const membrosAtivos = membros.filter(m => m.status === "ATIVO").length;
  
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  
  const transacoesEsteMes = transacoes.filter(t => {
    const data = new Date(t.data);
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  });
  
  const receitaEsteMes = transacoesEsteMes
    .filter(t => t.tipo === "RECEITA")
    .reduce((sum, t) => sum + parseFloat(t.valor.toString()), 0);
  
  const visitantesEsteMes = visitantes.filter(v => {
    const data = new Date(v.dataVisita);
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  }).length;
  
  const acoesDiaconaisEsteMes = acoesDiaconais.filter(a => {
    const data = new Date(a.dataRealizacao);
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  }).length;

  const stats = [
    {
      titulo: "Membros Ativos",
      valor: membrosAtivos.toString(),
      icone: Users,
      tendencia: `${membros.length} total`,
      cor: "text-blue-600",
      bgCor: "bg-blue-50 dark:bg-blue-950",
      modulo: "pastoral" as const,
    },
    {
      titulo: "Dízimos e Ofertas",
      valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaEsteMes),
      icone: DollarSign,
      tendencia: "Este mês",
      cor: "text-green-600",
      bgCor: "bg-green-50 dark:bg-green-950",
      modulo: "financeiro" as const,
    },
    {
      titulo: "Visitantes",
      valor: visitantesEsteMes.toString(),
      icone: UserPlus,
      tendencia: "Este mês",
      cor: "text-purple-600",
      bgCor: "bg-purple-50 dark:bg-purple-950",
      modulo: "pastoral" as const,
    },
    {
      titulo: "Ações Diaconais",
      valor: acoesDiaconaisEsteMes.toString(),
      icone: Heart,
      tendencia: "Este mês",
      cor: "text-rose-600",
      bgCor: "bg-rose-50 dark:bg-rose-950",
      modulo: "diaconal" as const,
    },
  ];

  const acoesRapidas = [
    {
      titulo: "Cadastrar Membro",
      descricao: "Adicionar novo membro à igreja",
      icone: Users,
      rota: "/pastoral?acao=novo-membro",
      modulo: "pastoral" as const,
      permissaoNecessaria: "total" as const,
    },
    {
      titulo: "Lançar Dízimo",
      descricao: "Registrar dízimo ou oferta",
      icone: Wallet,
      rota: "/financeiro?acao=nova-transacao",
      modulo: "financeiro" as const,
      permissaoNecessaria: "total" as const,
    },
    {
      titulo: "Registrar Ação Social",
      descricao: "Cadastrar nova ação diaconal",
      icone: Heart,
      rota: "/diaconal?acao=nova-acao",
      modulo: "diaconal" as const,
      permissaoNecessaria: "total" as const,
    },
    {
      titulo: "Criar Boletim",
      descricao: "Novo boletim dominical",
      icone: Newspaper,
      rota: "/boletim?acao=novo-boletim",
      modulo: "boletim" as const,
      permissaoNecessaria: "total" as const,
    },
  ];

  const proximosEventos = [
    { titulo: "Culto de Celebração", data: "Domingo, 10:00", tipo: "culto" },
    { titulo: "Reunião do Conselho", data: "Terça, 19:30", tipo: "reuniao" },
    { titulo: "Escola Bíblica Dominical", data: "Domingo, 09:00", tipo: "ebd" },
    { titulo: "Grupo de Oração", data: "Quarta, 20:00", tipo: "oracao" },
  ];

  const aniversariantes = membros
    .filter(m => m.dataNascimento)
    .map(m => {
      const hoje = new Date();
      const nascimento = new Date(m.dataNascimento!);
      const proximoAniversario = new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate());
      
      if (proximoAniversario < hoje) {
        proximoAniversario.setFullYear(hoje.getFullYear() + 1);
      }
      
      const diasAteAniversario = Math.floor((proximoAniversario.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      let dataTexto;
      if (diasAteAniversario === 0) dataTexto = "Hoje";
      else if (diasAteAniversario === 1) dataTexto = "Amanhã";
      else dataTexto = proximoAniversario.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      
      return { nome: m.nome, data: dataTexto, dias: diasAteAniversario };
    })
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 5);

  const cargoLabels = {
    PASTOR: "Pastor",
    PRESBITERO: "Presbítero",
    TESOUREIRO: "Tesoureiro",
    DIACONO: "Diácono",
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-titulo">
          Bem-vindo, {usuario.nome.split(" ")[0]}!
        </h1>
        <div className="text-muted-foreground mt-1 flex items-center gap-2">
          <span>Cargo:</span>
          <Badge variant="secondary">{cargoLabels[usuario.cargo]}</Badge>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icone;
          const temAcesso = temPermissao(stat.modulo);
          
          return (
            <Card key={stat.titulo} className={!temAcesso ? "opacity-50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.titulo}</CardTitle>
                <div className={`w-8 h-8 rounded-lg ${stat.bgCor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.cor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stat.valor}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.tendencia}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            <CardDescription>Tarefas comuns do seu cargo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {acoesRapidas
              .filter((acao) => temPermissao(acao.modulo, acao.permissaoNecessaria))
              .map((acao) => {
                const Icon = acao.icone;
                return (
                  <Button
                    key={acao.rota}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => setLocation(acao.rota)}
                    data-testid={`button-${acao.titulo.toLowerCase().replace(/ /g, "-")}`}
                  >
                    <div className="flex items-start gap-3 flex-1 text-left">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{acao.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{acao.descricao}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1.5" />
                    </div>
                  </Button>
                );
              })}
          </CardContent>
        </Card>

        {/* Próximos Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>Calendário semanal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {proximosEventos.map((evento, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-card hover-elevate">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{evento.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{evento.data}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Aniversariantes */}
        {temPermissao("pastoral") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Aniversariantes
              </CardTitle>
              <CardDescription>Próximos aniversários</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aniversariantes.map((pessoa, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-card hover-elevate">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {pessoa.nome.split(" ")[0][0]}{pessoa.nome.split(" ")[1]?.[0]}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{pessoa.nome}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{pessoa.data}</Badge>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setLocation("/pastoral")}>
                Ver todos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Saldo Financeiro - apenas para Tesoureiro e Pastor */}
        {temPermissao("financeiro") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Resumo Financeiro
              </CardTitle>
              <CardDescription>Mês atual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Receitas</span>
                  <span className="text-sm font-mono font-medium text-green-600">+ R$ 32.450</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Despesas</span>
                  <span className="text-sm font-mono font-medium text-red-600">- R$ 18.320</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Saldo</span>
                    <span className="text-lg font-mono font-bold text-primary">R$ 14.130</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setLocation("/financeiro")}>
                Ver detalhes
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
