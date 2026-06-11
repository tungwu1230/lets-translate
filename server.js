/**
 * lets-translate 安全代理伺服器 (Zero-Dependency Proxy Server)
 * 
 * 作用：
 * 1. 解決瀏覽器直連 OpenAI / Gemini 的 CORS 跨來源限制。
 * 2. 避免將敏感的 API Keys 暴露在前端網頁或 LocalStorage 中。
 * 
 * 啟動方式：
 *   export OPENAI_API_KEY="your-openai-key"
 *   export GEMINI_API_KEY="your-gemini-key"
 *   node server.js
 * 
 * 在 Let's Translate 網頁中：
 *   將供應商設為「自訂 (Custom)」，端點填入：http://localhost:3001/v1/chat/completions
 *   (API Key 欄位可留空，代理伺服器會自動從環境變數注入)
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  // 1. 設定 CORS 標頭，允許本機開發端點跨來源請求
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 處理 Preflight 請求
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 2. 路由分流
  let targetUrl = "";
  let apiKey = "";

  if (req.url.startsWith("/v1/chat/completions")) {
    targetUrl = "https://api.openai.com/v1/chat/completions";
    // 優先使用環境變數中的 Key，若無則嘗試取用前端發過來的 Authorization
    apiKey = process.env.OPENAI_API_KEY || (req.headers["authorization"] || "").replace("Bearer ", "");
  } else if (req.url.startsWith("/v1beta/models")) {
    // 支援 Gemini Proxy 轉接
    targetUrl = `https://generativelanguage.googleapis.com${req.url}`;
    apiKey = process.env.GEMINI_API_KEY;
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { message: "未知的代理路徑。支援 /v1/chat/completions 與 /v1beta/models" } }));
    return;
  }

  // 3. 收集前端發送的 Body 資料
  let bodyChunks = [];
  req.on("data", (chunk) => {
    bodyChunks.push(chunk);
  });

  req.on("end", () => {
    const bodyBuffer = Buffer.concat(bodyChunks);
    
    // 解析目標網址
    const parsedUrl = new URL(targetUrl);
    
    // 如果是 Gemini 且環境變數有 key，自動在 Query String 加上 key
    if (targetUrl.includes("googleapis.com") && apiKey) {
      parsedUrl.searchParams.set("key", apiKey);
    }

    const headers = {
      "Content-Type": "application/json",
    };

    // 如果是 OpenAI，注入 Authorization 標頭
    if (targetUrl.includes("openai.com") && apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const proxyReq = https.request(
      parsedUrl.toString(),
      {
        method: "POST",
        headers: headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on("error", (err) => {
      console.error("代理轉發出錯:", err);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: `代理伺服器轉發失敗: ${err.message}` } }));
    });

    proxyReq.write(bodyBuffer);
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Let's Translate 安全代理伺服器已於 http://localhost:${PORT} 啟動`);
  console.log(`=======================================================`);
  console.log(` 提示：請於啟動前設定環境變數：`);
  console.log(`   export OPENAI_API_KEY="您的金鑰"`);
  console.log(`   export GEMINI_API_KEY="您的金鑰"`);
  console.log(`=======================================================`);
});
