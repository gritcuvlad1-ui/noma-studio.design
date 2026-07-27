import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

async function sendEmailViaGmail(
  formData: ContactFormData,
  attachmentCount: number
): Promise<void> {
  const appPassword = Deno.env.get("GMAIL_API_KEY");
  const senderEmail = Deno.env.get("SENDER_EMAIL") || "gritcuvlad1@gmail.com";
  const recipientEmail = Deno.env.get("RECIPIENT_EMAIL") || "gritcuvlad1@gmail.com";

  if (!appPassword) {
    throw new Error("GMAIL_API_KEY not configured");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: senderEmail,
      pass: appPassword,
    },
  });

  const emailBody = `
Mesaj nou de la NOMA Contact Form

Nume: ${formData.name}
Email: ${formData.email}
Telefon: ${formData.phone}

Mesaj:
${formData.message}

Fișiere atașate: ${attachmentCount} imagine(i)

---
Acest email a fost trimis de la formularul de contact de pe noma.md
`;

  await transporter.sendMail({
    from: senderEmail,
    to: recipientEmail,
    subject: `Nou Contact Form Submission - ${formData.name}`,
    text: emailBody,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();

    const name = formData.get("given-name")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const phone = formData.get("phone")?.toString() || "";
    const message = formData.get("message")?.toString() || "";

    if (!name || !email || !phone || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inspirationPhotos = formData.getAll("inspiration_photos");
    const attachmentCount = inspirationPhotos.length;

    const contactData: ContactFormData = { name, email, phone, message };

    try {
      await sendEmailViaGmail(contactData, attachmentCount);
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mesajul a fost trimis cu succes",
        data: { name, email, attachments: attachmentCount },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Form submission error:", error);
    return new Response(
      JSON.stringify({
        error: "A apărut o eroare la procesarea formularului",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
