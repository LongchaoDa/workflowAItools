import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 4000);

const app = buildApp();
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
