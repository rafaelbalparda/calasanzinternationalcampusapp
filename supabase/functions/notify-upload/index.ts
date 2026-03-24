import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, surnames")
      .eq("user_id", user.id)
      .single();

    const body = await req.json();
    const studentName = profile ? `${profile.name} ${profile.surnames}` : user.email;

    let subject = "Erasmus+ Tracker - Nueva actividad";
    let message = "";

    if (body.type === "document") {
      subject = `📄 Documento subido - ${studentName}`;
      message = `El alumno/a ${studentName} ha subido el documento: ${body.documentType}\nArchivo: ${body.fileName}`;
    } else if (body.type === "weekly_report") {
      subject = `📅 Reporte semanal - ${studentName}`;
      message = `El alumno/a ${studentName} ha entregado el reporte de la semana ${body.week}${body.fileName ? `\nArchivo: ${body.fileName}` : ""}`;
    } else if (body.type === "diary") {
      subject = `📝 Entrada de memoria - ${studentName}`;
      message = `El alumno/a ${studentName} ha añadido una entrada a la memoria: ${body.title}${body.fileName ? `\nArchivo adjunto: ${body.fileName}` : ""}`;
    }

    // Send email notification using Supabase's built-in email
    // For now, log the notification. Email sending will be configured with a proper SMTP service.
    console.log(`NOTIFICATION TO: international@calsasanz.eus`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`MESSAGE: ${message}`);

    return new Response(
      JSON.stringify({ success: true, subject, message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-upload:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
