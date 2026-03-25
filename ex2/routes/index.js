const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_URL = process.env.API_URL || "http://localhost:16025/repairs";

// Verifica se o parâmetro é um MongoDB ObjectId (24 caracteres hex)
function isObjectId(str) {
    return /^[a-f\d]{24}$/i.test(str);
}

// GET / — página principal: tabela com todos os registos
router.get('/', async (req, res) => {
    const d = new Date().toISOString().substring(0, 16);
    try {
        const response = await axios.get(API_URL);
        res.render('index', { repairs: response.data, date: d });
    } catch (err) {
        res.render('error', { error: err, message: "Erro ao aceder à API" });
    }
});

// GET /:param — se for ObjectId → página do registo; senão → página da marca
router.get('/:param', async (req, res) => {
    const d = new Date().toISOString().substring(0, 16);
    const { param } = req.params;

    try {
        if (isObjectId(param)) {
            // Página do registo
            const response = await axios.get(`${API_URL}/${param}`);
            res.render('repair', { repair: response.data, date: d });
        } else {
            // Página da marca
            const response = await axios.get(`${API_URL}?marca=${param}`);
            const repairs = response.data;

            // Modelos únicos desta marca
            const modelos = [...new Set(repairs.map(r => r.viatura?.modelo).filter(Boolean))].sort();

            res.render('marca', { marca: param, repairs, modelos, date: d });
        }
    } catch (err) {
        res.render('error', { error: err, message: "Registo ou marca não encontrado" });
    }
});

module.exports = router;