const BOT_REGEX = /(bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|pinterest|applebot|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|bytespider)/i;
const PUBLIC_FILE_REGEX = /\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|json|woff2?|ttf|eot|mp4|webm|pdf)$/i;

function passThrough() {
  return new Response(null, {
    headers: {
      'x-middleware-next': '1',
    },
  });
}

function shouldBypass(pathname: string) {
  return pathname.startsWith('/assets/')
    || pathname.startsWith('/icons/')
    || pathname.startsWith('/lovable-uploads/')
    || pathname.startsWith('/.well-known/')
    || pathname.startsWith('/api/')
    || pathname.startsWith('/sitemap')
    || pathname === '/favicon.ico'
    || pathname === '/site.webmanifest'
    || pathname === '/manifest.webmanifest'
    || pathname === '/registerSW.js'
    || pathname === '/sw.js'
    || pathname === '/robots.txt'
    || PUBLIC_FILE_REGEX.test(pathname);
}

function buildFallbackHtml(requestUrl: URL) {
  const canonical = `https://xlata.site${requestUrl.pathname}${requestUrl.search}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XLata.site | Sistema para Ferro Velho e Reciclagem</title>
  <meta name="description" content="Sistema para ferro velho, sucata e depósito de reciclagem com controle de estoque, compras, vendas e financeiro.">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
</head>
<body>
  <main>
    <h1>XLata.site — Sistema para Ferro Velho e Depósito de Reciclagem</h1>
    <p>Controle compras, vendas, estoque e financeiro do seu ferro-velho com o XLata.site.</p>
    <p><a href="https://xlata.site/planos">Ver planos</a> · <a href="https://xlata.site/blog">Ir para o blog</a></p>
  </main>
</body>
</html>`;
}

export const config = {
  matcher: '/:path*',
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  if (shouldBypass(url.pathname) || !BOT_REGEX.test(userAgent)) {
    return passThrough();
  }

  const prerenderUrl = new URL('https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/prerender');
  prerenderUrl.searchParams.set('path', `${url.pathname}${url.search}`);

  try {
    const prerenderResponse = await fetch(prerenderUrl.toString(), {
      headers: {
        'user-agent': userAgent,
        'x-original-user-agent': userAgent,
        'x-forwarded-host': request.headers.get('host') || url.host,
      },
    });

    const html = await prerenderResponse.text();
    const isValidHtml = prerenderResponse.ok && html.includes('<html') && html.includes('<h1');

    if (!isValidHtml) {
      return new Response(buildFallbackHtml(url), {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
          'vary': 'User-Agent, Accept-Encoding',
          'x-prerender-source': 'middleware-fallback',
        },
      });
    }

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
        'vary': 'User-Agent, Accept-Encoding',
        'x-prerender-source': 'middleware',
      },
    });
  } catch (_error) {
    return new Response(buildFallbackHtml(url), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        'vary': 'User-Agent, Accept-Encoding',
        'x-prerender-source': 'middleware-error-fallback',
      },
    });
  }
}