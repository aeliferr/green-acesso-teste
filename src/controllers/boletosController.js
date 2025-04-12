const boletosRouter = require('express')().router
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')
const { pool } = require('../../db-config')

const tempFilePath = path.join(__dirname, 'temp/')
const upload = multer({ dest: tempFilePath })

module.exports = boletosRouter

boletosRouter.get('/', async (req, res) => {
    const client = await pool.connect()
    try {
        const { nome, valor_inicial, valor_final, id_lote, relatorio} = req.query
        
        const params = [];
        const where = [];

        if (nome) {
            params.push(`%${nome}%`);
            where.push(`nome_sacado ILIKE $${params.length}`);
        }
        if (valor_inicial) {
            params.push(valor_inicial);
            where.push(`valor >= $${params.length}`);
        }
        if (valor_final) {
            params.push(valor_final);
            where.push(`valor <= $${params.length}`);
        }
        if (id_lote) {
            params.push(id_lote);
            where.push(`id_lote = $${params.length}`);
        }

        const query = `SELECT * FROM boletos${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY id`;

        const { rows } = await client.query(query, params);

        if (relatorio === '1') {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { height } = page.getSize();
            const fontSize = 10;
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
            let y = height - 40;
            page.drawText('Relatório de Boletos', {
              x: 50,
              y,
              size: 14,
              font,
              color: rgb(0, 0, 0),
            });
            y -= 25;
      
            const header = 'ID | Nome Sacado           | ID Lote | Valor   | Linha Digitável';
            page.drawText(header, { x: 50, y, size: fontSize, font });
            y -= 15;
      
            rows.forEach((boleto) => {
              const line = `${boleto.id.toString().padEnd(3)} | ${boleto.nome_sacado.padEnd(20)} | ${boleto.id_lote.toString().padEnd(7)} | ${parseFloat(boleto.valor).toFixed(2).padEnd(7)} | ${boleto.linha_digitavel}`;
              page.drawText(line, { x: 50, y, size: fontSize, font });
              y -= 12;
            });
      
            const pdfBytes = await pdfDoc.save();
            res.json({ base64: Buffer.from(pdfBytes).toString('base64') });
        } else {
            res.json(rows);
        }
    } catch (error) {
        console.log(error)
        res.status(500).send('falha ao processar requisição')
    } finally {
        client.release()
    }
})

boletosRouter.post('/pdf', upload.single('file'), async (req, res) => {
    const client = await pool.connect()
    try {
        const filePath = req.file.path;
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const totalPages = pdfDoc.getPageCount();

        const mapeamento = (await client.query('select * from mapeamento_ordem_boletos;')).rows

        if (mapeamento.length !== totalPages)
            return res.status(400).send('Número de páginas no PDF não corresponde ao número de boletos.');

        const outputDir = path.join(__dirname, '../../', 'boletos/');

        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    
        for (let i = 0; i < totalPages; i++) {
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);
            const pdfBytes = await newPdf.save();
            const boletoId = mapeamento[i].id_boleto;
            fs.writeFileSync(path.join(outputDir, `${boletoId}.pdf`), pdfBytes);
        }
    } catch (error) {
        console.log(error)
        res.status(500).send('falha ao processar boletos')
    } finally {
        fs.unlink(tempFilePath)
        client.release()
    }

    res.sendStatus(200)
})