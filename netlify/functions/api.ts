import serverless from 'serverless-http';
import app from '../../server.ts';

// Initialize serverless-http with the shared Express application
const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  // 1. Prevent AWS Lambda / Netlify execution from waiting for background timers
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  // 2. Normalize requested path from Netlify redirects
  // In netlify.toml:
  //   from = "/api/*" -> to = "/.netlify/functions/api/:splat"
  //   from = "/healthz" -> to = "/.netlify/functions/api/healthz"
  if (event.path) {
    if (event.path.startsWith('/.netlify/functions/api')) {
      let stripped = event.path.replace(/^\/\.netlify\/functions\/api/, '');
      if (stripped === '/healthz' || stripped === 'healthz') {
        event.path = '/healthz';
      } else {
        if (!stripped.startsWith('/')) {
          stripped = '/' + stripped;
        }
        if (!stripped.startsWith('/api')) {
          stripped = '/api' + stripped;
        }
        event.path = stripped;
      }
    } else if (!event.path.startsWith('/api') && !event.path.startsWith('/healthz')) {
      event.path = `/api${event.path.startsWith('/') ? '' : '/'}${event.path}`;
    }
  }

  // 3. Normalize rawUrl if available (preserves exact query string and path)
  if (event.rawUrl) {
    try {
      const parsedUrl = new URL(event.rawUrl);
      if (parsedUrl.pathname.startsWith('/api/') || parsedUrl.pathname === '/healthz') {
        event.path = parsedUrl.pathname;
      }
    } catch {
      // Keep event.path as already normalized
    }
  }

  // 4. Delegate request processing to Express app
  return await serverlessHandler(event, context);
};

export default handler;
