const app = require('express')()
const boletosRouter = require('./src/controllers/boletosController')
const uploadRouter = require('./src/controllers/uploadController')

app.listen(process.env.API_PORT, (error) => {
    if (error) {
        throw error
    }

    console.log(`servidor rodando na porta ${process.env.API_PORT}`)
})

app.use('/boletos', boletosRouter)
app.use('/upload', uploadRouter)

app.get('/ping', (req, res) => {
    res.send('pong')
})