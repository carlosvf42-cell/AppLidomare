import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_EMAIL = "carlosvf42@gmail.com";
const resend = new Resend(process.env.RESEND_API_KEY);

// Admin client — uses service_role key, never exposed to the browser
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const { data } = await getAdminClient().auth.getUser(token);
  return data.user?.email === ADMIN_EMAIL;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido." }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Generate the invite link via Supabase Admin
    const { data, error: inviteError } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        // Supabase will append #access_token=...&type=invite to this URL
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://app-lidomare.vercel.app"}/login`,
      },
    });

    if (inviteError || !data?.properties?.action_link) {
      console.error("Supabase invite error:", inviteError);
      return NextResponse.json(
        {
          error: "No se pudo generar la invitación",
          details: inviteError?.message ?? "action_link vacío",
          code: (inviteError as any)?.code,
          status: (inviteError as any)?.status,
        },
        { status: 500 }
      );
    }

    const inviteUrl = data.properties.action_link;

    // Send the branded email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Lidomare Health App <noreply@antifragil.net>",
      to: email,
      subject: "Tu acceso a Lidomare Health App",
      html: buildEmailHtml(inviteUrl),
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json(
        { error: "Invitación creada pero no se pudo enviar el email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Invite route error:", err);
    return NextResponse.json(
      {
        error: "No se pudo generar la invitación",
        details: err?.message,
        code: err?.code,
        status: err?.status,
      },
      { status: 500 }
    );
  }
}

function buildEmailHtml(inviteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu acceso a Lidomare</title>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="max-width:430px;background:#080808;border-radius:16px;overflow:hidden;border:1px solid #1a1a1a;">

          <!-- Header with logo -->
          <tr>
            <td style="padding:40px 32px 32px;text-align:center;border-bottom:1px solid #141414;">
              <!-- LIDOMARE SVG logo (inline) -->
              <svg width="160" height="36" viewBox="0 0 220 44" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="32" font-family="system-ui,sans-serif" font-size="28"
                      font-weight="300" letter-spacing="6" fill="#f0f0f0">LIDO</text>
                <text x="84" y="32" font-family="system-ui,sans-serif" font-size="28"
                      font-weight="300" letter-spacing="6" fill="#2abfbf">O</text>
                <text x="108" y="32" font-family="system-ui,sans-serif" font-size="28"
                      font-weight="300" letter-spacing="6" fill="#f0f0f0">MARE</text>
              </svg>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#2abfbf;">
                Bienvenido
              </p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:300;color:#f0f0f0;line-height:1.3;">
                Tu acceso a<br/>Lidomare Health App
              </h1>
              <p style="margin:0 0 32px;font-size:14px;font-weight:300;color:#888;line-height:1.7;">
                Has sido invitado a la plataforma de salud de Lidomare.<br/>
                Haz clic en el botón para crear tu contraseña y acceder.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}"
                       style="display:inline-block;padding:16px 40px;background:#2abfbf;color:#080808;
                              font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;
                              text-decoration:none;border-radius:8px;">
                      Crear mi contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-size:11px;color:#444;text-align:center;line-height:1.6;">
                Si no esperabas este email, puedes ignorarlo.<br/>
                El enlace caduca en 24 horas.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #141414;text-align:center;">
              <p style="margin:0;font-size:10px;color:#2a2a2a;letter-spacing:0.15em;">
                © ${new Date().getFullYear()} LIDOMARE · PLAYAMAR, TORREMOLINOS
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
