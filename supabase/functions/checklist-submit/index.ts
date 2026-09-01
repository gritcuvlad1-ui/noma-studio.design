import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

/* Închide definitiv un checklist și trimite mailul de notificare.
   De ce e edge function și nu o funcție RPC expusă lui `anon` (ca
   `checklist_save`): odată trimis, checklistul devine needitabil — dacă
   „submit" ar fi doar un UPDATE oarecare, orice cerere HTTP repetată cu
   același token l-ar putea retrimite/rescrie. Aici rulăm cu service_role
   (bypass RLS), verificăm starea curentă ȘI marcăm `submitted` ATOMIC
   (`update ... where status <> 'submitted'`), deci a doua apăsare pe
   „Trimite" (dublu-click, retry de rețea) nu retrimite mailul.

   MESAJUL rămâne DELIBERAT o notificare scurtă (nume, proiect, contact,
   link direct în admin), NU tot conținutul checklistului formatat. Motivul
   e tehnic, nu de conținut: catalogul complet de etichete (~200 opțiuni,
   ro+ru) trăiește în `src/data/checklist/` — cod React, cu propriul grafic
   de importuri. A-l importa aici (peste granița `supabase/functions/`) ar
   funcționa probabil la deploy (Supabase bundle-uiește pe Deno orice import
   relativ atins), dar netestabil din acest mediu și fragil la orice
   restructurare a `src/`. Varianta robustă, testată: mailul e un „ping" —
   patronul dă click pe link și vede sumarul complet, deja formatat frumos,
   direct în /admin/dashboard (unde `buildSummary` din `src/data/checklist`
   rulează normal, ca orice cod React). */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Lang = "ro" | "ru";

const LABELS: Record<Lang, { subject: string; intro: string; client: string; project: string; phone: string; email: string; link: string }> = {
  ro: {
    subject: "Checklist completat",
    intro: "Checklist de proiect completat de",
    client: "Client",
    project: "Proiect",
    phone: "Telefon",
    email: "Email",
    link: "Vezi răspunsurile complete în admin",
  },
  ru: {
    subject: "Чек-лист заполнен",
    intro: "Чек-лист проекта заполнен клиентом",
    client: "Клиент",
    project: "Проект",
    phone: "Телефон",
    email: "Email",
    link: "Смотреть полные ответы в админке",
  },
};

interface ChecklistRow {
  id: string;
  client_name: string;
  project_name: string;
  client_phone: string;
  client_email: string;
  lang: Lang;
}

async function sendNotificationEmail(row: ChecklistRow): Promise<void> {
  // Zoho Mail, NU Gmail — `service: "gmail"` (shortcut-ul nodemailer de mai
  // jos, ȘTERS) codifica direct host-ul SMTP al Gmail; Zoho are alt
  // host/port, de-aia config-ul explicit. Secretul se numește acum
  // SMTP_APP_PASSWORD (nu GMAIL_API_KEY — numele vechi rămăsese de la
  // planul inițial cu Gmail, abandonat înainte să fie configurat vreun
  // secret în Supabase, deci redenumirea nu strică nimic existent).
  const appPassword = Deno.env.get("SMTP_APP_PASSWORD");
  const senderEmail = Deno.env.get("SENDER_EMAIL") || "checklist@noma.md";
  const recipientEmail = Deno.env.get("RECIPIENT_EMAIL") || "checklist@noma.md";
  const siteUrl = Deno.env.get("SITE_URL") || "https://noma.md";

  if (!appPassword) throw new Error("SMTP_APP_PASSWORD not configured");

  const t = LABELS[row.lang] ?? LABELS.ro;

  const emailBody = `
${t.intro}: ${row.client_name}

${t.client}: ${row.client_name}
${t.project}: ${row.project_name || "-"}
${t.phone}: ${row.client_phone || "-"}
${t.email}: ${row.client_email || "-"}

${t.link}:
${siteUrl}/admin/dashboard
`;

  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: { user: senderEmail, pass: appPassword },
  });

  await transporter.sendMail({
    from: senderEmail,
    to: recipientEmail,
    subject: `${t.subject} — ${row.client_name}`,
    text: emailBody,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update atomic: doar dacă NU e deja 'submitted'. Dacă `update` întoarce
    // 0 rânduri, fie tokenul nu există, fie a fost deja trimis — în ambele
    // cazuri nu (re)trimitem mail.
    const { data, error } = await supabase
      .from("checklists")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("token", token)
      .neq("status", "submitted")
      .select("id, client_name, project_name, client_phone, client_email, lang")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Idempotent: dacă era deja trimis, tot răspundem cu succes — clientul
      // nu trebuie să vadă o eroare la un dublu-click pe „Trimite".
      return new Response(JSON.stringify({ ok: true, already: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      await sendNotificationEmail(data as ChecklistRow);
    } catch (emailError) {
      console.error("checklist-submit email error:", emailError);
      // Checklistul rămâne marcat 'submitted' — nu blocăm clientul dacă
      // emailul eșuează, datele sunt oricum salvate și vizibile în admin.
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("checklist-submit error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
