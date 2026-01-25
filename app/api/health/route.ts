import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'production',
    services: {
      supabase: 'checking',
    }
  };

  // Verificar conexão com Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      health.status = 'unhealthy';
      health.services.supabase = 'misconfigured';
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Faz uma query simples para verificar conectividade
      const { error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        health.status = 'degraded';
        health.services.supabase = 'unhealthy';
      } else {
        health.services.supabase = 'healthy';
      }
    }
  } catch (error) {
    health.status = 'unhealthy';
    health.services.supabase = 'error';
  }

  const responseTime = Date.now() - startTime;
  
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  return NextResponse.json({
    ...health,
    responseTime: `${responseTime}ms`
  }, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}
