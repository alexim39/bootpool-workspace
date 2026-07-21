import { Injectable, ErrorHandler } from '@angular/core';
import * as Sentry from '@sentry/angular';

@Injectable({ providedIn: 'root' })
export class ErrorMonitorService {
  log(err: any, context?: string) {
    console.error(`[BetPool Error]${context ? ' [' + context + ']' : ''}`, err);
    Sentry.captureException(err, { tags: { context } });
  }
}

export class BetPoolErrorHandler implements ErrorHandler {
  handleError(err: any) {
    console.error('[BetPool Global Error]', err);
    Sentry.captureException(err.originalError || err);
  }
}
