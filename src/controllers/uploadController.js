const uploadRouter = require('express')().router
const csv = require('csv-parser')
const fs = require('fs')
const multer = require('multer')
const { pool } = require('../../db-config')
const path = require('path')

const upload = multer({
    dest: path.join(__dirname, 'temp/')
})

module.exports = uploadRouter

uploadRouter.post('/', upload.single('file'), async (req, res) => {
    const boletos = await parseCSV(req.file.path)

    const client = await pool.connect()

    try {
        for (let i = 0; i < boletos.length; i++) {
            const boleto = boletos[i];

            let nomeUnidadeFormatada = boleto.unidade

            for (let i = 0; i < 4; i++) {
                if (nomeUnidadeFormatada.length < 4)
                    nomeUnidadeFormatada = `0${nomeUnidadeFormatada}`
                else
                    break
            }

            let lote = await client.query('select id, nome from lotes where nome = ($1) limit 1;', [nomeUnidadeFormatada])

            if (lote.rows.length === 0) {
                lote = await client.query('insert into lotes (nome, ativo, criado_em) values ($1, true, NOW()) RETURNING *;', [nomeUnidadeFormatada], true, now()).rows[0]
                console.log('result: ', result)
            }

            lote = lote.rows[0]

            // TODO: descobrir se a inserção de query em query afeta desempenho. Se sim, descobrir como se faz inserção de multiplos registros em uma única query
            const query = 'insert into boletos (nome_sacado, id_lote, valor, linha_digitavel, ativo, criado_em) values ($1, $2, $3, $4, true, NOW());'
            const values = [
                boleto.nome,
                lote.id,
                parseFloat(boleto.valor),
                boleto.linha_digitavel
            ]

            await client.query(query, values)
        }
    } catch (error) {
        res.status(500).json(error)
    } finally {
        client.release()
        fs.unlink(req.file.path, (err) => {
            if (err) {
                // TODO implementar forma de notificar a falha ou de remover os arquivos de tempos em tempos do servidor
                throw err
            }

            console.log('arquivo deletado')
        })
    }

    res.sendStatus(200)
})

const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const result = []
        fs.createReadStream(filePath)
        .pipe(csv( { separator: ';', mapHeaders: ({ header }) => header.trim() }))
        .on('data', (data) => result.push(data))
        .on('end', () => resolve(result))
        .on('error', (error) => reject)
    })
}