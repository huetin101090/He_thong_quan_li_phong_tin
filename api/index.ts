import app from '../server.ts';

export default function handler(req: any, res: any) {
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/health')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return (app as any)(req, res);
}

