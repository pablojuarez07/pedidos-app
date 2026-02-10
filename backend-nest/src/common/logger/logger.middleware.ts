import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;

      let statusText = '';

      if (status >= 500) statusText = 'SERVER ERROR';
      else if (status >= 400) statusText = 'CLIENT ERROR';
      else if (status >= 300) statusText = 'REDIRECT';
      else if (status >= 200) statusText = 'OK';

      console.log(
        `${req.method} ${req.originalUrl} → ${status} ${statusText} (${duration}ms)`
      );
    });

    next();
  }
}
