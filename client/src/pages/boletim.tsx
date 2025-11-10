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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Newspaper,
  Plus,
  FileDown,
  Eye,
  Edit,
  Trash2,
  Calendar,
  CakeSlice,
  Users,
  Loader2,
  X,
} from "lucide-react";
import { type Boletim, type Membro, type Visitante, insertBoletimSchema } from "@shared/schema";

const boletimFormSchema = insertBoletimSchema.extend({
  data: z.string().min(1, "Data é obrigatória"),
  titulo: z.string().min(1, "Título é obrigatório"),
});

type BoletimFormData = z.infer<typeof boletimFormSchema>;

export default function BoletimDominical() {
  const { temPermissao, usuario } = useAuth();
  const { toast } = useToast();
  const [dialogNovoBoletim, setDialogNovoBoletim] = useState(false);
  const [editandoBoletim, setEditandoBoletim] = useState<Boletim | null>(null);
  
  // Estados para campos dinâmicos
  const [eventos, setEventos] = useState<string[]>([]);
  const [novoEvento, setNovoEvento] = useState("");
  const [pedidos, setPedidos] = useState<string[]>([]);
  const [novoPedido, setNovoPedido] = useState("");
  const [avisos, setAvisos] = useState<string[]>([]);
  const [novoAviso, setNovoAviso] = useState("");

  const podeEditar = temPermissao("boletim", "total");

  const { data: boletins = [], isLoading, isError, refetch } = useQuery<Boletim[]>({
    queryKey: ["/api/boletins"],
  });

  const { data: membros = [] } = useQuery<Membro[]>({
    queryKey: ["/api/membros"],
    enabled: podeEditar,
  });

  const { data: visitantes = [] } = useQuery<Visitante[]>({
    queryKey: ["/api/visitantes"],
    enabled: podeEditar,
  });

  const form = useForm<BoletimFormData>({
    resolver: zodResolver(boletimFormSchema),
    defaultValues: {
      data: "",
      titulo: "",
      versiculoSemana: "",
      devocional: "",
      eventos: [],
      pedidosOracao: [],
      avisos: [],
      publicado: false,
      pdfUrl: null,
      criadoPorId: usuario?.id || "",
    },
  });

  const criarBoletimMutation = useMutation({
    mutationFn: async (data: BoletimFormData) => {
      return await apiRequest("POST", "/api/boletins", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boletins"] });
      toast({
        title: "Boletim criado com sucesso!",
        description: "O boletim foi salvo e está disponível.",
      });
      setDialogNovoBoletim(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar boletim",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const atualizarBoletimMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BoletimFormData> }) => {
      return await apiRequest("PATCH", `/api/boletins/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boletins"] });
      toast({
        title: "Boletim atualizado!",
        description: "As alterações foram salvas.",
      });
      setEditandoBoletim(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar boletim",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const deletarBoletimMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/boletins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boletins"] });
      toast({
        title: "Boletim excluído",
        description: "O boletim foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir boletim",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Funções para arrays dinâmicos
  const adicionarEvento = () => {
    if (novoEvento.trim()) {
      setEventos([...eventos, novoEvento.trim()]);
      setNovoEvento("");
    }
  };

  const removerEvento = (index: number) => {
    setEventos(eventos.filter((_, i) => i !== index));
  };

  const adicionarPedido = () => {
    if (novoPedido.trim()) {
      setPedidos([...pedidos, novoPedido.trim()]);
      setNovoPedido("");
    }
  };

  const removerPedido = (index: number) => {
    setPedidos(pedidos.filter((_, i) => i !== index));
  };

  const adicionarAviso = () => {
    if (novoAviso.trim()) {
      setAvisos([...avisos, novoAviso.trim()]);
      setNovoAviso("");
    }
  };

  const removerAviso = (index: number) => {
    setAvisos(avisos.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    form.reset({
      data: "",
      titulo: "",
      versiculoSemana: "",
      devocional: "",
      eventos: [],
      pedidosOracao: [],
      avisos: [],
      publicado: false,
      pdfUrl: null,
      criadoPorId: usuario?.id || "",
    });
    setEventos([]);
    setPedidos([]);
    setAvisos([]);
  };

  const onSubmit = (data: BoletimFormData) => {
    const boletimData = {
      ...data,
      eventos: eventos.length > 0 ? eventos : null,
      pedidosOracao: pedidos.length > 0 ? pedidos : null,
      avisos: avisos.length > 0 ? avisos : null,
      criadoPorId: usuario?.id || "",
    };
    
    criarBoletimMutation.mutate(boletimData);
  };

  const togglePublicacao = (boletim: Boletim) => {
    atualizarBoletimMutation.mutate({
      id: boletim.id,
      data: { publicado: !boletim.publicado },
    });
  };

  const deletarBoletim = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este boletim?")) {
      deletarBoletimMutation.mutate(id);
    }
  };

  // Função para obter aniversariantes da semana
  const getAniversariantesProximaSemana = (dataBoletim: string) => {
    if (!dataBoletim) return [];
    
    const dataCulto = new Date(dataBoletim + "T00:00:00");
    const proximaSemana = new Date(dataCulto);
    proximaSemana.setDate(proximaSemana.getDate() + 7);
    
    return membros.filter(membro => {
      if (!membro.dataNascimento) return false;
      const nascimento = new Date(membro.dataNascimento + "T00:00:00");
      const mesNasc = nascimento.getMonth();
      const diaNasc = nascimento.getDate();
      
      // Verifica se o aniversário está entre a data do culto e a próxima semana
      for (let i = 0; i <= 7; i++) {
        const dataVerifica = new Date(dataCulto);
        dataVerifica.setDate(dataVerifica.getDate() + i);
        if (dataVerifica.getMonth() === mesNasc && dataVerifica.getDate() === diaNasc) {
          return true;
        }
      }
      return false;
    }).map(membro => ({
      nome: membro.nome,
      data: membro.dataNascimento ? new Date(membro.dataNascimento + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "",
    }));
  };

  const getVisitantesRecentes = () => {
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
    
    return visitantes
      .filter(v => new Date(v.dataVisita) >= umaSemanaAtras && v.status !== "inativo")
      .map(v => ({
        nome: v.nome,
        origem: v.comoConheceu || "Não informado",
      }));
  };

  const dataBoletimForm = form.watch("data");
  const aniversariantes = getAniversariantesProximaSemana(dataBoletimForm);
  const visitantesRecentes = getVisitantesRecentes();

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
        <Button onClick={() => refetch()} variant="outline" data-testid="button-tentar-novamente">
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
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="data"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Culto *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-data-boletim"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Culto de Celebração"
                              {...field}
                              data-testid="input-titulo-boletim"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="versiculoSemana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Versículo da Semana</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Digite o versículo bíblico com a referência"
                            rows={2}
                            {...field}
                            value={field.value || ""}
                            data-testid="input-versiculo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="devocional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensagem Devocional</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Escreva uma breve mensagem devocional para a congregação"
                            rows={4}
                            {...field}
                            value={field.value || ""}
                            data-testid="input-devocional"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Eventos Dinâmicos */}
                  <div className="space-y-2">
                    <FormLabel>Eventos da Semana</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: 10:00 - Culto de Celebração"
                        value={novoEvento}
                        onChange={(e) => setNovoEvento(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), adicionarEvento())}
                        data-testid="input-novo-evento"
                      />
                      <Button type="button" onClick={adicionarEvento} data-testid="button-adicionar-evento">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {eventos.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {eventos.map((evento, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded gap-2">
                            <span className="text-sm flex-1" data-testid={`text-evento-${idx}`}>{evento}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removerEvento(idx)}
                              data-testid={`button-remover-evento-${idx}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pedidos de Oração Dinâmicos */}
                  <div className="space-y-2">
                    <FormLabel>Pedidos de Oração</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: Pela saúde do irmão João"
                        value={novoPedido}
                        onChange={(e) => setNovoPedido(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), adicionarPedido())}
                        data-testid="input-novo-pedido"
                      />
                      <Button type="button" onClick={adicionarPedido} data-testid="button-adicionar-pedido">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {pedidos.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {pedidos.map((pedido, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded gap-2">
                            <span className="text-sm flex-1" data-testid={`text-pedido-${idx}`}>{pedido}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removerPedido(idx)}
                              data-testid={`button-remover-pedido-${idx}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Avisos Dinâmicos */}
                  <div className="space-y-2">
                    <FormLabel>Avisos</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: Reunião do Conselho na terça-feira às 19:30"
                        value={novoAviso}
                        onChange={(e) => setNovoAviso(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), adicionarAviso())}
                        data-testid="input-novo-aviso"
                      />
                      <Button type="button" onClick={adicionarAviso} data-testid="button-adicionar-aviso">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {avisos.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {avisos.map((aviso, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded gap-2">
                            <span className="text-sm flex-1" data-testid={`text-aviso-${idx}`}>{aviso}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removerAviso(idx)}
                              data-testid={`button-remover-aviso-${idx}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Informações Automáticas */}
                  {dataBoletimForm && (
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
                          <p className="font-medium mb-1">Aniversariantes ({aniversariantes.length}):</p>
                          <ul className="text-muted-foreground space-y-0.5">
                            {aniversariantes.length > 0 ? (
                              aniversariantes.map((a, idx) => (
                                <li key={idx} data-testid={`text-aniversariante-${idx}`}>• {a.nome} ({a.data})</li>
                              ))
                            ) : (
                              <li>Nenhum aniversariante esta semana</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Visitantes ({visitantesRecentes.length}):</p>
                          <ul className="text-muted-foreground space-y-0.5">
                            {visitantesRecentes.length > 0 ? (
                              visitantesRecentes.map((v, idx) => (
                                <li key={idx} data-testid={`text-visitante-${idx}`}>• {v.nome}</li>
                              ))
                            ) : (
                              <li>Nenhum visitante recente</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="publicado"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publicar Boletim</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Marque para publicar imediatamente
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-publicado"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogNovoBoletim(false)}
                      data-testid="button-cancelar"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={criarBoletimMutation.isPending}
                      data-testid="button-salvar-boletim"
                    >
                      {criarBoletimMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Salvar Boletim
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista de Boletins */}
      {boletins.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Newspaper className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum boletim cadastrado ainda.
              {podeEditar && " Clique em 'Novo Boletim' para começar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {boletins.map((boletim) => (
            <Card key={boletim.id} className="hover-elevate" data-testid={`card-boletim-${boletim.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-xl">{boletim.titulo}</CardTitle>
                      <Badge variant={boletim.publicado ? "default" : "secondary"} data-testid={`badge-status-${boletim.id}`}>
                        {boletim.publicado ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(boletim.data + "T00:00:00").toLocaleDateString("pt-BR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {boletim.publicado && boletim.pdfUrl && (
                      <Button variant="outline" size="sm" data-testid={`button-baixar-pdf-${boletim.id}`}>
                        <FileDown className="w-4 h-4 mr-2" />
                        Baixar PDF
                      </Button>
                    )}
                    {podeEditar && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePublicacao(boletim)}
                          disabled={atualizarBoletimMutation.isPending}
                          data-testid={`button-toggle-publicacao-${boletim.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletarBoletim(boletim.id)}
                          disabled={deletarBoletimMutation.isPending}
                          data-testid={`button-deletar-${boletim.id}`}
                        >
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
