import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Church,
  Heart,
  BookOpen,
  Info,
  Mail,
} from "lucide-react";
import {
  type Boletim,
  type Membro,
  type Visitante,
  insertBoletimSchema,
  type ItemLiturgia,
  type PedidoOracao,
} from "@shared/schema";

// Esquema do formulário estendido com validações
const boletimFormSchema = insertBoletimSchema.extend({
  data: z.string().min(1, "Data é obrigatória"),
  tituloMensagem: z.string().min(1, "Título da mensagem é obrigatório"),
  numeroEdicao: z.number().min(1, "Número da edição é obrigatório"),
  anoEdicao: z.number().min(2000, "Ano é obrigatório"),
});

type BoletimFormData = z.infer<typeof boletimFormSchema>;

// Componente helper para lista dinâmica de strings
function DynamicTextListField({
  label,
  placeholder,
  items,
  onAdd,
  onRemove,
  newValue,
  onNewValueChange,
  testId,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  newValue: string;
  onNewValueChange: (value: string) => void;
  testId: string;
}) {
  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
          data-testid={`input-novo-${testId}`}
        />
        <Button type="button" onClick={onAdd} data-testid={`button-adicionar-${testId}`}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="space-y-1 mt-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded gap-2">
              <span className="text-sm flex-1" data-testid={`text-${testId}-${idx}`}>{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(idx)}
                data-testid={`button-remover-${testId}-${idx}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Mapeamento de labels para categorias de pedidos de oração
const CATEGORIAS_PEDIDOS = {
  conversao: "Conversão",
  direcao_divina: "Direção Divina",
  emprego: "Emprego",
  saude: "Saúde",
  igreja: "Igreja",
  outros: "Outros",
} as const;

const TIPOS_LITURGIA = {
  preludio: "Prelúdio",
  hino: "Hino",
  leitura: "Leitura Bíblica",
  oracao: "Oração",
  cantico: "Cântico",
  mensagem: "Mensagem Bíblica",
  benção: "Bênção Apostólica",
  amem: "Amém Tríplice",
  posludio: "Poslúdio",
  aviso: "Avisos",
} as const;

export default function BoletimDominical() {
  const { temPermissao, usuario } = useAuth();
  const { toast } = useToast();
  const [dialogNovoBoletim, setDialogNovoBoletim] = useState(false);
  const [editandoBoletim, setEditandoBoletim] = useState<Boletim | null>(null);
  const [boletimDetalhado, setBoletimDetalhado] = useState<Boletim | null>(null);
  
  // Estados para campos dinâmicos simples (não estruturados)
  const [eventos, setEventos] = useState<string[]>([]);
  const [novoEvento, setNovoEvento] = useState("");
  const [avisos, setAvisos] = useState<string[]>([]);
  const [novoAviso, setNovoAviso] = useState("");
  
  // Estados para envio de email
  const [boletimParaEnviar, setBoletimParaEnviar] = useState<Boletim | null>(null);
  const [destinatariosSelecionados, setDestinatariosSelecionados] = useState<string[]>([]);

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
      numeroEdicao: 1,
      anoEdicao: new Date().getFullYear(),
      tituloMensagem: "",
      ofertaDia: "",
      saf: "",
      eventos: [],
      aniversariosCasamento: undefined,
      pedidosOracao: [],
      relatorioEbd: undefined,
      liturgia: [],
      textoMensagem: "",
      devocional: "",
      avisos: [],
      semanaOracao: undefined,
      aniversariosMembros: undefined,
      publicado: false,
      pdfUrl: undefined,
      criadoPorId: usuario?.id || "",
    },
  });

  // Field arrays para campos estruturados
  const { fields: liturgiaFields, append: appendLiturgia, remove: removeLiturgia } = useFieldArray({
    control: form.control,
    name: "liturgia",
  });

  const { fields: pedidosFields, append: appendPedido, remove: removePedido } = useFieldArray({
    control: form.control,
    name: "pedidosOracao",
  });

  const { fields: domingosEbdFields, append: appendDomingoEbd, remove: removeDomingoEbd } = useFieldArray({
    control: form.control,
    name: "relatorioEbd.domingos",
  });

  // Estados para controlar se os campos opcionais estão ativos
  const [semanaOracaoAtiva, setSemanaOracaoAtiva] = useState(false);
  const [relatorioEbdAtivo, setRelatorioEbdAtivo] = useState(false);

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

  const gerarPdfBoletimMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/boletins/${id}/gerar-pdf`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boletins"] });
      toast({
        title: "PDF gerado com sucesso!",
        description: "O boletim foi convertido em PDF e está disponível para download.",
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

  const enviarEmailMutation = useMutation({
    mutationFn: async ({ id, destinatarios }: { id: string; destinatarios: string[] }) => {
      return await apiRequest("POST", `/api/boletins/${id}/enviar-email`, { destinatarios });
    },
    onSuccess: () => {
      toast({
        title: "Email enviado com sucesso!",
        description: `O boletim foi enviado para ${destinatariosSelecionados.length} destinatário(s).`,
      });
      setBoletimParaEnviar(null);
      setDestinatariosSelecionados([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email. Tente novamente.",
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

  const adicionarAviso = () => {
    if (novoAviso.trim()) {
      setAvisos([...avisos, novoAviso.trim()]);
      setNovoAviso("");
    }
  };

  const removerAviso = (index: number) => {
    setAvisos(avisos.filter((_, i) => i !== index));
  };

  // Funções para envio de email
  const toggleDestinatario = (email: string) => {
    if (destinatariosSelecionados.includes(email)) {
      setDestinatariosSelecionados(destinatariosSelecionados.filter((e) => e !== email));
    } else {
      setDestinatariosSelecionados([...destinatariosSelecionados, email]);
    }
  };

  const selecionarTodos = () => {
    const todosEmails = membros.filter((m) => m.email).map((m) => m.email as string);
    setDestinatariosSelecionados(todosEmails);
  };

  const desselecionarTodos = () => {
    setDestinatariosSelecionados([]);
  };

  const enviarEmail = () => {
    if (!boletimParaEnviar || destinatariosSelecionados.length === 0) {
      toast({
        title: "Selecione destinatários",
        description: "Você precisa selecionar pelo menos um destinatário.",
        variant: "destructive",
      });
      return;
    }

    enviarEmailMutation.mutate({
      id: boletimParaEnviar.id,
      destinatarios: destinatariosSelecionados,
    });
  };

  const resetForm = () => {
    form.reset({
      data: "",
      numeroEdicao: 1,
      anoEdicao: new Date().getFullYear(),
      tituloMensagem: "",
      ofertaDia: "",
      saf: "",
      eventos: [],
      aniversariosCasamento: undefined,
      pedidosOracao: [],
      relatorioEbd: undefined,
      liturgia: [],
      textoMensagem: "",
      devocional: "",
      avisos: [],
      semanaOracao: undefined,
      aniversariosMembros: undefined,
      publicado: false,
      pdfUrl: undefined,
      criadoPorId: usuario?.id || "",
    });
    setEventos([]);
    setAvisos([]);
  };

  const onSubmit = (data: BoletimFormData) => {
    // Limpa os campos opcionais quando não estão ativos
    const boletimData: any = {
      ...data,
      eventos: eventos.length > 0 ? eventos : [],
      avisos: avisos.length > 0 ? avisos : [],
      criadoPorId: usuario?.id || "",
      // Remove campos opcionais desativados para evitar erros de validação
      semanaOracao: semanaOracaoAtiva && data.semanaOracao ? data.semanaOracao : undefined,
      relatorioEbd: relatorioEbdAtivo && data.relatorioEbd ? data.relatorioEbd : undefined,
    };
    
    // Remove propriedades undefined
    Object.keys(boletimData).forEach(key => {
      if (boletimData[key] === undefined) {
        delete boletimData[key];
      }
    });
    
    // Verifica se está editando ou criando um novo boletim
    if (editandoBoletim) {
      atualizarBoletimMutation.mutate({
        id: editandoBoletim.id,
        data: boletimData,
      });
    } else {
      criarBoletimMutation.mutate(boletimData);
    }
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
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Boletim Dominical</DialogTitle>
                <DialogDescription>
                  Preencha as informações nas abas abaixo para o boletim da semana
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                  <Tabs defaultValue="cabecalho" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="cabecalho" data-testid="tab-cabecalho">Cabeçalho</TabsTrigger>
                      <TabsTrigger value="liturgia" data-testid="tab-liturgia">Liturgia</TabsTrigger>
                      <TabsTrigger value="informacoes" data-testid="tab-informacoes">Informações</TabsTrigger>
                      <TabsTrigger value="pedidos" data-testid="tab-pedidos">Pedidos</TabsTrigger>
                      <TabsTrigger value="extras" data-testid="tab-extras">Extras</TabsTrigger>
                    </TabsList>

                    {/* ABA 1: CABEÇALHO */}
                    <TabsContent value="cabecalho" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          name="numeroEdicao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nº Edição *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-numero-edicao"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="anoEdicao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ano *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-ano-edicao"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="tituloMensagem"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título da Mensagem *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: A oração e o avanço missionário"
                                {...field}
                                data-testid="input-titulo-mensagem"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="textoMensagem"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Texto Bíblico</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Efésios 6.10-20"
                                {...field}
                                value={field.value || ""}
                                data-testid="input-texto-mensagem"
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
                    </TabsContent>

                    {/* ABA 2: LITURGIA */}
                    <TabsContent value="liturgia" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          Ordem do Culto
                        </h3>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => appendLiturgia({ tipo: "hino", conteudo: "", numero: "", referencia: "" })}
                          data-testid="button-adicionar-liturgia"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Item
                        </Button>
                      </div>

                      {liturgiaFields.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          Nenhum item de liturgia adicionado. Clique em "Adicionar Item" para começar.
                        </div>
                      )}

                      {liturgiaFields.map((field, index) => (
                        <Card key={field.id} className="p-4" data-testid={`card-liturgia-${index}`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`liturgia.${index}.tipo`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tipo</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-tipo-liturgia-${index}`}>
                                        <SelectValue placeholder="Selecione o tipo" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.entries(TIPOS_LITURGIA).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`liturgia.${index}.numero`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Número (opcional)</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: 14"
                                      {...field}
                                      value={field.value || ""}
                                      data-testid={`input-numero-liturgia-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`liturgia.${index}.conteudo`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Conteúdo</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder='Ex: "Louvor" ou "Consagração dos Dízimos e Ofertas"'
                                      {...field}
                                      data-testid={`input-conteudo-liturgia-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`liturgia.${index}.referencia`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Referência (opcional)</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: Salmo 98"
                                      {...field}
                                      value={field.value || ""}
                                      data-testid={`input-referencia-liturgia-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLiturgia(index)}
                            className="mt-4 text-destructive"
                            data-testid={`button-remover-liturgia-${index}`}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </Card>
                      ))}
                    </TabsContent>

                    {/* ABA 3: INFORMAÇÕES DA IGREJA */}
                    <TabsContent value="informacoes" className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <Church className="w-5 h-5" />
                        Informações da Igreja
                      </h3>

                      <FormField
                        control={form.control}
                        name="ofertaDia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Oferta do Dia</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Hoje a oferta será para a Cesta Básica"
                                {...field}
                                value={field.value || ""}
                                data-testid="input-oferta-dia"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="saf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SAF (Sociedade Auxiliadora Feminina)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Informações sobre atividades da SAF"
                                rows={3}
                                {...field}
                                value={field.value || ""}
                                data-testid="input-saf"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DynamicTextListField
                        label="Eventos da Semana"
                        placeholder="Ex: 10:00 - Culto de Celebração"
                        items={eventos}
                        onAdd={adicionarEvento}
                        onRemove={removerEvento}
                        newValue={novoEvento}
                        onNewValueChange={setNovoEvento}
                        testId="evento"
                      />

                      <DynamicTextListField
                        label="Avisos"
                        placeholder="Ex: Reunião do Conselho na terça-feira às 19:30"
                        items={avisos}
                        onAdd={adicionarAviso}
                        onRemove={removerAviso}
                        newValue={novoAviso}
                        onNewValueChange={setNovoAviso}
                        testId="aviso"
                      />
                    </TabsContent>

                    {/* ABA 4: PEDIDOS DE ORAÇÃO */}
                    <TabsContent value="pedidos" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Heart className="w-5 h-5" />
                          Pedidos de Oração
                        </h3>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => appendPedido({ categoria: "outros", descricao: "" })}
                          data-testid="button-adicionar-pedido-oracao"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Pedido
                        </Button>
                      </div>

                      {pedidosFields.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          Nenhum pedido de oração adicionado. Clique em "Adicionar Pedido" para começar.
                        </div>
                      )}

                      {pedidosFields.map((field, index) => (
                        <Card key={field.id} className="p-4" data-testid={`card-pedido-${index}`}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`pedidosOracao.${index}.categoria`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Categoria</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-categoria-pedido-${index}`}>
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.entries(CATEGORIAS_PEDIDOS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`pedidosOracao.${index}.descricao`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Descrição</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: Pela saúde do irmão João"
                                      {...field}
                                      data-testid={`input-descricao-pedido-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePedido(index)}
                            className="mt-4 text-destructive"
                            data-testid={`button-remover-pedido-${index}`}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </Card>
                      ))}
                    </TabsContent>

                    {/* ABA 5: EXTRAS (Aniversários e Publicação) */}
                    <TabsContent value="extras" className="space-y-4">
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

                      {/* Relatório EBD - Opcional */}
                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Relatório EBD (Opcional)
                          </h4>
                          <Switch
                            checked={relatorioEbdAtivo}
                            onCheckedChange={setRelatorioEbdAtivo}
                            data-testid="switch-relatorio-ebd"
                          />
                        </div>

                        {relatorioEbdAtivo && (
                          <div className="space-y-4 pt-3 border-t">
                            <FormField
                              control={form.control}
                              name="relatorioEbd.matriculados"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Total de Matriculados</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Ex: 131"
                                      {...field}
                                      value={field.value || ""}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      data-testid="input-matriculados-ebd"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-medium">Domingos do Mês</h5>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => appendDomingoEbd({ data: "", presentes: 0, ausentes: 0, visitantes: 0, biblias: 0 })}
                                  data-testid="button-adicionar-domingo-ebd"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Adicionar Domingo
                                </Button>
                              </div>

                              {domingosEbdFields.map((field, index) => (
                                <Card key={field.id} className="p-3" data-testid={`card-domingo-ebd-${index}`}>
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                    <FormField
                                      control={form.control}
                                      name={`relatorioEbd.domingos.${index}.data`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs">Data</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="date"
                                              {...field}
                                              data-testid={`input-data-domingo-ebd-${index}`}
                                              className="h-8 text-sm"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`relatorioEbd.domingos.${index}.presentes`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs">Presentes</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              {...field}
                                              onChange={(e) => field.onChange(Number(e.target.value))}
                                              data-testid={`input-presentes-domingo-ebd-${index}`}
                                              className="h-8 text-sm"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`relatorioEbd.domingos.${index}.ausentes`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs">Ausentes</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              {...field}
                                              onChange={(e) => field.onChange(Number(e.target.value))}
                                              data-testid={`input-ausentes-domingo-ebd-${index}`}
                                              className="h-8 text-sm"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`relatorioEbd.domingos.${index}.visitantes`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs">Visitantes</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              {...field}
                                              onChange={(e) => field.onChange(Number(e.target.value))}
                                              data-testid={`input-visitantes-domingo-ebd-${index}`}
                                              className="h-8 text-sm"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`relatorioEbd.domingos.${index}.biblias`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs">Bíblias</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              {...field}
                                              onChange={(e) => field.onChange(Number(e.target.value))}
                                              data-testid={`input-biblias-domingo-ebd-${index}`}
                                              className="h-8 text-sm"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDomingoEbd(index)}
                                    className="mt-2 text-destructive h-7"
                                    data-testid={`button-remover-domingo-ebd-${index}`}
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Remover
                                  </Button>
                                </Card>
                              ))}

                              {domingosEbdFields.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Nenhum domingo adicionado. Clique em "Adicionar Domingo" para começar.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>

                      {/* Semana de Oração - Opcional */}
                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            Semana de Oração (Opcional)
                          </h4>
                          <Switch
                            checked={semanaOracaoAtiva}
                            onCheckedChange={setSemanaOracaoAtiva}
                            data-testid="switch-semana-oracao"
                          />
                        </div>

                        {semanaOracaoAtiva && (
                          <div className="space-y-4 pt-3 border-t">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="semanaOracao.dataInicio"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Data Início</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        value={field.value || ""}
                                        data-testid="input-data-inicio-semana"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="semanaOracao.dataFim"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Data Fim</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        value={field.value || ""}
                                        data-testid="input-data-fim-semana"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                              * Interface completa para programação da semana de oração será implementada em breve
                            </p>
                          </div>
                        )}
                      </Card>

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
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end gap-2 pt-4 border-t">
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
                      <CardTitle className="text-xl">{boletim.tituloMensagem}</CardTitle>
                      <Badge variant="outline">Edição nº {boletim.numeroEdicao} - {boletim.anoEdicao}</Badge>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBoletimDetalhado(boletim)}
                      data-testid={`button-ver-detalhes-${boletim.id}`}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    {boletim.pdfUrl && (
                      <>
                        <Button variant="outline" size="sm" asChild data-testid={`link-pdf-${boletim.id}`}>
                          <a href={boletim.pdfUrl} target="_blank" rel="noopener noreferrer" download>
                            <FileDown className="w-4 h-4 mr-2" />
                            Baixar PDF
                          </a>
                        </Button>
                        {podeEditar && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBoletimParaEnviar(boletim);
                              setDestinatariosSelecionados([]);
                            }}
                            data-testid={`button-enviar-email-${boletim.id}`}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar por Email
                          </Button>
                        )}
                      </>
                    )}
                    {podeEditar && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => gerarPdfBoletimMutation.mutate(boletim.id)}
                          disabled={gerarPdfBoletimMutation.isPending}
                          data-testid={`button-gerar-pdf-${boletim.id}`}
                        >
                          {gerarPdfBoletimMutation.isPending ? (
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
                {boletim.textoMensagem && (
                  <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-medium">{boletim.tituloMensagem}</p>
                    <p className="text-sm italic text-muted-foreground">{boletim.textoMensagem}</p>
                  </div>
                )}

                {boletim.devocional && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Mensagem Devocional</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{boletim.devocional}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {boletim.ofertaDia && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Oferta do Dia</h4>
                      <p className="text-sm text-muted-foreground">{boletim.ofertaDia}</p>
                    </div>
                  )}
                  
                  {boletim.saf && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">SAF</h4>
                      <p className="text-sm text-muted-foreground">{boletim.saf}</p>
                    </div>
                  )}
                  
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

      {/* Dialog de Detalhes do Boletim */}
      {boletimDetalhado && (
        <Dialog open={Boolean(boletimDetalhado)} onOpenChange={(open) => !open && setBoletimDetalhado(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-detalhes-boletim">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                {boletimDetalhado.tituloMensagem}
              </DialogTitle>
              <DialogDescription>
                {new Date(boletimDetalhado.data + "T00:00:00").toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })} - Edição nº {boletimDetalhado.numeroEdicao}/{boletimDetalhado.anoEdicao}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-120px)]">
              <div className="space-y-6 pr-4">
                {/* Cabeçalho e Mensagem */}
                {boletimDetalhado.textoMensagem && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Church className="w-4 h-4" />
                      Mensagem do Dia
                    </h3>
                    <Card className="p-4">
                      <p className="text-sm font-medium mb-1">{boletimDetalhado.tituloMensagem}</p>
                      <p className="text-sm text-muted-foreground italic">{boletimDetalhado.textoMensagem}</p>
                    </Card>
                  </div>
                )}

                {/* Liturgia */}
                {boletimDetalhado.liturgia && boletimDetalhado.liturgia.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Liturgia
                    </h3>
                    <Card className="p-4">
                      <div className="space-y-2">
                        {boletimDetalhado.liturgia.map((item: ItemLiturgia, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm" data-testid={`liturgia-item-${idx}`}>
                            <span className="font-medium min-w-[120px]">{TIPOS_LITURGIA[item.tipo as keyof typeof TIPOS_LITURGIA]}</span>
                            <span className="text-muted-foreground flex-1">
                              {item.numero && `Nº ${item.numero}`}
                              {item.conteudo && ` - "${item.conteudo}"`}
                              {item.referencia && ` (${item.referencia})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Pedidos de Oração */}
                {boletimDetalhado.pedidosOracao && boletimDetalhado.pedidosOracao.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Pedidos de Oração
                    </h3>
                    <Card className="p-4">
                      {Object.entries(
                        boletimDetalhado.pedidosOracao.reduce((acc: Record<string, string[]>, pedido: PedidoOracao) => {
                          if (!acc[pedido.categoria]) acc[pedido.categoria] = [];
                          acc[pedido.categoria].push(pedido.descricao);
                          return acc;
                        }, {})
                      ).map(([categoria, descricoes]) => (
                        <div key={categoria} className="mb-3 last:mb-0" data-testid={`pedidos-categoria-${categoria}`}>
                          <h4 className="font-medium text-sm mb-1">{CATEGORIAS_PEDIDOS[categoria as keyof typeof CATEGORIAS_PEDIDOS]}</h4>
                          <ul className="space-y-1">
                            {descricoes.map((desc, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground pl-3">• {desc}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </Card>
                  </div>
                )}

                {/* Informações Gerais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {boletimDetalhado.ofertaDia && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Oferta do Dia</h3>
                      <Card className="p-3">
                        <p className="text-sm text-muted-foreground">{boletimDetalhado.ofertaDia}</p>
                      </Card>
                    </div>
                  )}

                  {boletimDetalhado.saf && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">SAF</h3>
                      <Card className="p-3">
                        <p className="text-sm text-muted-foreground">{boletimDetalhado.saf}</p>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Eventos */}
                {boletimDetalhado.eventos && boletimDetalhado.eventos.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Eventos da Semana
                    </h3>
                    <Card className="p-4">
                      <ul className="space-y-2">
                        {boletimDetalhado.eventos.map((evento, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground" data-testid={`evento-${idx}`}>• {evento}</li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                )}

                {/* Avisos */}
                {boletimDetalhado.avisos && boletimDetalhado.avisos.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Avisos</h3>
                    <Card className="p-4">
                      <div className="space-y-2">
                        {boletimDetalhado.avisos.map((aviso, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm" data-testid={`aviso-${idx}`}>
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground flex-1">{aviso}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Devocional */}
                {boletimDetalhado.devocional && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Mensagem Devocional</h3>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{boletimDetalhado.devocional}</p>
                    </Card>
                  </div>
                )}

                {/* Relatório EBD */}
                {boletimDetalhado.relatorioEbd && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Relatório EBD
                    </h3>
                    <Card className="p-4">
                      <p className="text-sm font-medium mb-3">Matriculados: {boletimDetalhado.relatorioEbd.matriculados}</p>
                      {boletimDetalhado.relatorioEbd.domingos && boletimDetalhado.relatorioEbd.domingos.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Domingos do Mês</h4>
                          {boletimDetalhado.relatorioEbd.domingos.map((domingo: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              <span>{new Date(domingo.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                              <Separator orientation="vertical" className="h-4" />
                              <span>Presentes: {domingo.presentes}</span>
                              <span>Ausentes: {domingo.ausentes}</span>
                              <span>Visitantes: {domingo.visitantes}</span>
                              <span>Bíblias: {domingo.biblias}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* Semana de Oração */}
                {boletimDetalhado.semanaOracao && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Semana de Oração
                    </h3>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground">
                        {new Date(boletimDetalhado.semanaOracao.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(boletimDetalhado.semanaOracao.dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Envio por Email */}
      {boletimParaEnviar && (
        <Dialog open={Boolean(boletimParaEnviar)} onOpenChange={(open) => !open && setBoletimParaEnviar(null)}>
          <DialogContent className="max-w-2xl" data-testid="dialog-enviar-email">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Enviar Boletim por Email
              </DialogTitle>
              <DialogDescription>
                Selecione os membros que receberão o boletim "{boletimParaEnviar.tituloMensagem}" por email.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {destinatariosSelecionados.length} destinatário(s) selecionado(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selecionarTodos}
                    data-testid="button-selecionar-todos"
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={desselecionarTodos}
                    data-testid="button-desselecionar-todos"
                  >
                    Limpar Seleção
                  </Button>
                </div>
              </div>

              <Separator />

              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {membros.filter((m) => m.email).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum membro com email cadastrado.
                    </p>
                  ) : (
                    membros
                      .filter((m) => m.email)
                      .map((membro) => (
                        <div
                          key={membro.id}
                          className="flex items-center gap-3 p-3 rounded-md hover-elevate"
                          onClick={() => toggleDestinatario(membro.email!)}
                          data-testid={`checkbox-destinatario-${membro.id}`}
                        >
                          <Switch
                            checked={destinatariosSelecionados.includes(membro.email!)}
                            onCheckedChange={() => toggleDestinatario(membro.email!)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{membro.nome}</p>
                            <p className="text-xs text-muted-foreground">{membro.email}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBoletimParaEnviar(null)}
                  data-testid="button-cancelar-email"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={enviarEmail}
                  disabled={enviarEmailMutation.isPending || destinatariosSelecionados.length === 0}
                  data-testid="button-confirmar-envio-email"
                >
                  {enviarEmailMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
