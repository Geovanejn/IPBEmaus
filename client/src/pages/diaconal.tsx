import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart,
  Plus,
  ShoppingBasket,
  Home,
  Handshake,
  DollarSign,
  Calendar,
  User,
} from "lucide-react";
import { type AcaoDiaconal } from "@shared/schema";

export default function Diaconal() {
  const { temPermissao } = useAuth();
  const [dialogNovaAcao, setDialogNovaAcao] = useState(false);

  const podeEditar = temPermissao("diaconal", "total");

  // Mock data para demonstração visual
  const acoes: (AcaoDiaconal & { responsavelNome?: string })[] = [
    {
      id: "1",
      tipo: "cesta_basica",
      descricao: "Distribuição de cesta básica para família carente",
      beneficiario: "Família Silva",
      telefone: "(11) 98765-1111",
      endereco: "Rua das Acácias, 45 - Jardim São Paulo",
      valorGasto: 15000, // R$ 150,00
      data: "2024-11-01",
      responsavelId: "dc1",
      observacoes: "Família com 5 pessoas, incluindo 3 crianças",
      criadoEm: new Date(),
      responsavelNome: "Dc. Carlos Costa",
    },
    {
      id: "2",
      tipo: "visita",
      descricao: "Visita a irmão enfermo",
      beneficiario: "João Pedro Oliveira",
      telefone: "(11) 98765-2222",
      endereco: "Rua Esperança, 123 - Apto 45",
      valorGasto: null,
      data: "2024-11-02",
      responsavelId: "dc1",
      observacoes: "Oração e leitura bíblica realizada. Família agradecida.",
      criadoEm: new Date(),
      responsavelNome: "Dc. Carlos Costa",
    },
    {
      id: "3",
      tipo: "ajuda_financeira",
      descricao: "Auxílio para pagamento de conta de luz",
      beneficiario: "Maria das Graças",
      telefone: "(11) 98765-3333",
      endereco: "Rua do Comércio, 789",
      valorGasto: 28000, // R$ 280,00
      data: "2024-11-03",
      responsavelId: "dc1",
      observacoes: "Situação emergencial - conta em atraso",
      criadoEm: new Date(),
      responsavelNome: "Dc. Carlos Costa",
    },
    {
      id: "4",
      tipo: "oracao",
      descricao: "Reunião de oração com família enlutada",
      beneficiario: "Família Santos",
      telefone: "(11) 98765-4444",
      endereco: "Av. Central, 567",
      valorGasto: null,
      data: "2024-11-04",
      responsavelId: "dc1",
      observacoes: "Momento de consolo e apoio espiritual",
      criadoEm: new Date(),
      responsavelNome: "Dc. Carlos Costa",
    },
  ];

  const totalGasto = acoes
    .filter((a) => a.valorGasto)
    .reduce((sum, a) => sum + (a.valorGasto || 0), 0);

  const acoesPorTipo = {
    cesta_basica: acoes.filter((a) => a.tipo === "cesta_basica").length,
    visita: acoes.filter((a) => a.tipo === "visita").length,
    ajuda_financeira: acoes.filter((a) => a.tipo === "ajuda_financeira").length,
    oracao: acoes.filter((a) => a.tipo === "oracao").length,
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="w-8 h-8" />
            Módulo Diaconal
          </h1>
          <p className="text-muted-foreground mt-1">Registro de ações sociais e assistência</p>
        </div>
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
              <form className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoAcao">Tipo de Ação *</Label>
                    <Select>
                      <SelectTrigger id="tipoAcao">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cesta_basica">Cesta Básica</SelectItem>
                        <SelectItem value="visita">Visita</SelectItem>
                        <SelectItem value="oracao">Oração</SelectItem>
                        <SelectItem value="ajuda_financeira">Ajuda Financeira</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataAcao">Data *</Label>
                    <Input id="dataAcao" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="beneficiario">Nome do Beneficiário *</Label>
                    <Input id="beneficiario" placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefoneBenef">Telefone</Label>
                    <Input id="telefoneBenef" placeholder="(11) 98765-4321" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorGasto">Valor Gasto (R$)</Label>
                    <Input id="valorGasto" type="number" step="0.01" placeholder="0,00" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="enderecoBenef">Endereço</Label>
                    <Input id="enderecoBenef" placeholder="Rua, número, bairro" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="descricaoAcao">Descrição da Ação *</Label>
                    <Textarea id="descricaoAcao" placeholder="Descreva a ação realizada" rows={3} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="observacoesAcao">Observações</Label>
                    <Textarea id="observacoesAcao" placeholder="Informações adicionais (opcional)" rows={2} />
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    ℹ️ Se informar um valor gasto, o sistema criará automaticamente uma despesa no Módulo Financeiro com centro de custo "Social".
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogNovaAcao(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Ação</Button>
                </div>
              </form>
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
            {acoes
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
    </div>
  );
}
