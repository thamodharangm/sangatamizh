import app from './app.js';

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`[Backend] Stable streaming running at http://localhost:${PORT}`);
});
