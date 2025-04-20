const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const dataPath = './data/stock.json';

const readData = () => JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const writeData = (data) => fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

app.get('/stock', (req, res) => {
  res.json(readData());
});

app.post('/stock', (req, res) => {
  const stock = readData();
  stock.push(req.body);
  writeData(stock);
  res.status(201).json({ message: 'Stock added' });
});

app.post('/stock/update', (req, res) => {
  const updatedStock = req.body;
  writeData(updatedStock);
  res.json({ message: 'Stock updated successfully' });
});

app.delete('/stock/:name', (req, res) => {
  const stock = readData().filter(item => item.name !== req.params.name);
  writeData(stock);
  res.json({ message: 'Item deleted' });
});

app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
