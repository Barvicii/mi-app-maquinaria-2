// Rate Limiter simple en memoria
class RateLimiter {
  constructor() {
    this.clients = new Map();
    this.windowMs = 15 * 60 * 1000; // 15 minutos
    this.maxAttempts = 100; // máximo 100 requests por ventana
  }

  // Rate limiter para login (más estricto)
  loginLimiter = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxAttempts: 5, // 5 intentos de login por IP
  };

  // Rate limiter para APIs generales
  apiLimiter = {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxAttempts: 60, // 60 requests por minuto
  };

  isRateLimited(identifier, limiterConfig = null) {
    const config = limiterConfig || {
      windowMs: this.windowMs,
      maxAttempts: this.maxAttempts
    };

    const now = Date.now();
    const clientData = this.clients.get(identifier) || { count: 0, resetTime: now + config.windowMs };

    // Si ha pasado la ventana de tiempo, resetear
    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + config.windowMs;
    }

    // Incrementar contador
    clientData.count++;
    this.clients.set(identifier, clientData);

    // Limpiar entradas antiguas periódicamente
    if (this.clients.size > 1000) {
      this.cleanup();
    }

    return {
      isLimited: clientData.count > config.maxAttempts,
      remaining: Math.max(0, config.maxAttempts - clientData.count),
      resetTime: clientData.resetTime
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.clients.entries()) {
      if (now > value.resetTime) {
        this.clients.delete(key);
      }
    }
  }

  getClientIdentifier(request) {
    // Usar IP del cliente
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    return ip;
  }
}

// Instancia global
const rateLimiter = new RateLimiter();

export { rateLimiter };

// Middleware para aplicar rate limiting
export function withRateLimit(limiterConfig = null) {
  return function(handler) {
    return async function(request, ...args) {
      const identifier = rateLimiter.getClientIdentifier(request);
      const result = rateLimiter.isRateLimited(identifier, limiterConfig);

      if (result.isLimited) {
        return new Response(
          JSON.stringify({
            error: 'Too many requests',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': limiterConfig?.maxAttempts?.toString() || '100',
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
            }
          }
        );
      }

      // Agregar headers de rate limit a la respuesta
      const response = await handler(request, ...args);
      
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', limiterConfig?.maxAttempts?.toString() || '100');
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      }

      return response;
    };
  };
}
