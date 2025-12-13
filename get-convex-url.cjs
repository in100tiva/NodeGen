#!/usr/bin/env node

// Script para obter a URL correta do Convex
// Execute: node get-convex-url.cjs

const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env.local');
  
  console.log('\n📋 Obtendo URL do Convex...\n');
  
  // Tenta ler do .env.local
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_CONVEX_URL=(.+)/);
    
    if (match) {
      const url = match[1].trim();
      console.log('✅ URL encontrada no .env.local:');
      console.log(`   ${url}\n`);
      
      if (url.endsWith('.convex.site')) {
        console.log('⚠️  ATENÇÃO: Esta URL termina com .convex.site');
        console.log('   Você precisa usar a URL .convex.cloud no Vercel!\n');
        
        const cloudUrl = url.replace('.convex.site', '.convex.cloud');
        console.log('✅ Use esta URL no Vercel:');
        console.log(`   ${cloudUrl}\n`);
      } else if (url.endsWith('.convex.cloud')) {
        console.log('✅ Esta é a URL correta para usar no Vercel!\n');
      }
      
      process.exit(0);
    }
  }
  
  console.log('❌ Não foi possível encontrar VITE_CONVEX_URL no .env.local\n');
  console.log('📍 Baseado no erro que você recebeu, use esta URL:\n');
  console.log('   https://wry-avocet-85.convex.cloud\n');
  console.log('   (Substitua "wry-avocet-85" pelo nome do seu deployment)\n');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
