import app from '../server.ts';

export default function handler(req: any, res: any) {
  // 1. Phục vụ môi trường Vercel Serverless: Đánh dấu body đã parse nếu Vercel đã chuyển thành object
  if (req.body && typeof req.body === 'object') {
    (req as any)._body = true;
  }

  // 2. Chuẩn hóa đường dẫn URL từ các headers do Vercel Edge/Serverless chuyển tiếp
  let rawUrl: string = req.url || '/';
  if (req.headers) {
    const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'] || req.headers['x-matched-path'];
    if (typeof forwardedUri === 'string' && forwardedUri.startsWith('/api/')) {
      rawUrl = forwardedUri;
    }
  }

  // Tách query string nếu có
  const [pathname, search] = rawUrl.split('?');
  const searchPart = search ? `?${search}` : '';

  let normalizedPath = pathname;
  if (!normalizedPath.startsWith('/api') && !normalizedPath.startsWith('/health')) {
    normalizedPath = `/api${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
  }

  req.url = `${normalizedPath}${searchPart}`;

  // 3. Chuyển quyền xử lý cho ứng dụng Express
  return (app as any)(req, res);
}

