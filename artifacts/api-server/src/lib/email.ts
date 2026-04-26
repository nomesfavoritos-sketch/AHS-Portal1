import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? "AHS Portal <noreply@ahsportal.edu.pk>";

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[email] SMTP not configured — skipping email to", payload.to);
    return false;
  }
  try {
    await transporter.sendMail({ from: SMTP_FROM, ...payload });
    console.log("[email] Sent to", payload.to);
    return true;
  } catch (err) {
    console.error("[email] Failed to send to", payload.to, err);
    return false;
  }
}

export function buildDecisionEmail(opts: {
  studentName: string;
  applicationNumber: string;
  program: string;
  decision: string;
  remarks: string | null;
}): { subject: string; html: string } {
  const { studentName, applicationNumber, program, decision, remarks } = opts;

  const decisionMap: Record<string, { label: string; color: string; heading: string; body: string }> = {
    accept_joining: {
      label: "Accepted",
      color: "#01411C",
      heading: "Congratulations! Your Joining is Accepted",
      body: `We are pleased to inform you that your joining documents have been verified and accepted. You are now officially admitted to <strong>${program}</strong> at Allied Health College, Nishtar Medical University.`,
    },
    reject_joining: {
      label: "Rejected",
      color: "#dc2626",
      heading: "Application Rejected",
      body: `We regret to inform you that your application for <strong>${program}</strong> has been rejected after document verification. If you believe this is an error, please contact the admissions office.`,
    },
    send_back: {
      label: "Sent Back for Clarification",
      color: "#d97706",
      heading: "Action Required: Clarification Needed",
      body: `Your application for <strong>${program}</strong> requires clarification on certain documents. Please log in to the portal and review the remarks below, then resubmit your updated information.`,
    },
  };

  const info = decisionMap[decision] ?? decisionMap.send_back;

  const remarksSection = remarks
    ? `<div style="background:#f9fafb;border-left:4px solid ${info.color};padding:12px 16px;margin:20px 0;border-radius:4px;">
        <p style="margin:0;font-size:14px;color:#374151;"><strong>Remarks from Verification Officer:</strong></p>
        <p style="margin:8px 0 0;font-size:14px;color:#374151;">${remarks}</p>
      </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:${info.color};padding:24px 28px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">Allied Health College</h1>
      <p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:13px;">Nishtar Medical University, Multan</p>
    </div>
    <div style="padding:28px;">
      <h2 style="color:#111827;font-size:18px;margin:0 0 8px;">${info.heading}</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Dear <strong>${studentName}</strong>,</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">${info.body}</p>
      ${remarksSection}
      <div style="background:#f9fafb;border-radius:6px;padding:14px 16px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#6b7280;">Application No: <strong style="color:#111827;">${applicationNumber}</strong></p>
        <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Program: <strong style="color:#111827;">${program}</strong></p>
        <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Status: <strong style="color:${info.color};">${info.label}</strong></p>
      </div>
      <p style="color:#374151;font-size:14px;margin:20px 0 0;">Please log in to the <strong>AHS Portal</strong> for further details.</p>
    </div>
    <div style="background:#f9fafb;padding:16px 28px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated message from Allied Health College Admissions Portal. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  return { subject: `AHS Portal — Application Update: ${info.label} (${applicationNumber})`, html };
}
