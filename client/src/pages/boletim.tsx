import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  Newspaper,
  Plus,
  FileDown,
  Eye,
  Edit,
  Trash2,
  Send,
  Calendar,
  CakeSlice,
  Users,
  Loader2,
} from "lucide-react";
import { type Boletim } from "@shared/schema";

export default function BoletimDominical() {
  const { temPermissao } = useAuth();
  const [dialogNovoBoletim, setDialogNovoBoletim] = useState(false);
  const [eventos, setEventos] = useState<string[]>([]);
  const [novoEvento, setNovoEvento] = useState("");

  const podeEditar = temPermissao("boletim", "total");

  const { data: boletins = [], isLoading, isError, refetch } = useQuery<Boletim[]>({
    queryKey: ["/api/boletins"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Erro ao carregar boletins. Tente novamente.</p>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const boletins_mock: Boletim[] = [
    {
      id: "1",
      data: "2024-11-10",
      titulo: "Boletim Dominical - Culto de Celebração",
      versiculoSemana: "\"Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...\" - João 3:16",
      devocional: "Neste domingo especial, celebramos o amor incondicional de Deus por cada um de nós. Que possamos refletir sobre a grandeza deste amor e compartilhá-lo com todos ao nosso redor.",
      eventos: [
        "10:00 - Culto de Celebração",
        "09:00 - Escola Bíblica Dominical",
        "18:00 - Culto de Louvor e Adoração",
      ],
      pedidosOracao: [
        "Pela saúde do irmão João Pedro",
        "Pelas missões na África",
        "Pelos jovens em época de vestibular",
      ],
      avisos: [
        "Reunião do Conselho na terça-feira às 19:30",
        "Inscrições abertas para o retiro de carnaval",
      ],
      publicado: true,
      pdfUrl: "/boletins/2024-11-10.pdf",
      criadoPorId: "pastor1",
      criadoEm: new Date("2024-11-08"),
    },
    {
      id: "2",
      data: "2024-11-17",
      titulo: "Boletim Dominical - Dia de Ação de Graças",
      versiculoSemana: "\"Em tudo dai graças, porque esta é a vontade de Deus\" - 1 Tessalonicenses 5:18",
      devocional: "Aproximando-se do final do ano, é tempo de gratidão. Agradeçamos a Deus por todas as bênçãos recebidas e renovemos nosso compromisso com o Reino.",
      eventos: [
        "10:00 - Culto de Ação de Graças",
        "09:00 - Escola Bíblica Dominical",
      ],
      pedidosOracao: [],
      avisos: [
        "Próximo domingo teremos almoço comunitário",
      ],
      publicado: false,
      pdfUrl: null,
      criadoPorId: "presbitero1",
      criadoEm: new Date("2024-11-15"),
    },
  ];

  const aniversariantes = [
    { nome: "Maria Silva Santos", data: "10/11" },
    { nome: "Pedro Henrique Costa", data: "12/11" },
  ];

  const visitantes = [
    { nome: "Carlos Alberto Souza", origem: "Convite de Maria Silva" },
    { nome: "Beatriz Oliveira", origem: "Redes sociais" },
  ];

  const adicionarEvento = () => {
    if (novoEvento.trim()) {
      setEventos([...eventos, novoEvento]);
      setNovoEvento("");
    }
  };

  const removerEvento = (index: number) => {
    setEventos(eventos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Newspaper className="w-8 h-8" />
            Boletim Dominical
          </h1>
          <p className="text-muted-foreground mt-1">Criação e publicação dos boletins semanais</p>
        </div>
        {podeEditar && (
          <Dialog open={dialogNovoBoletim} onOpenChange={setDialogNovoBoletim}>
            <DialogTrigger asChild>
              <Button data-testid="button-novo-boletim">
                <Plus className="w-4 h-4 mr-2" />
                Novo Boletim
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Boletim Dominical</DialogTitle>
                <DialogDescription>
                  Preencha as informações para o boletim da semana
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataBoletim">Data do Culto *</Label>
                    <Input id="dataBoletim" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tituloBoletim">Título *</Label>
                    <Input id="tituloBoletim" placeholder="Ex: Culto de Celebração" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="versiculo">Versículo da Semana</Label>
                  <Textarea
                    id="versiculo"
                    placeholder="Digite o versículo bíblico com a referência"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="devocional">Mensagem Devocional</Label>
                  <Textarea
                    id="devocional"
                    placeholder="Escreva uma breve mensagem devocional para a congregação"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Eventos da Semana</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: 10:00 - Culto de Celebração"
                      value={novoEvento}
                      onChange={(e) => setNovoEvento(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), adicionarEvento())}
                    />
                    <Button type="button" onClick={adicionarEvento}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {eventos.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {eventos.map((evento, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{evento}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removerEvento(idx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <CakeSlice className="w-4 h-4" />
                    Informações Automáticas
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Os aniversariantes da semana e visitantes recentes serão incluídos automaticamente do Módulo Pastoral.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-1">Aniversariantes:</p>
                      <ul className="text-muted-foreground space-y-0.5">
                        {aniversariantes.map((a, idx) => (
                          <li key={idx}>• {a.nome} ({a.data})</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Visitantes:</p>
                      <ul className="text-muted-foreground space-y-0.5">
                        {visitantes.map((v, idx) => (
                          <li key={idx}>• {v.nome}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogNovoBoletim(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Pré-visualizar
                  </Button>
                  <Button type="submit">
                    <Send className="w-4 h-4 mr-2" />
                    Publicar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista de Boletins */}
      <div className="grid gap-4">
        {boletins.map((boletim) => (
          <Card key={boletim.id} className="hover-elevate">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{boletim.titulo}</CardTitle>
                    <Badge variant={boletim.publicado ? "default" : "secondary"}>
                      {boletim.publicado ? "Publicado" : "Rascunho"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(boletim.data).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {boletim.publicado && boletim.pdfUrl && (
                    <Button variant="outline" size="sm">
                      <FileDown className="w-4 h-4 mr-2" />
                      Baixar PDF
                    </Button>
                  )}
                  {podeEditar && (
                    <>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {boletim.versiculoSemana && (
                <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                  <p className="text-sm italic">{boletim.versiculoSemana}</p>
                </div>
              )}

              {boletim.devocional && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Mensagem Devocional</h4>
                  <p className="text-sm text-muted-foreground">{boletim.devocional}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boletim.eventos && boletim.eventos.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Eventos da Semana
                    </h4>
                    <ul className="space-y-1">
                      {boletim.eventos.map((evento, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {evento}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {boletim.pedidosOracao && boletim.pedidosOracao.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Pedidos de Oração</h4>
                    <ul className="space-y-1">
                      {boletim.pedidosOracao.map((pedido, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {pedido}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {boletim.avisos && boletim.avisos.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Avisos</h4>
                  <div className="space-y-1">
                    {boletim.avisos.map((aviso, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        <span className="text-muted-foreground flex-1">{aviso}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <CakeSlice className="w-4 h-4" />
                    Aniversariantes
                  </h4>
                  <ul className="space-y-1">
                    {aniversariantes.map((a, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {a.nome} - {a.data}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Visitantes
                  </h4>
                  <ul className="space-y-1">
                    {visitantes.map((v, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {v.nome}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
