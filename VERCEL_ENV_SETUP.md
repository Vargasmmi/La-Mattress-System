# Configuración de Variables de Entorno en Vercel

## ✅ Estado Actual

He intentado configurar las variables de entorno automáticamente. La variable principal `VITE_API_URL` debería estar configurada.

## 🔍 Verificar Variables de Entorno

### Opción 1: Dashboard de Vercel (Recomendado)

1. **Ve a tu proyecto en Vercel**:
   - https://vercel.com/dashboard
   - Busca "la-mattress-system" o "shopify-stripe-refine"

2. **Ve a Settings → Environment Variables**

3. **Verifica que exista**:
   - **Variable Name**: `VITE_API_URL`
   - **Value**: `https://backend-mu-three-66.vercel.app/api`
   - **Environment**: Production ✓

### Opción 2: Vercel CLI

```bash
vercel env ls
```

## 🔧 Si NO están configuradas

### Método 1: Dashboard Web (Más fácil)

1. En tu proyecto de Vercel, ve a **Settings → Environment Variables**
2. Click en **Add New**
3. Agrega:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://backend-mu-three-66.vercel.app/api`
   - **Environment**: Selecciona solo "Production"
4. Click **Save**

### Método 2: CLI

```bash
# Agregar variable para producción
vercel env add VITE_API_URL production
# Cuando pregunte el valor, pega: https://backend-mu-three-66.vercel.app/api
```

## 🚀 Aplicar Cambios

Después de configurar las variables:

### Opción 1: Re-deploy automático
Si tu proyecto está conectado a GitHub, haz un pequeño cambio y push:

```bash
echo "# Deploy trigger" >> README.md
git add README.md
git commit -m "Trigger deployment with env vars"
git push
```

### Opción 2: Re-deploy manual
En el dashboard de Vercel:
1. Ve a tu proyecto
2. En la pestaña "Deployments"
3. Encuentra el deployment más reciente
4. Click en los 3 puntos (...) → "Redeploy"

### Opción 3: CLI
```bash
vercel --prod
```

## ✅ Verificar que funciona

1. Visita tu aplicación
2. Abre las herramientas de desarrollador (F12)
3. Ve a Network
4. Recarga la página
5. Deberías ver peticiones a `https://backend-mu-three-66.vercel.app/api`

## 📝 Variables Opcionales

Estas se pueden configurar más tarde desde la aplicación:

- `VITE_SHOPIFY_SHOP_NAME` - Tu dominio de Shopify
- `VITE_SHOPIFY_API_KEY` - API key de tu app privada
- `VITE_SHOPIFY_PASSWORD` - Password de tu app privada
- `VITE_STRIPE_PUBLISHABLE_KEY` - Clave pública de Stripe

## 🆘 Troubleshooting

Si la aplicación no conecta con el API:

1. **Verifica en la consola del navegador**:
   - Busca errores de CORS o 404
   - Verifica que las URLs sean correctas

2. **Verifica el build log en Vercel**:
   - Debería mostrar "VITE_API_URL" durante el build

3. **Prueba el API directamente**:
   - Visita: https://backend-mu-three-66.vercel.app/api/health
   - Deberías ver: `{"status":"ok","timestamp":"..."}`

## 🎯 Resultado Esperado

Cuando todo esté configurado correctamente:
- La aplicación cargará sin errores
- Podrás iniciar sesión
- Las peticiones al API funcionarán correctamente
- No verás errores de conexión en la consola