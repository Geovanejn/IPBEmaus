import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  CakeSlice,
} from "lucide-react";
import { type Membro, type Visitante } from "@shared/schema";

export default function Pastoral() {
  const { usuario, temPermissao } = useAuth();
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [dialogNovoMembro, setDialogNovoMembro] = useState(false);
  const [dialogNovoVisitante, setDialogNovoVisitante] = useState(false);

  const podeEditar = temPermissao("pastoral", "total");

  // Mock data para demonstração visual
  const membros: (Membro & { idade?: number })[] = [
    {
      id: "1",
      nome: "Maria Silva Santos",
      email: "maria.silva@email.com",
      telefone: "(11) 98765-4321",
      dataNascimento: "1985-03-15",
      endereco: "Rua das Flores, 123",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01234-567",
      estadoCivil: "casado",
      profissao: "Professora",
      dataBatismo: "2010-05-20",
      dataProfissaoFe: "2010-05-20",
      familiaId: "fam1",
      status: "ativo",
      fotoUrl: null,
      consentimentoLGPD: true,
      criadoEm: new Date(),
      idade: 38,
    },
    {
      id: "2",
      nome: "João Santos Silva",
      email: "joao.santos@email.com",
      telefone: "(11) 98765-4322",
      dataNascimento: "1982-07-22",
      endereco: "Rua das Flores, 123",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01234-567",
      estadoCivil: "casado",
      profissao: "Engenheiro",
      dataBatismo: "2010-05-20",
      dataProfissaoFe: "2010-05-20",
      familiaId: "fam1",
      status: "ativo",
      fotoUrl: null,
      consentimentoLGPD: true,
      criadoEm: new Date(),
      idade: 41,
    },
    {
      id: "3",
      nome: "Ana Paula Costa",
      email: "ana.costa@email.com",
      telefone: "(11) 98765-4323",
      dataNascimento: "1990-11-10",
      endereco: "Av. Paulista, 500",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01311-000",
      estadoCivil: "solteiro",
      profissao: "Médica",
      dataBatismo: "2015-08-15",
      dataProfissaoFe: "2015-08-15",
      familiaId: null,
      status: "ativo",
      fotoUrl: null,
      consentimentoLGPD: true,
      criadoEm: new Date(),
      idade: 33,
    },
  ];

  const visitantes: (Visitante & { membroConvidou?: string })[] = [
    {
      id: "v1",
      nome: "Carlos Alberto Souza",
      email: "carlos.souza@email.com",
      telefone: "(11) 99876-5432",
      endereco: "Rua Nova, 456",
      comoConheceu: "Convite de membro",
      membroConvidouId: "1",
      dataVisita: "2024-11-03",
      observacoes: "Interessado em conhecer a igreja",
      status: "em_acompanhamento",
      consentimentoLGPD: true,
      criadoEm: new Date(),
      membroConvidou: "Maria Silva Santos",
    },
    {
      id: "v2",
      nome: "Beatriz Oliveira",
      email: "bia.oliveira@email.com",
      telefone: "(11) 99876-5433",
      endereco: "Av. São João, 789",
      comoConheceu: "Redes sociais",
      membroConvidouId: null,
      dataVisita: "2024-11-05",
      observacoes: "Primeira visita",
      status: "novo",
      consentimentoLGPD: true,
      criadoEm: new Date(),
    },
  ];

  const aniversariantes = membros
    .filter((m) => {
      if (!m.dataNascimento) return false;
      const hoje = new Date();
      const nascimento = new Date(m.dataNascimento);
      return nascimento.getMonth() === hoje.getMonth();
    })
    .map((m) => ({
      ...m,
      diaAniversario: m.dataNascimento ? new Date(m.dataNascimento).getDate() : 0,
    }))
    .sort((a, b) => a.diaAniversario - b.diaAniversario);

  const statusLabels = {
    ativo: "Ativo",
    inativo: "Inativo",
    transferido: "Transferido",
  };

  const statusVisitanteLabels = {
    novo: "Novo",
    em_acompanhamento: "Em Acompanhamento",
    membro: "Tornou-se Membro",
    inativo: "Inativo",
  };

  const statusColors = {
    ativo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    inativo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    transferido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    novo: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    em_acompanhamento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    membro: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Módulo Pastoral
          </h1>
          <p className="text-muted-foreground mt-1">Gestão de membros, famílias e visitantes</p>
        </div>
        {podeEditar && (
          <div className="flex gap-2">
            <Dialog open={dialogNovoMembro} onOpenChange={setDialogNovoMembro}>
              <DialogTrigger asChild>
                <Button data-testid="button-novo-membro">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Membro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Membro</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo membro da congregação
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input id="nome" placeholder="Digite o nome completo" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" placeholder="email@exemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input id="telefone" placeholder="(11) 98765-4321" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input id="dataNascimento" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estadoCivil">Estado Civil</Label>
                      <Select>
                        <SelectTrigger id="estadoCivil">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="endereco">Endereço Completo</Label>
                      <Input id="endereco" placeholder="Rua, número, complemento" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input id="bairro" placeholder="Nome do bairro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input id="cidade" placeholder="Nome da cidade" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profissao">Profissão</Label>
                      <Input id="profissao" placeholder="Profissão" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataBatismo">Data do Batismo</Label>
                      <Input id="dataBatismo" type="date" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="lgpd" className="w-4 h-4" required />
                    <Label htmlFor="lgpd" className="text-sm font-normal">
                      Consentimento LGPD: Autorizo o uso de meus dados pessoais para fins eclesiásticos
                    </Label>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogNovoMembro(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Salvar Membro</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogNovoVisitante} onOpenChange={setDialogNovoVisitante}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-novo-visitante">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Visitante
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Novo Visitante</DialogTitle>
                  <DialogDescription>
                    Cadastre informações do visitante para acompanhamento
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nomeVisitante">Nome Completo *</Label>
                      <Input id="nomeVisitante" placeholder="Digite o nome completo" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailVisitante">E-mail</Label>
                      <Input id="emailVisitante" type="email" placeholder="email@exemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefoneVisitante">Telefone</Label>
                      <Input id="telefoneVisitante" placeholder="(11) 98765-4321" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataVisita">Data da Visita *</Label>
                      <Input id="dataVisita" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comoConheceu">Como conheceu a igreja?</Label>
                      <Select>
                        <SelectTrigger id="comoConheceu">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="convite">Convite de membro</SelectItem>
                          <SelectItem value="internet">Internet/Redes sociais</SelectItem>
                          <SelectItem value="passava">Passava pelo local</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea id="observacoes" placeholder="Informações adicionais sobre o visitante" rows={3} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="lgpdVisitante" className="w-4 h-4" required />
                    <Label htmlFor="lgpdVisitante" className="text-sm font-normal">
                      Consentimento LGPD obtido para contato
                    </Label>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogNovoVisitante(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Salvar Visitante</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="membros" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="membros" data-testid="tab-membros">Membros</TabsTrigger>
          <TabsTrigger value="visitantes" data-testid="tab-visitantes">Visitantes</TabsTrigger>
          <TabsTrigger value="aniversariantes" data-testid="tab-aniversariantes">Aniversariantes</TabsTrigger>
        </TabsList>

        {/* Tab Membros */}
        <TabsContent value="membros" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Membros da Congregação</CardTitle>
                  <CardDescription>{membros.length} membros cadastrados</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar membros..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-busca-membros"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {membros.map((membro) => (
                  <div
                    key={membro.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    data-testid={`membro-${membro.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-primary">
                          {membro.nome.split(" ")[0][0]}{membro.nome.split(" ")[1]?.[0] || ""}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{membro.nome}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          {membro.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {membro.telefone}
                            </span>
                          )}
                          {membro.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {membro.email}
                            </span>
                          )}
                          {membro.idade && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {membro.idade} anos
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={statusColors[membro.status as keyof typeof statusColors]}>
                        {statusLabels[membro.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Visitantes */}
        <TabsContent value="visitantes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Visitantes em Acompanhamento</CardTitle>
                  <CardDescription>{visitantes.length} visitantes registrados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {visitantes.map((visitante) => (
                  <div
                    key={visitante.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    data-testid={`visitante-${visitante.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-purple-600">
                          {visitante.nome.split(" ")[0][0]}{visitante.nome.split(" ")[1]?.[0] || ""}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{visitante.nome}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          {visitante.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {visitante.telefone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Visitou em {new Date(visitante.dataVisita).toLocaleDateString("pt-BR")}
                          </span>
                          {visitante.membroConvidou && (
                            <span className="flex items-center gap-1">
                              <UserPlus className="w-3 h-3" />
                              Convidado por {visitante.membroConvidou}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={statusColors[visitante.status as keyof typeof statusColors]}>
                        {statusVisitanteLabels[visitante.status as keyof typeof statusVisitanteLabels]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Aniversariantes */}
        <TabsContent value="aniversariantes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CakeSlice className="w-5 h-5" />
                Aniversariantes do Mês
              </CardTitle>
              <CardDescription>
                {aniversariantes.length} aniversariantes em {new Date().toLocaleDateString("pt-BR", { month: "long" })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {aniversariantes.map((membro) => (
                  <div
                    key={membro.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500/20 to-rose-500/5 flex items-center justify-center">
                        <CakeSlice className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-medium">{membro.nome}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {membro.diaAniversario} de {new Date().toLocaleDateString("pt-BR", { month: "long" })}
                          {membro.idade && ` • ${membro.idade} anos`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      Dia {membro.diaAniversario}
                    </Badge>
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
