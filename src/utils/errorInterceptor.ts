import { logger } from './logger';

interface ErrorDetails {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: Date;
  userAgent: string;
  url: string;
  userId?: string;
}

class ErrorInterceptor {
  private errorQueue: ErrorDetails[] = [];
  private maxErrors = 100;
  private isInitialized = false;

  init(): void {
    if (this.isInitialized) return;
    
    this.setupGlobalErrorHandler();
    this.setupUnhandledRejectionHandler();
    this.setupResourceErrorHandler();
    this.setupConsoleOverrides();
    
    this.isInitialized = true;
    logger.info('Error interceptor initialized', undefined, 'ErrorInterceptor');
  }

  private setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      const errorDetails: ErrorDetails = {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      this.captureError('JavaScript Error', errorDetails);
    });
  }

  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const errorDetails: ErrorDetails = {
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      this.captureError('Unhandled Promise Rejection', errorDetails);
      
      // Prevent default browser behavior
      event.preventDefault();
    });
  }

  private setupResourceErrorHandler(): void {
    window.addEventListener('error', (event) => {
      const target = event.target;
      
      if (target && target instanceof Element) {
        const errorDetails: ErrorDetails = {
          message: `Resource failed to load: ${target.tagName}`,
          filename: (target as any).src || (target as any).href,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };

        this.captureError('Resource Load Error', errorDetails);
      }
    }, true);
  }

  private setupConsoleOverrides(): void {
    // Solo interceptar console.error para capturar errores importantes
    const originalError = console.error;
    
    console.error = (...args: any[]) => {
      // Llamar al console.error original para mantener funcionalidad
      originalError.apply(console, args);
      
      // Capturar el error para nuestro sistema
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');
      
      const errorDetails: ErrorDetails = {
        message: `Console Error: ${message}`,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      this.captureError('Console Error', errorDetails);
    };
  }

  private captureError(type: string, details: ErrorDetails): void {
    // Añadir a la cola de errores
    this.errorQueue.push(details);
    
    // Mantener solo los últimos N errores
    if (this.errorQueue.length > this.maxErrors) {
      this.errorQueue.shift();
    }

    // Log usando nuestro sistema
    logger.error(`${type}: ${details.message}`, {
      stack: details.stack,
      filename: details.filename,
      lineno: details.lineno,
      colno: details.colno,
      url: details.url
    }, 'ErrorInterceptor');

    // En producción, podríamos enviar errores a un servicio de monitoreo
    if (this.isProduction()) {
      this.reportErrorToService(type, details);
    }
  }

  private isProduction(): boolean {
    return location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
  }

  private async reportErrorToService(type: string, details: ErrorDetails): Promise<void> {
    try {
      // Placeholder para servicio de reporte de errores
      // Se podría integrar con Sentry, LogRocket, etc.
      
      const payload = {
        type,
        details,
        context: {
          timestamp: details.timestamp.toISOString(),
          sessionId: this.getSessionId(),
          buildInfo: this.getBuildInfo()
        }
      };

      // Solo reportar errores críticos en producción
      if (this.shouldReportError(type, details)) {
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload)
        // });
        
        logger.debug('Error reported to service', payload, 'ErrorInterceptor');
      }
    } catch (reportError) {
      logger.error('Failed to report error to service', reportError, 'ErrorInterceptor');
    }
  }

  private shouldReportError(type: string, details: ErrorDetails): boolean {
    // Filtrar errores comunes que no son críticos
    const ignoredMessages = [
      'Script error',
      'Network request failed',
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded'
    ];

    return !ignoredMessages.some(ignored => 
      details.message.toLowerCase().includes(ignored.toLowerCase())
    );
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error-session-id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('error-session-id', sessionId);
    }
    return sessionId;
  }

  private getBuildInfo(): any {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${screen.width}x${screen.height}`
    };
  }

  // Métodos públicos para consultar errores
  getErrorHistory(): ErrorDetails[] {
    return [...this.errorQueue];
  }

  getRecentErrors(minutes: number = 5): ErrorDetails[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorQueue.filter(error => error.timestamp > cutoff);
  }

  clearErrorHistory(): void {
    this.errorQueue = [];
    logger.info('Error history cleared', undefined, 'ErrorInterceptor');
  }

  // Captura manual de errores
  captureException(error: Error, context?: string): void {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.captureError(`Manual Capture${context ? ` (${context})` : ''}`, errorDetails);
  }
}

// Instancia singleton
export const errorInterceptor = new ErrorInterceptor();

// Hook para React error boundaries
export const captureReactError = (error: Error, errorInfo: any) => {
  const errorDetails: ErrorDetails = {
    message: `React Error: ${error.message}`,
    stack: error.stack,
    timestamp: new Date(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  logger.error('React Error Boundary', { error, errorInfo }, 'React');
  errorInterceptor.captureException(error, 'React Error Boundary');
};