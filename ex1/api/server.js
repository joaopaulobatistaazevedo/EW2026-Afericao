const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// Logger
app.use(function(req, res, next){
    var d = new Date().toISOString().substring(0, 16)
    console.log(req.method + " " + req.url + " " + d)
    next()
})

// 1. Conexão ao MongoDB
const nomeBD = "autoRepair"
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`
mongoose.connect(mongoHost)
    .then(() => console.log(`MongoDB: liguei-me à base de dados ${nomeBD}.`))
    .catch(err => console.error('Erro:', err));

// 2. Schema flexível
const repairSchema = new mongoose.Schema({}, { strict: false, collection: 'repairs', versionKey: false });
const Repair = mongoose.model('Repair', repairSchema);

// 3. Rotas

// GET /repairs/matriculas - lista de matrículas sem repetições, ordenada alfabeticamente
// NOTA: declarada antes de /:id para não ser interpretada como id
app.get('/repairs/matriculas', async (req, res) => {
    try {
        const matriculas = await Repair.distinct("viatura.matricula");
        matriculas.sort();
        res.json(matriculas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /repairs/interv - lista de intervenções únicas (código, nome, descrição), ordenada por código
app.get('/repairs/interv', async (req, res) => {
    try {
        const result = await Repair.aggregate([
            { $unwind: "$intervencoes" },
            {
                $group: {
                    _id: "$intervencoes.codigo",
                    codigo:    { $first: "$intervencoes.codigo" },
                    nome:      { $first: "$intervencoes.nome" },
                    descricao: { $first: "$intervencoes.descricao" }
                }
            },
            { $sort: { codigo: 1 } },
            { $project: { _id: 0, codigo: 1, nome: 1, descricao: 1 } }
        ]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /repairs          - todos os registos
// GET /repairs?ano=YYYY - filtrar por ano
// GET /repairs?marca=X  - filtrar por marca (case-insensitive)
app.get('/repairs', async (req, res) => {
    try {
        const { ano, marca } = req.query;
        let filter = {};

        if (ano)   filter.data = { $regex: `^${ano}-` };
        if (marca) filter["viatura.marca"] = { $regex: new RegExp(`^${marca}$`, "i") };

        const repairs = await Repair.find(filter);
        res.json(repairs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /repairs/:id - registo por id
app.get('/repairs/:id', async (req, res) => {
    try {
        const repair = await Repair.findById(req.params.id);
        if (!repair) return res.status(404).json({ error: "Não encontrado" });
        res.json(repair);
    } catch (err) {
        res.status(400).json({ error: "ID inválido ou erro de sistema" });
    }
});

// POST /repairs - adicionar novo registo
app.post('/repairs', async (req, res) => {
    try {
        const newRepair = new Repair(req.body);
        const saved = await newRepair.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /repairs/:id - eliminar registo por id
app.delete('/repairs/:id', async (req, res) => {
    try {
        const deleted = await Repair.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Não encontrado" });
        res.json({ message: "Eliminado com sucesso", id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(16025, () => console.log('API a correr em http://localhost:16025/repairs'));