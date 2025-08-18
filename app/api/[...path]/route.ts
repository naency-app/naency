// app/api/[...path]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { headers as nextHeaders } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080';

function buildTargetUrl(path: string[], request: Request) {
  const base = `${GO_API_URL}/api/${path.join('/')}`;
  const qs = new URL(request.url).search || '';
  return new URL(`${base}${qs}`);
}

function filterRequestHeaders(h: Headers) {
  const out = new Headers(h);
  // hop-by-hop
  [
    'host',
    'connection',
    'keep-alive',
    'proxy-connection',
    'transfer-encoding',
    'upgrade',
    'te',
    'trailers',
    'proxy-authenticate',
    'proxy-authorization',
  ].forEach((k) => {
    out.delete(k);
  });
  return out;
}

async function fetchWithTokenRetry(url: URL, init: RequestInit): Promise<Response> {
  // 1ª tentativa
  let resp = await fetch(url, init);
  if (resp.status !== 401) return resp;

  // 2ª tentativa: pede um token fresco e reenvia
  try {
    const { token: fresh } = await auth.api.getToken({ headers: await nextHeaders() });
    if (!fresh) return resp;

    const headers2 = new Headers(init.headers as Headers);
    headers2.set('Authorization', `Bearer ${fresh}`);

    resp = await fetch(url, { ...init, headers: headers2, cache: 'no-store' });
    return resp;
  } catch {
    return resp;
  }
}

async function proxy(request: Request, context: { params: { path: string[] } }) {
  const url = buildTargetUrl(context.params.path, request);

  // tenta obter token; se não tiver sessão, 401
  let token: string | undefined;
  try {
    const { token: t } = await auth.api.getToken({ headers: await nextHeaders() });
    token = t;
  } catch {
    token = undefined;
  }
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const reqHeaders = filterRequestHeaders(request.headers);
  reqHeaders.set('Authorization', `Bearer ${token}`);

  // Só encaminhe body quando fizer sentido
  const method = request.method.toUpperCase();
  const hasBody = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const init: RequestInit = {
    method,
    headers: reqHeaders,
    body: hasBody ? request.body : undefined,
    cache: 'no-store',
  };

  try {
    const resp = await fetchWithTokenRetry(url, init);

    const respHeaders = new Headers(resp.headers);
    // remova headers que bagunçam o streaming/compressão
    ['content-encoding', 'content-length', 'transfer-encoding', 'connection'].forEach((h) => {
      respHeaders.delete(h);
    });

    return new NextResponse(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 502 });
  }
}

// Preflight opcional (só se precisar responder no edge do Next)
export const OPTIONS = async () =>
  new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // ajuste quando tiver domínio
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '600',
    },
  });

export async function GET(request: Request, context: any) {
  return proxy(request, context);
}
export async function POST(request: Request, context: any) {
  return proxy(request, context);
}
export async function PUT(request: Request, context: any) {
  return proxy(request, context);
}
export async function DELETE(request: Request, context: any) {
  return proxy(request, context);
}
export async function PATCH(request: Request, context: any) {
  return proxy(request, context);
}
