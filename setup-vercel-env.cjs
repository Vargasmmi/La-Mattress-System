const { execSync } = require('child_process');

console.log('🔧 Configurando variables de entorno en Vercel...\n');

const envVars = [
  {
    key: 'VITE_API_URL',
    value: 'https://backend-mu-three-66.vercel.app/api',
    description: 'URL del API Backend'
  }
];

// Función para configurar una variable
function setEnvVar(key, value) {
  try {
    // Intentar agregar la variable para producción
    const command = `echo "${value}" | vercel env add ${key} production 2>/dev/null || true`;
    execSync(command, { shell: true, stdio: 'pipe' });
    console.log(`✅ ${key} configurada`);
    return true;
  } catch (error) {
    console.log(`⚠️  ${key} ya existe o no se pudo configurar`);
    return false;
  }
}

// Configurar todas las variables
console.log('📋 Configurando variables de entorno:\n');
envVars.forEach(({ key, value, description }) => {
  console.log(`Configurando ${key}: ${description}`);
  setEnvVar(key, value);
});

console.log('\n✅ Configuración completada');
console.log('\n🔍 Para verificar las variables configuradas:');
console.log('   1. Ve a https://vercel.com/dashboard');
console.log('   2. Selecciona tu proyecto');
console.log('   3. Ve a Settings → Environment Variables');
console.log('\n🚀 Para aplicar los cambios, el próximo deployment usará estas variables automáticamente.');

// Intentar obtener la URL del proyecto
try {
  console.log('\n📌 Información del proyecto:');
  const projectInfo = execSync('vercel inspect 2>&1 | grep "Production:" || echo "URL no disponible"', { encoding: 'utf8' });
  console.log(projectInfo);
} catch (error) {
  console.log('   Visita https://vercel.com/dashboard para ver la URL de tu proyecto');
}