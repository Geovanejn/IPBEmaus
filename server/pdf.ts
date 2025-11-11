import PDFDocument from "pdfkit";
import { type Boletim, type Ata, type Reuniao, type Membro, type Visitante, type ItemLiturgia, type PedidoOracao } from "@shared/schema";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações de layout para 3 colunas
const LAYOUT = {
  margin: 30,
  colWidth: 175,
  gap: 5,
  col1X: 30,
  col2X: 210,
  col3X: 390,
  pageWidth: 595,
  pageHeight: 842,
};

// Helper para escrever texto em coluna específica com quebra automática
function writeInColumn(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  options: any = {}
): number {
  const currentY = y;
  doc.text(text, x, currentY, { width, ...options });
  return doc.y;
}

// Helper para escrever título de seção
function writeTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  x: number,
  y: number,
  width: number
): number {
  doc.fontSize(9).font('Helvetica-Bold');
  return writeInColumn(doc, title, x, y, width);
}

// Helper para escrever texto normal
function writeText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize = 7
): number {
  doc.fontSize(fontSize).font('Helvetica');
  return writeInColumn(doc, text, x, y, width);
}

// Função principal de geração de PDF com layout de 3 colunas
export async function gerarPDFBoletim(
  boletim: Boletim,
  aniversariantes: Membro[],
  visitantes: Visitante[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfDir = path.join(__dirname, "..", "uploads", "pdfs");
    
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const filename = `boletim_${boletim.data}_${Date.now()}.pdf`;
    const filepath = path.join(pdfDir, filename);
    const fileUrl = `/uploads/pdfs/${filename}`;

    const doc = new PDFDocument({ 
      margin: LAYOUT.margin,
      size: 'A4',
    });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // COLUNA ESQUERDA - Informações gerais
    let col1Y = LAYOUT.margin;
    
    // SAF
    if (boletim.saf) {
      col1Y = writeTitle(doc, 'SAF', LAYOUT.col1X, col1Y, LAYOUT.colWidth);
      col1Y = writeText(doc, boletim.saf, LAYOUT.col1X, col1Y + 3, LAYOUT.colWidth);
      col1Y += 12;
    }

    // Junta Diaconal - Oferta do Dia
    if (boletim.ofertaDia) {
      col1Y = writeTitle(doc, 'Junta Diaconal', LAYOUT.col1X, col1Y, LAYOUT.colWidth);
      col1Y = writeText(doc, `Oferta do Dia: ${boletim.ofertaDia}`, LAYOUT.col1X, col1Y + 3, LAYOUT.colWidth);
      col1Y += 12;
    }

    // Visitantes Recentes
    if (visitantes && visitantes.length > 0) {
      col1Y = writeTitle(doc, 'Visitantes Recentes', LAYOUT.col1X, col1Y, LAYOUT.colWidth);
      visitantes.forEach((visitante) => {
        const dataVisita = visitante.dataVisita 
          ? new Date(visitante.dataVisita + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          : '';
        col1Y = writeText(doc, `• ${visitante.nome}${dataVisita ? ` (${dataVisita})` : ''}`, LAYOUT.col1X, col1Y + 2, LAYOUT.colWidth, 7);
      });
      col1Y += 12;
    }

    // Informações de Transmissão
    col1Y = writeTitle(doc, 'Transmissão ao Vivo', LAYOUT.col1X, col1Y, LAYOUT.colWidth);
    col1Y = writeText(doc, 'Domingos, 9h e 18h, pelo YouTube da igreja.', LAYOUT.col1X, col1Y + 3, LAYOUT.colWidth);
    col1Y += 12;

    // COLUNA CENTRAL - Pedidos e Relatórios
    let col2Y = LAYOUT.margin;

    // Eventos
    if (boletim.eventos && boletim.eventos.length > 0) {
      col2Y = writeTitle(doc, 'Eventos e Avisos', LAYOUT.col2X, col2Y, LAYOUT.colWidth);
      boletim.eventos.forEach((evento: string) => {
        col2Y = writeText(doc, `• ${evento}`, LAYOUT.col2X, col2Y + 2, LAYOUT.colWidth, 7);
      });
      col2Y += 10;
    }

    // Pedidos de Oração
    if (boletim.pedidosOracao && Array.isArray(boletim.pedidosOracao) && boletim.pedidosOracao.length > 0) {
      col2Y = writeTitle(doc, 'Pedidos de Oração', LAYOUT.col2X, col2Y, LAYOUT.colWidth);
      col2Y += 3;
      
      const categorias: Record<string, string> = {
        conversao: 'Conversão',
        direcao_divina: 'Direção Divina',
        emprego: 'Emprego',
        saude: 'Saúde',
        igreja: 'Igreja Emaús',
        outros: 'Outros',
      };

      const pedidosPorCategoria: Record<string, string[]> = {};
      boletim.pedidosOracao.forEach((pedido: PedidoOracao) => {
        if (!pedidosPorCategoria[pedido.categoria]) {
          pedidosPorCategoria[pedido.categoria] = [];
        }
        pedidosPorCategoria[pedido.categoria].push(pedido.descricao);
      });

      Object.entries(pedidosPorCategoria).forEach(([cat, descricoes]) => {
        const label = categorias[cat] || cat;
        doc.fontSize(7).font('Helvetica-Bold');
        col2Y = writeInColumn(doc, `${label}:`, LAYOUT.col2X, col2Y, LAYOUT.colWidth);
        
        descricoes.forEach((desc) => {
          col2Y = writeText(doc, `• ${desc}`, LAYOUT.col2X, col2Y + 1, LAYOUT.colWidth, 7);
        });
        col2Y += 4;
      });
      col2Y += 6;
    }

    // Relatório EBD
    if (boletim.relatorioEbd) {
      col2Y = writeTitle(doc, 'Relatório Geral EBD', LAYOUT.col2X, col2Y, LAYOUT.colWidth);
      
      const relatorio = boletim.relatorioEbd;
      col2Y = writeText(doc, `Matriculados: ${relatorio.matriculados || 0}`, LAYOUT.col2X, col2Y + 2, LAYOUT.colWidth, 7);
      
      if (relatorio.domingos && relatorio.domingos.length > 0) {
        relatorio.domingos.forEach((domingo: any) => {
          const dataEbd = domingo.data ? new Date(domingo.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
          col2Y = writeText(doc, 
            `${dataEbd}: Presentes ${domingo.presentes || 0}, Ausentes ${domingo.ausentes || 0}, Visitantes ${domingo.visitantes || 0}, Bíblias ${domingo.biblias || 0}`, 
            LAYOUT.col2X, 
            col2Y + 1, 
            LAYOUT.colWidth, 
            6
          );
        });
      }
      col2Y += 10;
    }

    // Aniversariantes
    if (boletim.aniversariosMembros && boletim.aniversariosMembros.length > 0) {
      col2Y = writeTitle(doc, 'Aniversariantes', LAYOUT.col2X, col2Y, LAYOUT.colWidth);
      boletim.aniversariosMembros.forEach((aniv: any) => {
        col2Y = writeText(doc, `• ${aniv.nome} (${aniv.data})`, LAYOUT.col2X, col2Y + 2, LAYOUT.colWidth, 7);
      });
      col2Y += 10;
    } else if (aniversariantes.length > 0) {
      col2Y = writeTitle(doc, 'Aniversariantes da Semana', LAYOUT.col2X, col2Y, LAYOUT.colWidth);
      aniversariantes.forEach((membro) => {
        const data = membro.dataNascimento 
          ? new Date(membro.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          : '';
        col2Y = writeText(doc, `• ${membro.nome} ${data ? `(${data})` : ''}`, LAYOUT.col2X, col2Y + 2, LAYOUT.colWidth, 7);
      });
      col2Y += 10;
    }

    // Avisos
    if (boletim.avisos && boletim.avisos.length > 0) {
      col2Y = writeTitle(doc, 'Avisos', LAYOUT.col2X, col2Y, LAYOUT.colWidth);
      boletim.avisos.forEach((aviso: string) => {
        col2Y = writeText(doc, `• ${aviso}`, LAYOUT.col2X, col2Y + 2, LAYOUT.colWidth, 7);
      });
    }

    // COLUNA DIREITA - Cabeçalho e Liturgia
    let col3Y = LAYOUT.margin;

    // Cabeçalho com Data e Edição
    doc.fontSize(10).font('Helvetica-Bold');
    const dataFormatada = new Date(boletim.data + 'T12:00:00').toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    col3Y = writeInColumn(doc, `São Paulo, ${dataFormatada}`, LAYOUT.col3X, col3Y, LAYOUT.colWidth, { align: 'center' });
    col3Y = writeText(doc, `Edição nº ${boletim.numeroEdicao} - Ano ${boletim.anoEdicao}`, LAYOUT.col3X, col3Y + 2, LAYOUT.colWidth, 8);
    col3Y += 15;

    // Mensagem/Título
    doc.fontSize(11).font('Helvetica-Bold');
    col3Y = writeInColumn(doc, boletim.tituloMensagem, LAYOUT.col3X, col3Y, LAYOUT.colWidth, { align: 'center' });
    
    if (boletim.textoMensagem) {
      doc.fontSize(8).font('Helvetica-Oblique');
      col3Y = writeInColumn(doc, boletim.textoMensagem, LAYOUT.col3X, col3Y + 2, LAYOUT.colWidth, { align: 'center' });
    }
    col3Y += 10;

    // Liturgia
    if (boletim.liturgia && Array.isArray(boletim.liturgia) && boletim.liturgia.length > 0) {
      const tiposLiturgia: Record<string, string> = {
        preludio: 'Prelúdio',
        hino: 'Hino',
        leitura: 'Leitura Bíblica',
        oracao: 'Oração',
        cantico: 'Cântico',
        mensagem: 'Mensagem Bíblica',
        benção: 'Bênção Apostólica',
        amem: 'Amém Tríplice',
        posludio: 'Poslúdio',
        aviso: 'Agradecimentos e Avisos',
      };

      boletim.liturgia.forEach((item: ItemLiturgia) => {
        const label = tiposLiturgia[item.tipo] || item.tipo;
        
        // Escreve o tipo em negrito
        doc.fontSize(7).font('Helvetica-Bold');
        col3Y = writeInColumn(doc, label, LAYOUT.col3X, col3Y + 2, LAYOUT.colWidth);
        
        // Detalhes em texto normal
        const detalhes: string[] = [];
        if (item.numero) detalhes.push(`Nº ${item.numero}`);
        if (item.conteudo && item.conteudo !== label) detalhes.push(`"${item.conteudo}"`);
        if (item.referencia) detalhes.push(item.referencia);
        
        if (detalhes.length > 0) {
          col3Y = writeText(doc, detalhes.join(' - '), LAYOUT.col3X, col3Y + 1, LAYOUT.colWidth, 6);
        }
      });
      col3Y += 10;
    }

    // Devocional
    if (boletim.devocional) {
      col3Y = writeTitle(doc, 'Devocional', LAYOUT.col3X, col3Y, LAYOUT.colWidth);
      col3Y = writeText(doc, boletim.devocional, LAYOUT.col3X, col3Y + 3, LAYOUT.colWidth, 7);
    }

    // Rodapé centralizado
    doc.fontSize(7).font('Helvetica-Oblique')
      .text('Todas as informações para o boletim devem ser enviadas até quinta-feira ao seguinte e-mail: ipbemaus@gmail.com', 
        LAYOUT.margin, 
        LAYOUT.pageHeight - 40, 
        { width: LAYOUT.pageWidth - (LAYOUT.margin * 2), align: 'center' }
      );

    doc.end();

    stream.on('finish', () => {
      resolve(fileUrl);
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

export async function gerarPDFAta(
  ata: Ata,
  reuniao: Reuniao,
  secretario: { nome: string }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfDir = path.join(__dirname, "..", "uploads", "pdfs");
    
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const filename = `ata_${reuniao.tipo}_${reuniao.data}_${Date.now()}.pdf`;
    const filepath = path.join(pdfDir, filename);
    const fileUrl = `/uploads/pdfs/${filename}`;

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    doc.fontSize(24).font('Helvetica-Bold').text('IPB Emaús', { align: 'center' });
    doc.fontSize(16).font('Helvetica').text('Ata de Reunião', { align: 'center' });
    doc.moveDown(2);

    const tipoLabels: Record<string, string> = {
      conselho: 'Conselho',
      congregacao: 'Congregação',
      diretoria: 'Diretoria',
    };

    doc.fontSize(14).font('Helvetica-Bold').text(`Tipo: ${tipoLabels[reuniao.tipo] || reuniao.tipo}`);
    
    const dataFormatada = new Date(reuniao.data + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.fontSize(12).font('Helvetica').text(`Data: ${dataFormatada}`);
    
    if (reuniao.local) {
      doc.text(`Local: ${reuniao.local}`);
    }
    
    doc.moveDown(1.5);

    if (reuniao.participantes && reuniao.participantes.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Participantes');
      reuniao.participantes.forEach((participante: string) => {
        doc.fontSize(11).font('Helvetica').text(`• ${participante}`);
      });
      doc.moveDown(1.5);
    }

    doc.fontSize(14).font('Helvetica-Bold').text('Conteúdo da Ata');
    doc.fontSize(11).font('Helvetica').text(ata.conteudo, { align: 'justify' });
    doc.moveDown(2);

    if (ata.aprovada) {
      doc.fontSize(12).font('Helvetica-Bold').text('Status: Aprovada');
      if (ata.dataAprovacao) {
        const dataAprovacao = new Date(ata.dataAprovacao).toLocaleDateString('pt-BR');
        doc.fontSize(10).font('Helvetica').text(`Data de aprovação: ${dataAprovacao}`);
      }
      doc.moveDown(1.5);
    }

    doc.fontSize(10).font('Helvetica')
      .text(`Secretário(a): ${secretario.nome}`, { align: 'right' });
    
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Oblique')
      .text('Igreja Presbiteriana do Brasil - IPB Emaús', { align: 'center' });

    if (ata.aprovada) {
      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica-Oblique')
        .text('Este documento foi oficialmente aprovado e está bloqueado para edição.', { align: 'center' });
    }

    doc.end();

    stream.on('finish', () => {
      resolve(fileUrl);
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}
