import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') ?? ''

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.json()
  const { password, accion, id, campos } = body

  // Verificar contraseña
  if (!password || password !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // Cliente con service role (permisos totales)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  let result

  if (accion === 'aprobar') {
    result = await supabase
      .from('avisos')
      .update({ aprobado: true, caduca_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() })
      .eq('id', id)
  } else if (accion === 'rechazar' || accion === 'eliminar') {
    result = await supabase
      .from('avisos')
      .delete()
      .eq('id', id)
  } else if (accion === 'listar') {
    result = await supabase
      .from('avisos')
      .select('*')
      .order('created_at', { ascending: false })
  } else if (accion === 'crear') {
    result = await supabase
      .from('avisos')
      .insert({ ...campos, activo: true })
  } else if (accion === 'editar') {
    result = await supabase
      .from('avisos')
      .update(campos)
      .eq('id', id)
  } else {
    return new Response(JSON.stringify({ error: 'Acción no válida' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  return new Response(JSON.stringify({ ok: true, data: result.data }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})