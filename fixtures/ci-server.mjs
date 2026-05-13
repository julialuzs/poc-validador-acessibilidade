import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "site");
const port = Number(process.env.PORT || 8765);

const routes = {
  "/": "index.html",
  "/sobre": "sobre.html",
  "/login": "login.html",
  "/dashboard": "dashboard.html",
  "/perfil": "perfil.html"
};

const server = http.createServer(async (req, res) => {
  const pathname = (req.url ?? "/").split("?")[0] || "/";
  const fileName = routes[pathname];
  if (!fileName) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  try {
    const body = await readFile(join(root, fileName), "utf-8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(body);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Erro ao ler arquivo");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Fixture server em http://127.0.0.1:${port}`);
});
