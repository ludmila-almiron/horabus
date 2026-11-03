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
  } else if (accion === 'rechazar') {
    // Marcar como rechazado: queda en historial pero no se publica
    result = await supabase
      .from('avisos')
      .update({ aprobado: false, activo: false })
      .eq('id', id)
  } else if (accion === 'eliminar') {
    result = await supabase
      .from('avisos')
      .delete()
      .eq('id', id)
  } else if (accion === 'listar') {
    // Primero desactivar avisos cuyo caduca_at ya pasó
    await supabase
      .from('avisos')
      .update({ activo: false })
      .eq('activo', true)
      .not('caduca_at', 'is', null)
      .lt('caduca_at', new Date().toISOString())

    // Devolver pendientes (aprobado=false, activo=true) o publicados (aprobado=true, activo=true)
    result = await supabase
      .from('avisos')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
  } else if (accion === 'historial') {
    // Caducados en los últimos 7 días O rechazados en los últimos 7 días
    const ahora = new Date().toISOString()
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    // Caducados: activo=false, caduca_at en los últimos 7 días
    const { data: caducados } = await supabase
      .from('avisos')
      .select('*')
      .eq('activo', false)
      .eq('aprobado', true)
      .not('caduca_at', 'is', null)
      .lt('caduca_at', ahora)
      .gte('caduca_at', hace7dias)
    // Rechazados: aprobado=false, activo=false, creados en los últimos 7 días
    const { data: rechazados } = await supabase
      .from('avisos')
      .select('*')
      .eq('activo', false)
      .eq('aprobado', false)
      .gte('created_at', hace7dias)
    const todos = [...(caducados || []), ...(rechazados || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    result = { data: todos, error: null }
  } else if (accion === 'restaurar') {
    // Restaurar y extender caduca_at 12h desde ahora para que no caduque inmediatamente
    result = await supabase
      .from('avisos')
      .update({ aprobado: true, activo: true, caduca_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() })
      .eq('id', id)
  } else if (accion === 'crear') {
    result = await supabase
      .from('avisos')
      .insert({ ...campos, activo: true })
  } else if (accion === 'editar') {
    result = await supabase
      .from('avisos')
      .update(campos)
      .eq('id', id)
  } else if (accion === 'guardar_horarios') {
    // paradas: [{ id, hora }] donde hora es "HH:MM"
    const { paradas } = body
    if (!Array.isArray(paradas) || paradas.length === 0) {
      return new Response(JSON.stringify({ error: 'Sin paradas' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    const updates = paradas.map(p =>
      supabase.from('paradas').update({ hora: p.hora + ':00' }).eq('id', p.id)
    )
    const resultados = await Promise.all(updates)
    const errores = resultados.filter(r => r.error)
    if (errores.length) {
      return new Response(JSON.stringify({ error: `${errores.length} parada(s) no se pudieron actualizar` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    result = { data: null, error: null }
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