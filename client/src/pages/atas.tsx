import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";
import { type Reuniao, type Ata } from "@shared/schema";

export default function SecretariaAtas() {
  const { temPermissao } = useAuth();
  const [dialogNovaReuniao, setDialogNovaReuniao] = useState(false);
  const [dialogNovaAta, setDialogNovaAta] = useState(false);
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [novoParticipante, setNovoParticipante] = useState("");

  const podeEditar = temPermissao("atas", "total");

  // Mock data para demonstração visual
  const reunioes: (Reuniao & { ata?: Ata })[] = [
    {
      id: "r1",
      tipo: "conselho",
      data: new Date("2024-11-05T19:30:00"),
      local: "Sala do Conselho - Igreja IPB Emaús",
      participantes: ["Rev. João Silva", "Pb. Pedro Santos", "Pb. Maria Oliveira", "Pb. Carlos Costa"],
      status: "realizada",
      criadoEm: new Date("2024-11-01"),
      ata: {
        id: "a1",
        reuniaoId: "r1",
        conteudo: `# Ata da Reunião do Conselho

**Data:** 05 de novembro de 2024
**Horário:** 19:30
**Local:** Sala do Conselho - Igreja IPB Emaús

**Presentes:**
- Rev. João Silva (Pastor)
- Pb. Pedro Santos (Presbítero)
- Pb. Maria Oliveira (Presbítero)
- Pb. Carlos Costa (Presbítero)

## Pauta

### 1. Abertura e Devocional
A reunião foi aberta pelo Rev. João Silva com oração e leitura do Salmo 133.

### 2. Aprovação da Ata Anterior
A ata da reunião anterior foi lida e aprovada por unanimidade.

### 3. Relatório Pastoral
O pastor apresentou relatório das atividades pastorais do mês, incluindo visitações, estudos bíblicos e aconselhamentos realizados.

### 4. Relatório Financeiro
Foi apresentado o balanço financeiro do mês com saldo positivo. Aprovado por unanimidade.

### 5. Assuntos Gerais
- Aprovação do calendário de atividades para o próximo trimestre
- Discussão sobre o retiro de carnaval
- Planejamento da campanha de fim de ano

### 6. Encerramento
Não havendo mais assuntos a tratar, a reunião foi encerrada às 21:00 com oração.`,
        aprovada: true,
        dataAprovacao: new Date("2024-11-12"),
        aprovadoPorId: "pastor1",
        pdfUrl: "/atas/conselho-2024-11-05.pdf",
        bloqueada: true,
        secretarioId: "presbitero1",
        criadoEm: new Date("2024-11-06"),
      },
    },
    {
      id: "r2",
      tipo: "congregacao",
      data: new Date("2024-11-17T10:00:00"),
      local: "Templo Principal",
      participantes: [],
      status: "agendada",
      criadoEm: new Date("2024-11-10"),
    },
  ];

  const adicionarParticipante = () => {
    if (novoParticipante.trim()) {
      setParticipantes([...participantes, novoParticipante]);
      setNovoParticipante("");
    }
  };

  const removerParticipante = (index: number) => {
    setParticipantes(participantes.filter((_, i) => i !== index));
  };

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
          <div className="flex gap-2">
            <Dialog open={dialogNovaReuniao} onOpenChange={setDialogNovaReuniao}>
              <DialogTrigger asChild>
                <Button data-testid="button-nova-reuniao">
                  <Plus className="w-4 h-4 mr-2" />
                  Agendar Reunião
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agendar Nova Reunião</DialogTitle>
                  <DialogDescription>
                    Cadastre uma nova reunião oficial
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipoReuniao">Tipo de Reunião *</Label>
                      <Select>
                        <SelectTrigger id="tipoReuniao">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conselho">Conselho</SelectItem>
                          <SelectItem value="congregacao">Congregação</SelectItem>
                          <SelectItem value="diretoria">Diretoria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataReuniao">Data e Hora *</Label>
                      <Input id="dataReuniao" type="datetime-local" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="localReuniao">Local *</Label>
                      <Input id="localReuniao" placeholder="Ex: Sala do Conselho" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Participantes Esperados</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome do participante"
                        value={novoParticipante}
                        onChange={(e) => setNovoParticipante(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), adicionarParticipante())}
                      />
                      <Button type="button" onClick={adicionarParticipante}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {participantes.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {participantes.map((participante, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{participante}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removerParticipante(idx)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogNovaReuniao(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Agendar Reunião</Button>
                  </div>
                </form>
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
          <Card>
            <CardHeader>
              <CardTitle>Reuniões Agendadas e Realizadas</CardTitle>
              <CardDescription>{reunioes.length} reuniões registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reunioes
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .map((reuniao) => (
                    <div
                      key={reuniao.id}
                      className="flex items-start gap-4 p-4 rounded-lg border hover-elevate"
                      data-testid={`reuniao-${reuniao.id}`}
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
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
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
                          <div className="flex items-center gap-1">
                            {reuniao.ata && reuniao.ata.aprovada && reuniao.ata.pdfUrl && (
                              <Button variant="outline" size="sm">
                                <FileDown className="w-4 h-4 mr-2" />
                                PDF
                              </Button>
                            )}
                            {reuniao.status === "realizada" && !reuniao.ata && podeEditar && (
                              <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Ata
                              </Button>
                            )}
                            {reuniao.ata && (
                              <Button variant="ghost" size="icon">
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {podeEditar && !reuniao.ata?.bloqueada && (
                              <Button variant="ghost" size="icon">
                                <Edit className="w-4 h-4" />
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
        </TabsContent>

        {/* Tab Atas */}
        <TabsContent value="atas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atas Registradas</CardTitle>
              <CardDescription>Histórico de atas aprovadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reunioes
                  .filter((r) => r.ata)
                  .map((reuniao) => (
                    <Card key={reuniao.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">
                                Ata - {tipoReuniaoLabels[reuniao.tipo as keyof typeof tipoReuniaoLabels]}
                              </CardTitle>
                              {reuniao.ata?.aprovada && (
                                <Badge variant="default" className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Aprovada
                                </Badge>
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
                          <div className="flex items-center gap-2">
                            {reuniao.ata?.pdfUrl && (
                              <Button variant="outline" size="sm">
                                <FileDown className="w-4 h-4 mr-2" />
                                Baixar PDF
                              </Button>
                            )}
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
