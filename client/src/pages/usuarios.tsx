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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  Plus,
  Pencil,
  Key,
  UserX,
  Loader2,
  Shield,
} from "lucide-react";
import { type Usuario, insertUsuarioSchema } from "@shared/schema";

const usuarioFormSchema = insertUsuarioSchema.extend({
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const alterarSenhaSchema = z.object({
  novaSenha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmarSenha: z.string().min(6, "Confirmação deve ter no mínimo 6 caracteres"),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type UsuarioFormData = z.infer<typeof usuarioFormSchema>;
type AlterarSenhaData = z.infer<typeof alterarSenhaSchema>;

export default function Usuarios() {
  const { usuario: usuarioLogado } = useAuth();
  const { toast } = useToast();
  const [dialogNovoUsuario, setDialogNovoUsuario] = useState(false);
  const [dialogEditarUsuario, setDialogEditarUsuario] = useState(false);
  const [dialogAlterarSenha, setDialogAlterarSenha] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Omit<Usuario, 'senha'> | null>(null);

  const { data: usuarios = [], isLoading, isError, refetch } = useQuery<Omit<Usuario, 'senha'>[]>({
    queryKey: ["/api/usuarios"],
  });

  const formNovo = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: {
      email: "",
      senha: "",
      cargo: "DIACONO",
      nome: "",
      ativo: true,
    },
  });

  const formEditar = useForm<Partial<UsuarioFormData>>({
    defaultValues: {
      email: "",
      cargo: "DIACONO",
      nome: "",
      ativo: true,
    },
  });

  const formSenha = useForm<AlterarSenhaData>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: {
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  const criarUsuarioMutation = useMutation({
    mutationFn: async (dados: UsuarioFormData) => {
      const res = await apiRequest("POST", "/api/usuarios", dados);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso",
      });
      setDialogNovoUsuario(false);
      formNovo.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: "Ocorreu um erro ao criar o usuário. Tente novamente.",
      });
    },
  });

  const atualizarUsuarioMutation = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: Partial<UsuarioFormData> }) => {
      const res = await apiRequest("PATCH", `/api/usuarios/${id}`, dados);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso",
      });
      setDialogEditarUsuario(false);
      setUsuarioSelecionado(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: "Ocorreu um erro ao atualizar o usuário. Tente novamente.",
      });
    },
  });

  const alterarSenhaMutation = useMutation({
    mutationFn: async ({ id, novaSenha }: { id: string; novaSenha: string }) => {
      const res = await apiRequest("PATCH", `/api/usuarios/${id}/senha`, { novaSenha });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada",
        description: "A senha foi alterada com sucesso",
      });
      setDialogAlterarSenha(false);
      setUsuarioSelecionado(null);
      formSenha.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: "Ocorreu um erro ao alterar a senha. Tente novamente.",
      });
    },
  });

  const desativarUsuarioMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/usuarios/${id}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({
        title: "Usuário desativado",
        description: "O usuário foi desativado com sucesso",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao desativar usuário",
        description: "Ocorreu um erro ao desativar o usuário. Tente novamente.",
      });
    },
  });

  const onSubmitNovo = (dados: UsuarioFormData) => {
    criarUsuarioMutation.mutate(dados);
  };

  const onSubmitEditar = (dados: Partial<UsuarioFormData>) => {
    if (usuarioSelecionado) {
      atualizarUsuarioMutation.mutate({ id: usuarioSelecionado.id, dados });
    }
  };

  const onSubmitSenha = (dados: AlterarSenhaData) => {
    if (usuarioSelecionado) {
      alterarSenhaMutation.mutate({ id: usuarioSelecionado.id, novaSenha: dados.novaSenha });
    }
  };

  const abrirEditarUsuario = (usuario: Omit<Usuario, 'senha'>) => {
    setUsuarioSelecionado(usuario);
    formEditar.reset({
      email: usuario.email,
      cargo: usuario.cargo,
      nome: usuario.nome,
      ativo: usuario.ativo,
    });
    setDialogEditarUsuario(true);
  };

  const abrirAlterarSenha = (usuario: Omit<Usuario, 'senha'>) => {
    setUsuarioSelecionado(usuario);
    formSenha.reset();
    setDialogAlterarSenha(true);
  };

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
        <p className="text-destructive">Erro ao carregar usuários. Tente novamente.</p>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const cargoLabels = {
    PASTOR: "Pastor",
    PRESBITERO: "Presbítero",
    TESOUREIRO: "Tesoureiro",
    DIACONO: "Diácono",
  };

  const usuariosAtivos = usuarios.filter(u => u.ativo).length;
  const usuariosInativos = usuarios.filter(u => !u.ativo).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">Administre os usuários do sistema</p>
        </div>
        <Dialog open={dialogNovoUsuario} onOpenChange={setDialogNovoUsuario}>
          <DialogTrigger asChild>
            <Button data-testid="button-novo-usuario">
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Cadastre um novo usuário no sistema
              </DialogDescription>
            </DialogHeader>
            <Form {...formNovo}>
              <form onSubmit={formNovo.handleSubmit(onSubmitNovo)} className="space-y-4 mt-4">
                <FormField
                  control={formNovo.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNovo.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNovo.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha *</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} data-testid="input-senha" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNovo.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-cargo">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PASTOR">Pastor</SelectItem>
                          <SelectItem value="PRESBITERO">Presbítero</SelectItem>
                          <SelectItem value="TESOUREIRO">Tesoureiro</SelectItem>
                          <SelectItem value="DIACONO">Diácono</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogNovoUsuario(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={criarUsuarioMutation.isPending} data-testid="button-salvar-usuario">
                    {criarUsuarioMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Criar Usuário"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{usuariosAtivos}</div>
            <p className="text-xs text-muted-foreground mt-1">Com acesso ao sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
              <UserX className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{usuariosInativos}</div>
            <p className="text-xs text-muted-foreground mt-1">Desativados</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>Gerencie todos os usuários do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                data-testid={`usuario-${usuario.id}`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{usuario.nome}</h4>
                      <Badge variant={usuario.ativo ? "default" : "secondary"}>
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">{cargoLabels[usuario.cargo as keyof typeof cargoLabels]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{usuario.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirEditarUsuario(usuario)}
                    data-testid={`button-editar-${usuario.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirAlterarSenha(usuario)}
                    data-testid={`button-senha-${usuario.id}`}
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                  {usuario.ativo && usuario.id !== usuarioLogado?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => desativarUsuarioMutation.mutate(usuario.id)}
                      disabled={desativarUsuarioMutation.isPending}
                      data-testid={`button-desativar-${usuario.id}`}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Editar Usuário */}
      <Dialog open={dialogEditarUsuario} onOpenChange={setDialogEditarUsuario}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <Form {...formEditar}>
            <form onSubmit={formEditar.handleSubmit(onSubmitEditar)} className="space-y-4 mt-4">
              <FormField
                control={formEditar.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formEditar.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formEditar.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PASTOR">Pastor</SelectItem>
                        <SelectItem value="PRESBITERO">Presbítero</SelectItem>
                        <SelectItem value="TESOUREIRO">Tesoureiro</SelectItem>
                        <SelectItem value="DIACONO">Diácono</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogEditarUsuario(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={atualizarUsuarioMutation.isPending}>
                  {atualizarUsuarioMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Senha */}
      <Dialog open={dialogAlterarSenha} onOpenChange={setDialogAlterarSenha}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário {usuarioSelecionado?.nome}
            </DialogDescription>
          </DialogHeader>
          <Form {...formSenha}>
            <form onSubmit={formSenha.handleSubmit(onSubmitSenha)} className="space-y-4 mt-4">
              <FormField
                control={formSenha.control}
                name="novaSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formSenha.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogAlterarSenha(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={alterarSenhaMutation.isPending}>
                  {alterarSenhaMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    "Alterar Senha"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
