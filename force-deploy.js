const { execSync } = require('child_process');

console.log('🚀 Iniciando deploy a Vercel...');

try {
  // Primero construir el proyecto
  console.log('📦 Construyendo el proyecto...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completado');
  
  // Intentar deploy
  console.log('🔄 Desplegando a Vercel...');
  
  // Si ya está conectado a GitHub y Vercel, esto debería funcionar
  const deployCommand = `vercel --prod --force --skip-domain`;
  
  try {
    execSync(deployCommand, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        VERCEL_ORG_ID: 'team_YourOrgId',
        VERCEL_PROJECT_ID: 'prj_bznGj5hZqF4vAGUy3AlwFWP6JE08',
        CI: '1' // Esto evita prompts interactivos
      }
    });
    console.log('✅ Deploy completado exitosamente!');
  } catch (error) {
    console.log('❌ Error en deploy, pero el proyecto ya debería estar configurado en Vercel');
    console.log('Por favor, ve a https://vercel.com/dashboard y verifica el estado del deploy');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}