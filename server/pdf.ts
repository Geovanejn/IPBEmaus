import PDFDocument from "pdfkit";
import { type Boletim, type Ata, type Reuniao, type Membro, type Visitante } from "@shared/schema";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    doc.fontSize(24).font('Helvetica-Bold').text('IPB Emaús', { align: 'center' });
    doc.fontSize(16).font('Helvetica').text('Boletim Dominical', { align: 'center' });
    doc.moveDown(0.5);

    const dataFormatada = new Date(boletim.data + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.fontSize(12).text(dataFormatada, { align: 'center' });
    doc.moveDown(2);

    if (boletim.versiculoSemana) {
      doc.fontSize(14).font('Helvetica-Bold').text('Versículo da Semana');
      doc.fontSize(11).font('Helvetica-Oblique').text(boletim.versiculoSemana);
      doc.moveDown(1.5);
    }

    if (boletim.devocional) {
      doc.fontSize(14).font('Helvetica-Bold').text('Devocional');
      doc.fontSize(11).font('Helvetica').text(boletim.devocional, { align: 'justify' });
      doc.moveDown(1.5);
    }

    if (boletim.eventos && boletim.eventos.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Eventos');
      boletim.eventos.forEach((evento: string) => {
        doc.fontSize(11).font('Helvetica').text(`• ${evento}`);
      });
      doc.moveDown(1.5);
    }

    if (aniversariantes.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Aniversariantes da Semana');
      aniversariantes.forEach((membro) => {
        const data = membro.dataNascimento 
          ? new Date(membro.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          : '';
        doc.fontSize(11).font('Helvetica').text(`• ${membro.nome} ${data ? `(${data})` : ''}`);
      });
      doc.moveDown(1.5);
    }

    if (visitantes.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Visitantes Recentes');
      visitantes.forEach((visitante) => {
        doc.fontSize(11).font('Helvetica').text(`• ${visitante.nome}`);
      });
      doc.moveDown(1.5);
    }

    if (boletim.pedidosOracao && boletim.pedidosOracao.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Pedidos de Oração');
      boletim.pedidosOracao.forEach((pedido: string) => {
        doc.fontSize(11).font('Helvetica').text(`• ${pedido}`);
      });
      doc.moveDown(1.5);
    }

    if (boletim.avisos && boletim.avisos.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Avisos');
      boletim.avisos.forEach((aviso: string) => {
        doc.fontSize(11).font('Helvetica').text(`• ${aviso}`);
      });
      doc.moveDown(1.5);
    }

    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Oblique')
      .text('Igreja Presbiteriana do Brasil - IPB Emaús', { align: 'center' });

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
