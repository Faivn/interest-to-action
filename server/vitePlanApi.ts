import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { createPlanHandler, type PlanEnv } from './planHandler';

/**
 * Serves /api/plan from the Vite dev and preview servers using the same handler as Vercel.
 * The key is read from .env.local on the server side only; it is never exposed to the browser
 * (only VITE_-prefixed variables reach client code).
 */
export function planApiPlugin(env: PlanEnv): Plugin {
  const handle = createPlanHandler(env);

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/plan')) return next();
    void toWebRequest(req)
      .then(handle)
      .then((response) => sendWebResponse(response, res))
      .catch(() => {
        res.statusCode = 500;
        res.end();
      });
  };

  return {
    name: 'interest-to-action-plan-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const controller = new AbortController();
  req.on('close', () => {
    if (!req.complete) controller.abort();
  });
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
  }
  return new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
    signal: controller.signal,
  });
}

async function sendWebResponse(response: Response, res: ServerResponse) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}
