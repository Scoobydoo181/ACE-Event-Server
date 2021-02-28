import express from 'express'

const app = express()

function getZoomLink(name, description, date, time) {
    return 'www.zoom.us.com/'
}

function insertEvent(name, description, date, time) {

}

app.post('/slack', (req, res) => {
    res.send({key: 'value'})
})

app.get('/test', (req, res) => {
    res.sendStatus(200)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})