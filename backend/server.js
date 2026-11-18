const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const MAX_ON_SCREEN = 120;

let characters = [
  {
    id: 1,
    name: "Основатель",
    color: "#ffd32a",
    pantsColor: "#1e272e",
    hairColor: "#2f3542",
    hairStyle: 1,
    skinColor: "#f1c27d",
    habit: "coffee",
    x: 480,
    y: 425,
    tier: "king",
    createdAt: Date.now()
  }
];
let totalSpawned = 1;

app.get('/ping', (req, res) => res.send('OK'));

app.post('/api/webhook/spawn', (req, res) => {
  const { name, tier } = req.body;
  if (!name) return res.status(400).json({ error: "Имя не передано" });

  const jacketColors = ["#ff4757", "#2ed573", "#1e90ff", "#ffa502", "#ff6b81", "#70a1ff", "#a55eea", "#00d2d3", "#eb4d4b", "#6ab04c"];
  const pantsColors = ["#1e272e", "#2f3640", "#222f3e", "#353b48", "#192a56", "#2c3e50"];
  const hairColors = ["#2f3542", "#574b90", "#833471", "#b33939", "#cd6133", "#cc8e35", "#d1ccc0", "#40407a"];
  const skinColors = ["#ffdbac", "#f1c27d", "#e0ac69", "#c68642", "#ffdfbe"];
  const habits = ["coffee", "phone", "music", "smoke", "workout"];

  const validTier = ["basic", "vip", "king"].includes(tier) ? tier : "basic";
  const randomColor = jacketColors[Math.floor(Math.random() * jacketColors.length)];

  const newChar = {
    id: Date.now() + Math.random(),
    name: String(name).trim().slice(0, 16),
    color: validTier === 'king' ? '#ffd32a' : randomColor,
    pantsColor: pantsColors[Math.floor(Math.random() * pantsColors.length)],
    hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
    hairStyle: Math.floor(Math.random() * 3),
    skinColor: skinColors[Math.floor(Math.random() * skinColors.length)],
    habit: habits[Math.floor(Math.random() * habits.length)],
    x: Math.floor(Math.random() * 860) + 50,
    y: Math.floor(Math.random() * 135) + 380,
    tier: validTier,
    createdAt: Date.now()
  };

  characters.push(newChar);
  totalSpawned++;

  if (characters.length > MAX_ON_SCREEN) {
    const victimIndex = characters.findIndex(c => c.tier !== 'king');
    if (victimIndex !== -1) {
      const removed = characters.splice(victimIndex, 1)[0];
      io.emit('remove_character', removed.id);
    }
  }

  io.emit('new_character', { character: newChar, total: totalSpawned });
  res.status(200).json({ success: true, character: newChar });
});

io.on('connection', (socket) => {
  socket.emit('init_world', { characters, total: totalSpawned });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`FlexWorld Living City запущен на порту ${PORT}`));