const express = require('express');
const path = require('path');
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public'));

// Rotas
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

const PORT = process.env.PORT || 16026;
app.listen(PORT, () => console.log(`Interface em http://localhost:${PORT}`));