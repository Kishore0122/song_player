const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// Route to list albums (subfolders inside /songs/)
app.get('/songs/', (req, res) => {
  const songsDir = path.join(__dirname, '../public/songs');
  fs.readdir(songsDir, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error("Error reading songs directory:", err);
      return res.status(500).send("Error reading songs directory");
    }

    const folders = files
      .filter(dirent => dirent.isDirectory())
      .map(dirent => `<a href="/songs/${dirent.name}/">${dirent.name}</a>`)
      .join("<br>");

    res.send(folders);
  });
});

// Route to list songs inside an album folder
app.get('/songs/:album/', (req, res) => {
  const album = req.params.album;
  const albumPath = path.join(__dirname, `../public/songs/${album}`);

  fs.readdir(albumPath, (err, files) => {
    if (err) {
      console.error("Error reading album folder:", err);
      return res.status(404).send("Album not found");
    }

    const links = files
      .filter(file => file.endsWith('.mp3'))
      .map(file => `<a href="/songs/${album}/${file}">${file}</a>`)
      .join("<br>");

    res.send(links);
  });
});

// Route to serve album info (info.json)
app.get('/songs/:album/info.json', (req, res) => {
  const album = req.params.album;
  const infoPath = path.join(__dirname, `../public/songs/${album}/info.json`);

  fs.readFile(infoPath, 'utf-8', (err, data) => {
    if (err) {
      console.error("Error reading info.json:", err);
      return res.status(404).json({ error: "Info not found" });
    }

    res.json(JSON.parse(data));
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
