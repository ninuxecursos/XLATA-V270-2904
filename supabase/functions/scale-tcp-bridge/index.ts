// Edge Function: scale-tcp-bridge
// Conecta a balanças expostas via TCP/IP, opcionalmente envia byte de requisição,
// lê resposta dentro do timeout, parseia peso pelo regex e devolve o resultado.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface Body {
  host: string;
  port: number;
  request_byte?: number | null;
  timeout_ms?: number;
  frame_regex: string;
  weight_divisor?: number;
}

function isValidHost(host: string): boolean {
  if (!host || host.length > 253) return false;
  // Aceita IPs e hostnames; bloqueia metadata service e loopbacks comuns
  const lower = host.toLowerCase();
  if (lower === 'localhost' || lower.startsWith('127.') || lower === '169.254.169.254') return false;
  return /^[a-z0-9.\-:]+$/i.test(host);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: Body = await req.json();
    if (!body?.host || !body?.port || !body?.frame_regex) {
      return new Response(JSON.stringify({ error: 'host, port e frame_regex são obrigatórios.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!isValidHost(body.host)) {
      return new Response(JSON.stringify({ error: 'Host inválido ou bloqueado.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const timeoutMs = Math.min(Math.max(body.timeout_ms ?? 1500, 200), 5000);
    const divisor = body.weight_divisor || 1;

    let conn: Deno.TcpConn | null = null;
    try {
      conn = await Promise.race([
        Deno.connect({ hostname: body.host, port: body.port, transport: 'tcp' }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout-connect')), timeoutMs)),
      ]) as Deno.TcpConn;

      if (body.request_byte != null) {
        await conn.write(new Uint8Array([body.request_byte]));
      }

      const buffer = new Uint8Array(1024);
      const readPromise = (async () => {
        let acc = '';
        const decoder = new TextDecoder('latin1');
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
          const n = await Promise.race([
            conn!.read(buffer),
            new Promise<null>((res) => setTimeout(() => res(null), Math.max(50, deadline - Date.now()))),
          ]);
          if (n == null) break;
          if (typeof n === 'number' && n > 0) {
            acc += decoder.decode(buffer.subarray(0, n));
            const re = new RegExp(body.frame_regex);
            const m = acc.match(re);
            if (m) return { raw: acc, match: m };
          } else if (n === null) break;
        }
        return { raw: acc, match: null as RegExpMatchArray | null };
      })();

      const { raw, match } = await readPromise;
      try { conn.close(); } catch {}

      if (!match) {
        return new Response(JSON.stringify({ success: false, raw, error: 'Nenhum frame válido recebido.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const numStr = match[1] ?? match[2] ?? match[0];
      const parsed = Number(numStr) / divisor;
      return new Response(JSON.stringify({ success: true, raw, parsed_weight: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      try { conn?.close(); } catch {}
      return new Response(JSON.stringify({ success: false, error: e?.message || String(e) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Erro inesperado' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
