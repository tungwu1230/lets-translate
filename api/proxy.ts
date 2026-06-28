export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-target-url',
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  const targetUrl = req.headers.get('x-target-url')
  if (!targetUrl) {
    return new Response(JSON.stringify({ error: { message: '缺少必要的 x-target-url 請求頭' } }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }

  // 複製前端送來的 Headers
  const headers = new Headers()
  for (const [key, value] of req.headers.entries()) {
    // 排除瀏覽器自動產生的 host 與我們的自訂目標頭
    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'x-target-url') {
      headers.set(key, value)
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    })

    // 複製回應的 Headers，並注入 CORS 允許跨域
    const responseHeaders = new Headers(response.headers)
    // Edge fetch 已自動解壓縮 body，必須移除上游的編碼與長度標頭，
    // 否則瀏覽器會解碼失敗或將串流緩衝到結束才一次送出
    responseHeaders.delete('content-encoding')
    responseHeaders.delete('content-length')
    responseHeaders.delete('transfer-encoding')
    responseHeaders.set('cache-control', 'no-cache')
    for (const [key, value] of Object.entries(corsHeaders)) {
      responseHeaders.set(key, value)
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误'
    return new Response(JSON.stringify({ error: { message: `代理請求失敗: ${message}` } }), {
      status: 502,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
}
