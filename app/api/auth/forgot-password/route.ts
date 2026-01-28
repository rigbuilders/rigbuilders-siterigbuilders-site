import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import ResetPasswordEmail from "@/components/emails/ResetPasswordEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Check if user exists (Optional, but good for UX)
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.users.find((u) => u.email === email);

    if (!user) {
      // Return success even if user not found (Security practice to prevent email scraping)
      return NextResponse.json({ msg: "Email sent" }); 
    }

    // 2. Generate the Recovery Link
    // This creates a special URL that logs the user in and redirects them to your update page
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`,
      },
    });

    if (linkError) throw linkError;

    // 3. Send via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Rig Builders Security <support@rigbuilders.in>',
      to: [email],
      subject: 'Reset your password',
      react: ResetPasswordEmail({ 
        resetLink: linkData.properties.action_link,
        userName: user.user_metadata?.full_name
      }),
    });

    if (emailError) throw emailError;

    return NextResponse.json({ msg: "Email sent" });

  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}