import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// This is a Supabase Edge Function that acts as a cron job to auto-expire sevas
// that have passed their scheduled end_time.
// To deploy: supabase functions deploy auto-expire-sevas
// Then schedule it via pg_cron in the database or Supabase dashboard to run every 10 mins.

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date().toISOString()

    // Find all sevas that are currently live but their end_time has passed
    const { data: expiredSevas, error: fetchError } = await supabaseClient
      .from('sevas')
      .select('id, title, end_time')
      .eq('is_live', true)
      .neq('status', 'finished')
      .lt('end_time', now)

    if (fetchError) throw fetchError

    if (!expiredSevas || expiredSevas.length === 0) {
      return new Response(
        JSON.stringify({ message: "No sevas to expire.", processed: 0 }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // Update their status to 'finished' and is_live to false
    const ids = expiredSevas.map(s => s.id)
    const { error: updateError } = await supabaseClient
      .from('sevas')
      .update({
        is_live: false,
        status: 'finished'
      })
      .in('id', ids)

    if (updateError) throw updateError

    // Log the action in the audit log
    const auditLogs = expiredSevas.map(s => ({
      action: 'AUTO_EXPIRE',
      table_name: 'sevas',
      record_id: s.id,
      user_id: null, // System action
      old_data: { is_live: true },
      new_data: { is_live: false, status: 'finished' },
      ip_address: 'cron'
    }))

    await supabaseClient.from('audit_log').insert(auditLogs)

    return new Response(
      JSON.stringify({
        message: `Successfully expired ${expiredSevas.length} sevas.`,
        processed: expiredSevas.length,
        expiredIds: ids
      }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
