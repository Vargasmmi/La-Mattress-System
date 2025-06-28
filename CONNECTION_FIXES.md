# Backend-Frontend Connection Fixes

## Summary

Este documento detalla todas las mejoras implementadas para solucionar los problemas de conexión entre el backend y frontend de la aplicación LA Mattress.

## Problemas Identificados y Solucionados

### 1. **URLs Hardcodeadas**
- **Problema**: URLs del backend estaban hardcodeadas en múltiples archivos
- **Solución**: Creado sistema de configuración centralizada con variables de entorno

### 2. **Falta de Manejo de Errores Unificado**
- **Problema**: Cada archivo manejaba errores de forma diferente
- **Solución**: Implementado interceptor centralizado con retry logic

### 3. **Configuración de Proxy para Desarrollo**
- **Problema**: Vite no tenía configuración de proxy para desarrollo
- **Solución**: Agregado proxy configuration en `vite.config.ts`

### 4. **Duplicación de Código API**
- **Problema**: Funciones `apiRequest` duplicadas en múltiples archivos
- **Solución**: Creado cliente API unificado en `apiConfig.ts`

### 5. **Falta de Monitoreo de Conexión**
- **Problema**: No había forma de monitorear el estado de la conexión
- **Solución**: Implementados componentes de monitoreo en tiempo real

## Archivos Creados/Modificados

### Archivos Nuevos
- `src/services/apiConfig.ts` - Configuración centralizada de API
- `src/components/ConnectionStatus.tsx` - Indicador de estado de conexión
- `src/components/BackendMonitor.tsx` - Monitor completo del backend
- `src/pages/TestConnectionPage.tsx` - Página de prueba de conexión
- `scripts/test-backend-connection.js` - Script de prueba de conexión
- `.env` - Variables de entorno
- `.env.example` - Ejemplo de variables de entorno

### Archivos Modificados
- `vite.config.ts` - Agregado proxy y configuración de entorno
- `src/vite-env.d.ts` - Tipos para variables de entorno
- `src/services/api.ts` - Actualizado para usar configuración centralizada
- `src/authProvider.ts` - Migrado a usar apiRequest centralizado
- `src/dataProvider.ts` - Migrado a usar apiRequest centralizado
- `src/App.tsx` - Agregado indicador de conexión y nueva página
- `package.json` - Agregados scripts de prueba

## Características Implementadas

### 1. **Configuración Centralizada**
```typescript
// src/services/apiConfig.ts
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};
```

### 2. **Manejo de Errores Robusto**
- Reintentos automáticos para errores de red
- Timeout configurable
- Manejo específico de errores 401 (auto-logout)
- Logging detallado para debugging

### 3. **Monitoreo en Tiempo Real**
- Indicador de estado en el header
- Página dedicada para pruebas de conexión
- Historial de health checks
- Métricas de rendimiento

### 4. **Variables de Entorno**
```bash
# .env
VITE_API_URL=https://backend-mu-three-66.vercel.app/api
VITE_NODE_ENV=development
```

### 5. **Proxy para Desarrollo**
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: process.env.VITE_API_URL || 'https://backend-mu-three-66.vercel.app',
    changeOrigin: true,
    secure: true
  }
}
```

## Scripts de Prueba

### Prueba de Conexión Backend
```bash
npm run test:backend
# o
npm run health-check
```

### Desarrollo con Debug
```bash
npm run dev:debug
```

## Uso de los Nuevos Componentes

### ConnectionStatus
```tsx
// Indicador simple
<ConnectionStatus />

// Con detalles expandidos
<ConnectionStatus showDetails />

// Con callback de cambio de estado
<ConnectionStatus onStatusChange={(connected) => console.log(connected)} />
```

### BackendMonitor
```tsx
// Monitor completo con métricas y historial
<BackendMonitor />
```

## Beneficios Implementados

1. **Flexibilidad**: Fácil cambio de entorno (dev/staging/prod)
2. **Robustez**: Reintentos automáticos y manejo de errores
3. **Monitoreo**: Visibilidad en tiempo real del estado de conexión
4. **Debugging**: Herramientas mejoradas para diagnosticar problemas
5. **Mantenibilidad**: Código centralizado y reutilizable
6. **UX Mejorada**: Indicadores visuales del estado de conexión

## Configuración para Diferentes Entornos

### Desarrollo Local
```bash
VITE_API_URL=http://localhost:8000/api
```

### Staging
```bash
VITE_API_URL=https://staging-api.lamattress.com/api
```

### Producción
```bash
VITE_API_URL=https://backend-mu-three-66.vercel.app/api
```

## Resolución de Problemas Comunes

### 1. Error de CORS
- Verificar configuración de proxy en `vite.config.ts`
- Comprobar headers CORS en el backend

### 2. Timeout de Conexión
- Ajustar `VITE_API_TIMEOUT` en variables de entorno
- Verificar velocidad de conexión de red

### 3. Errores 401 Persistentes
- Verificar que el token se esté guardando correctamente
- Comprobar configuración de autenticación en el backend

### 4. Problemas de Proxy en Desarrollo
- Verificar que `VITE_API_URL` esté configurado
- Comprobar logs del proxy en la consola de Vite

## Monitoreo y Mantenimiento

1. **Revisar métricas diarias** en la página Test Connection
2. **Monitorear logs** de errores en la consola del navegador
3. **Ejecutar health checks** regularmente con `npm run health-check`
4. **Actualizar timeouts** según necesidades de performance

## Próximos Pasos Recomendados

1. Implementar caching de respuestas API
2. Agregar métricas de performance más detalladas
3. Implementar modo offline con service workers
4. Agregar alertas automáticas para fallos de conexión
5. Implementar balanceador de carga para múltiples backends

---

**Fecha de Implementación**: $(date)
**Estado**: ✅ Completado y Probado