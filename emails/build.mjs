// Generates the Must-Have transactional emails.
//
// Table-based, inline styles, 600px — the same construction as
// report-email.html, which is the established pattern in this repo.
// Nothing here depends on a particular sender; the merge fields are
// written as {{handlebars}} so Clerk, Resend or anything else can bind
// them. Every template also carries its plain-text alternative as a
// comment at the foot, because a transactional email without one lands
// in spam more often.
import { writeFileSync, mkdirSync } from 'node:fs';

const GOLD = '#c8a84e';
const GOLD_BRIGHT = '#e8c870';
const INK = '#f4ecd2';
const MUTED = 'rgba(234,227,200,0.72)';
const FAINT = 'rgba(234,227,200,0.45)';
const LINE = 'rgba(200,168,78,0.12)';
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// The sigil, as a data URI so it needs no hosting and no image blocking.
const SIGIL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMTAiIGhlaWdodD0iMTEwIiB2aWV3Qm94PSItNzAgLTcwIDE0MCAxNDAiPjxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSI2MiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYzhhODRlIiBzdHJva2Utb3BhY2l0eT0iMC4zNSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtZGFzaGFycmF5PSIyIDUiLz48Y2lyY2xlIGN4PSIwIiBjeT0iMCIgcj0iNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2M4YTg0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuNTUiIHN0cm9rZS13aWR0aD0iMSIvPjxnIGZpbGw9IiNlOGM4NzAiPjxyZWN0IHg9Ii0zMCIgeT0iLTMzIiB3aWR0aD0iNjAiIGhlaWdodD0iNiIgcng9IjIiLz48cmVjdCB4PSItMzAiIHk9Ii0yMSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYiIHJ4PSIyIi8+PHJlY3QgeD0iLTMwIiB5PSItOSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYiIHJ4PSIyIi8+PHJlY3QgeD0iLTMwIiB5PSIzIiB3aWR0aD0iNjAiIGhlaWdodD0iNiIgcng9IjIiLz48cmVjdCB4PSItMzAiIHk9IjE1IiB3aWR0aD0iNjAiIGhlaWdodD0iNiIgcng9IjIiLz48cmVjdCB4PSItMzAiIHk9IjI3IiB3aWR0aD0iNjAiIGhlaWdodD0iNiIgcng9IjIiLz48L2c+PC9zdmc+';

/* ── building blocks ── */

const btn = (label, href) => `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="${GOLD_BRIGHT}" style="border-radius:999px;background:linear-gradient(135deg,#e8c870,#c8a84e 60%,#8a7434);">
                    <a href="${href}" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:#140e04;text-decoration:none;">${label}</a>
                  </td>
                </tr>
              </table>`;

// A code the reader retypes. Big, spaced, selectable — never an image.
const code = (token) => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:6px 0 2px;">
                    <div style="display:inline-block;padding:16px 30px;border:1px solid rgba(200,168,78,0.3);border-radius:14px;background:rgba(200,168,78,0.05);font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:30px;letter-spacing:10px;color:${INK};">${token}</div>
                  </td>
                </tr>
              </table>`;

// Fact rows — device, address, amount. The reader is checking these.
const facts = (rows) => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${LINE};border-radius:14px;">
                ${rows.map(([k, v], i) => `<tr>
                  <td style="padding:13px 18px;${i ? 'border-top:1px solid rgba(200,168,78,0.08);' : ''}font-family:${FONT};font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:${FAINT};white-space:nowrap;">${k}</td>
                  <td align="right" style="padding:13px 18px;${i ? 'border-top:1px solid rgba(200,168,78,0.08);' : ''}font-family:${FONT};font-size:14px;color:${INK};">${v}</td>
                </tr>`).join('\n                ')}
              </table>`;

// Used where the reader might not have done the thing themselves.
const warn = (text) => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid rgba(232,168,112,0.3);border-radius:14px;background:rgba(232,168,112,0.05);">
                <tr>
                  <td style="padding:15px 18px;font-family:${FONT};font-size:13px;line-height:1.6;color:rgba(234,227,200,0.7);">${text}</td>
                </tr>
              </table>`;

const p = (text) => `
              <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.65;color:${MUTED};">${text}</p>`;

const small = (text) => `
              <p style="margin:16px 0 0;font-family:${FONT};font-size:12.5px;line-height:1.6;color:${FAINT};">${text}</p>`;

/* ── the shell every email shares ── */
function shell({ title, badge, preheader, eyebrow, headline, body, footer }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Kaiso — ${title}</title>
</head>
<body style="margin:0;padding:0;background:#04030a;background-image:radial-gradient(ellipse at 50% 0%,#0a0817 0%,#04030a 60%,#000 100%);">

  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#04030a;font-size:1px;line-height:1px;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:transparent;">
    <tr>
      <td align="center" style="padding:32px 16px 56px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:linear-gradient(180deg,#100d16 0%,#08070c 100%);border:1px solid rgba(200,168,78,0.22);border-radius:22px;overflow:hidden;font-family:${FONT};">

          <tr>
            <td style="padding:22px 32px;border-bottom:1px solid ${LINE};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-size:11px;letter-spacing:6px;text-transform:uppercase;color:${GOLD};">
                    <span style="display:inline-block;width:7px;height:7px;background:${GOLD_BRIGHT};border-radius:50%;vertical-align:middle;margin-right:11px;"></span>KAISO
                  </td>
                  <td align="right" style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(234,227,200,0.35);">${badge}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:40px 32px 6px;">
              <img src="${SIGIL}" width="78" height="78" alt="" style="display:block;margin:0 auto 20px;">
              <div style="font-size:10px;letter-spacing:5px;text-transform:uppercase;color:${FAINT};margin-bottom:12px;">${eyebrow}</div>
              <div style="font-size:29px;line-height:1.15;font-weight:700;color:${INK};letter-spacing:-0.4px;">${headline}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:26px 36px 4px;">
${body}
            </td>
          </tr>

          <tr>
            <td style="padding:26px 32px 28px;border-top:1px solid rgba(200,168,78,0.10);">
              <div style="font-size:10px;line-height:1.8;letter-spacing:1px;color:rgba(234,227,200,0.3);text-align:center;">
                ${footer}<br>
                <a href="{{privacyUrl}}" style="color:rgba(232,200,112,0.55);text-decoration:none;">Privacy</a> &nbsp;·&nbsp;
                <a href="{{termsUrl}}" style="color:rgba(232,200,112,0.55);text-decoration:none;">Terms</a> &nbsp;·&nbsp; Kaiso · the founder's oracle
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Transactional mail is not marketing: it carries no unsubscribe, and
// says plainly why it arrived.
const SECURITY_FOOTER = 'This is a security notice about your Kaiso account and cannot be turned off.';
const ACCOUNT_FOOTER = 'You are receiving this because of activity on your Kaiso account.';
const BILLING_FOOTER = 'You are receiving this because you have a paid Kaiso plan.';

const EMAILS = {};

/* ═════════ account & security ═════════ */

EMAILS['verify-email'] = {
  subject: 'Your Kaiso verification code is {{code}}',
  text: `Your Kaiso verification code is {{code}}.\n\nEnter it to confirm {{email}} belongs to you. It expires in 10 minutes.\n\nIf you did not ask for this, ignore this email — nothing changes.`,
  html: shell({
    title: 'Verify your email',
    badge: 'Verify',
    preheader: 'Your code is {{code}} — it expires in 10 minutes.',
    eyebrow: 'Confirm your address',
    headline: 'One code, then you&rsquo;re in.',
    body: p('Enter this code to confirm <strong style="color:#f4ecd2;">{{email}}</strong> belongs to you.') +
      code('{{code}}') +
      small('The code expires in 10 minutes. If you did not ask for it, ignore this email — nothing changes.'),
    footer: ACCOUNT_FOOTER,
  }),
};

EMAILS['password-reset'] = {
  subject: 'Reset your Kaiso password',
  text: `Reset your Kaiso password: {{resetUrl}}\n\nThe link works once and expires in 1 hour.\n\nIf you did not ask to reset it, ignore this email — your password has not changed.`,
  html: shell({
    title: 'Reset your password',
    badge: 'Password',
    preheader: 'A link to set a new password. It expires in an hour.',
    eyebrow: 'Password reset',
    headline: 'Set a new password.',
    body: p('Use the link below to choose a new password for <strong style="color:#f4ecd2;">{{email}}</strong>.') +
      btn('Reset password', '{{resetUrl}}') +
      small('The link works once and expires in 1 hour. If you did not ask to reset your password, ignore this email — nothing has changed.'),
    footer: ACCOUNT_FOOTER,
  }),
};

EMAILS['password-changed'] = {
  subject: 'Your Kaiso password was changed',
  text: `Your Kaiso password was changed on {{changedAt}}.\n\nIf this was you, nothing to do.\n\nIf it was not, secure your account now: {{secureUrl}}`,
  html: shell({
    title: 'Password changed',
    badge: 'Security',
    preheader: 'Your password was changed. If this was not you, act now.',
    eyebrow: 'Security notice',
    headline: 'Your password was changed.',
    body: facts([['Account', '{{email}}'], ['When', '{{changedAt}}']]) +
      p('<br>If this was you, there is nothing to do.') +
      warn('<strong style="color:#e8a870;">If it was not you</strong>, someone else may have access. Secure the account now — and sign out every other device while you are there.') +
      '<div style="height:20px;"></div>' + btn('Secure my account', '{{secureUrl}}'),
    footer: SECURITY_FOOTER,
  }),
};

EMAILS['new-signin'] = {
  subject: 'New sign-in to your Kaiso account',
  text: `A new sign-in to Kaiso.\n\nDevice: {{device}}\nLocation: {{location}}\nWhen: {{signedInAt}}\n\nIf this was you, nothing to do.\n\nIf not, secure your account: {{secureUrl}}`,
  html: shell({
    title: 'New sign-in',
    badge: 'Security',
    preheader: 'A new device signed in to your account.',
    eyebrow: 'Security notice',
    headline: 'A new device signed in.',
    body: facts([['Device', '{{device}}'], ['Location', '{{location}}'], ['When', '{{signedInAt}}']]) +
      p('<br>If this was you, there is nothing to do.') +
      warn('Do not recognise it? Secure the account and sign that device out.') +
      '<div style="height:20px;"></div>' + btn('Review active devices', '{{devicesUrl}}'),
    footer: SECURITY_FOOTER,
  }),
};

EMAILS['email-added'] = {
  subject: 'An email address was added to your Kaiso account',
  text: `{{addedEmail}} was added to your Kaiso account on {{changedAt}}.\n\nIf this was you, nothing to do.\n\nIf not, secure your account: {{secureUrl}}`,
  html: shell({
    title: 'Email address added',
    badge: 'Security',
    preheader: '{{addedEmail}} was added to your account.',
    eyebrow: 'Security notice',
    headline: 'An address was added.',
    body: facts([['Added', '{{addedEmail}}'], ['Account', '{{email}}'], ['When', '{{changedAt}}']]) +
      p('<br>Addresses on your account can be used to sign in and to reset your password.') +
      warn('If you did not add this address, remove it and change your password.') +
      '<div style="height:20px;"></div>' + btn('Manage addresses', '{{accountUrl}}'),
    footer: SECURITY_FOOTER,
  }),
};

EMAILS['email-removed'] = {
  subject: 'An email address was removed from your Kaiso account',
  text: `{{removedEmail}} was removed from your Kaiso account on {{changedAt}}.\n\nIf this was you, nothing to do.\n\nIf not, secure your account: {{secureUrl}}`,
  html: shell({
    title: 'Email address removed',
    badge: 'Security',
    preheader: '{{removedEmail}} was removed from your account.',
    eyebrow: 'Security notice',
    headline: 'An address was removed.',
    body: facts([['Removed', '{{removedEmail}}'], ['Account', '{{email}}'], ['When', '{{changedAt}}']]) +
      p('<br>That address can no longer sign in or reset your password.') +
      warn('If you did not remove it, secure the account now.') +
      '<div style="height:20px;"></div>' + btn('Secure my account', '{{secureUrl}}'),
    footer: SECURITY_FOOTER,
  }),
};

EMAILS['account-deleted'] = {
  subject: 'Your Kaiso account has been deleted',
  text: `Your Kaiso account ({{email}}) was deleted on {{deletedAt}}.\n\nYour sessions, plan and forged assets have been removed. Any active subscription has been cancelled.\n\nIf you did not do this, contact us at {{supportEmail}}.`,
  html: shell({
    title: 'Account deleted',
    badge: 'Account',
    preheader: 'Your account and everything in it has been deleted.',
    eyebrow: 'Confirmed',
    headline: 'Your account is gone.',
    body: facts([['Account', '{{email}}'], ['Deleted', '{{deletedAt}}']]) +
      p('<br>Your sessions, your plan and every forged asset — the Executive Summary, Landing Page and Pitch Deck — have been removed. Any active subscription has been cancelled.') +
      p('There is nothing left to recover. If you come back, you start fresh.') +
      warn('Did not expect this? Contact us at <a href="mailto:{{supportEmail}}" style="color:#e8c870;text-decoration:none;">{{supportEmail}}</a> straight away.'),
    footer: 'This is a one-time confirmation. No further email will be sent to this address.',
  }),
};

/* ═════════ billing ═════════ */

EMAILS['subscription-started'] = {
  subject: 'Your Kaiso plan is active — receipt for {{amount}}',
  text: `Your Kaiso Monthly plan is active.\n\nAmount: {{amount}}\nDate: {{paidAt}}\nNext renewal: {{renewsAt}}\nInvoice: {{invoiceUrl}}\n\nYou have {{minutes}} of session time.`,
  html: shell({
    title: 'Plan active',
    badge: 'Receipt',
    preheader: 'Your plan is active. Receipt for {{amount}}.',
    eyebrow: 'Receipt',
    headline: 'Your plan is active.',
    body: p('You have <strong style="color:#f4ecd2;">{{minutes}}</strong> of session time. Talk to Kaiso for as long as you need it.') +
      facts([['Plan', '{{planName}}'], ['Amount', '{{amount}}'], ['Paid', '{{paidAt}}'], ['Renews', '{{renewsAt}}']]) +
      '<div style="height:22px;"></div>' + btn('Start a session', '{{appUrl}}') +
      small('A full invoice is available <a href="{{invoiceUrl}}" style="color:#e8c870;text-decoration:none;">here</a>. Cancel any time from Plan &amp; Tokens; you keep the time you have paid for.'),
    footer: BILLING_FOOTER,
  }),
};

EMAILS['topup-receipt'] = {
  subject: 'Kaiso receipt — {{minutes}} added',
  text: `You added {{minutes}} of session time.\n\nAmount: {{amount}}\nDate: {{paidAt}}\nCard: ending {{cardLast4}}\nReceipt: {{receiptUrl}}\n\nYour balance is now {{balance}}. This was a one-off payment and nothing renews.`,
  html: shell({
    title: 'Top-up receipt',
    badge: 'Receipt',
    preheader: '{{minutes}} added. Receipt for {{amount}}.',
    eyebrow: 'Receipt',
    headline: 'Time added.',
    body: p('You added <strong style="color:#f4ecd2;">{{minutes}}</strong> of session time. Your balance is now <strong style="color:#f4ecd2;">{{balance}}</strong>.') +
      facts([['Added', '{{minutes}}'], ['Amount', '{{amount}}'], ['Paid', '{{paidAt}}'], ['Card', 'Ending {{cardLast4}}']]) +
      '<div style="height:22px;"></div>' + btn('Back to Kaiso', '{{appUrl}}') +
      small('A full receipt is available <a href="{{receiptUrl}}" style="color:#e8c870;text-decoration:none;">here</a>. This was a one-off payment &mdash; nothing renews.'),
    footer: 'You are receiving this because you bought session time from Kaiso.',
  }),
};

EMAILS['renewal-receipt'] = {
  subject: 'Kaiso renewed — receipt for {{amount}}',
  text: `Your Kaiso plan renewed.\n\nAmount: {{amount}}\nDate: {{paidAt}}\nNext renewal: {{renewsAt}}\nInvoice: {{invoiceUrl}}\n\nYour balance is topped back up to {{minutes}}.`,
  html: shell({
    title: 'Renewal receipt',
    badge: 'Receipt',
    preheader: 'Your plan renewed. Receipt for {{amount}}.',
    eyebrow: 'Receipt',
    headline: 'Your plan renewed.',
    body: p('Your balance is topped back up to <strong style="color:#f4ecd2;">{{minutes}}</strong>.') +
      facts([['Plan', '{{planName}}'], ['Amount', '{{amount}}'], ['Paid', '{{paidAt}}'], ['Renews', '{{renewsAt}}']]) +
      small('A full invoice is available <a href="{{invoiceUrl}}" style="color:#e8c870;text-decoration:none;">here</a>. Manage or cancel from Plan &amp; Tokens.'),
    footer: BILLING_FOOTER,
  }),
};

EMAILS['payment-failed'] = {
  subject: 'Kaiso could not take your payment',
  text: `We could not charge your card for {{amount}}.\n\nYour plan stays active until {{graceEndsAt}}. Update your payment method to keep it: {{billingUrl}}\n\nWe will try again on {{nextAttemptAt}}.`,
  html: shell({
    title: 'Payment failed',
    badge: 'Action needed',
    preheader: 'Update your payment method to keep your plan.',
    eyebrow: 'Payment failed',
    headline: 'We could not take payment.',
    body: p('The charge for <strong style="color:#f4ecd2;">{{amount}}</strong> did not go through. Cards expire, banks decline — it is usually quick to fix.') +
      facts([['Plan', '{{planName}}'], ['Amount', '{{amount}}'], ['Card', '{{cardLast4}}'], ['We retry', '{{nextAttemptAt}}']]) +
      '<div style="height:22px;"></div>' + btn('Update payment method', '{{billingUrl}}') +
      warn('Your plan stays active until <strong style="color:#e8a870;">{{graceEndsAt}}</strong>. After that, sessions stop — everything you have already forged stays yours.'),
    footer: BILLING_FOOTER,
  }),
};

EMAILS['subscription-cancelled'] = {
  subject: 'Your Kaiso plan has been cancelled',
  text: `Your Kaiso plan is cancelled.\n\nYou keep full access until {{accessEndsAt}}. After that, sessions stop and everything you have forged stays in your Library.\n\nChanged your mind? {{resubscribeUrl}}`,
  html: shell({
    title: 'Plan cancelled',
    badge: 'Billing',
    preheader: 'You keep access until {{accessEndsAt}}.',
    eyebrow: 'Cancelled',
    headline: 'Your plan is cancelled.',
    body: p('No further payment will be taken.') +
      facts([['Plan', '{{planName}}'], ['Cancelled', '{{cancelledAt}}'], ['Access until', '{{accessEndsAt}}']]) +
      p('<br>You keep everything you have already forged — the Executive Summary, Landing Page and Pitch Deck stay in your Library whether you have a plan or not. Only new sessions stop.') +
      '<div style="height:6px;"></div>' + btn('Change my mind', '{{resubscribeUrl}}'),
    footer: BILLING_FOOTER,
  }),
};

/* ── write ── */
mkdirSync('.', { recursive: true });
const names = Object.keys(EMAILS);
for (const name of names) {
  const e = EMAILS[name];
  const doc = e.html.replace(
    '</body>',
    `
<!--
  SUBJECT: ${e.subject}

  PLAIN TEXT ALTERNATIVE
  ${e.text.split('\n').join('\n  ')}
-->
</body>`);
  writeFileSync(`${name}.html`, doc);
}

/* an index so the set can be reviewed in one place */
const GROUPS = [
  ['Account &amp; security', ['verify-email', 'password-reset', 'password-changed', 'new-signin', 'email-added', 'email-removed', 'account-deleted']],
  ['Billing', ['topup-receipt', 'subscription-started', 'renewal-receipt', 'payment-failed', 'subscription-cancelled']],
];
writeFileSync('index.html', `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kaiso — Transactional emails</title>
<style>
  body{margin:0;padding:40px 24px 60px;background:radial-gradient(ellipse at 50% 0%,#0a0817,#04030a 60%,#000);
    color:#eae3c8;font-family:${FONT};}
  .wrap{max-width:1100px;margin:0 auto;}
  h1{font-size:26px;font-weight:600;letter-spacing:-.01em;color:#f4ecd2;margin:0 0 6px;}
  .sub{font-size:14px;color:rgba(234,227,200,.5);margin:0 0 34px;line-height:1.6;max-width:620px;}
  h2{font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:rgba(232,200,112,.7);margin:32px 0 14px;}
  ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;}
  a{display:block;border:1px solid rgba(200,168,78,.16);border-radius:14px;padding:15px 17px;
    text-decoration:none;color:#f1e9cf;transition:border-color .18s ease,background .18s ease;}
  a:hover{border-color:rgba(232,200,112,.45);background:rgba(200,168,78,.05);}
  a b{display:block;font-size:14.5px;font-weight:600;margin-bottom:4px;}
  a span{font-size:12px;color:rgba(234,227,200,.45);line-height:1.5;}
</style></head>
<body><div class="wrap">
  <h1>Transactional emails</h1>
  <p class="sub">The Must-Have set. Table-based and inline-styled like <code>report-email.html</code>, with
  <code>{{merge}}</code> fields so any sender can bind them. Each file carries its subject line and plain-text
  alternative as a comment at the foot.</p>
${GROUPS.map(([g, list]) => `  <h2>${g}</h2>
  <ul>
${list.map((n) => `    <li><a href="${n}.html"><b>${n}</b><span>${EMAILS[n].subject}</span></a></li>`).join('\n')}
  </ul>`).join('\n')}
</div></body></html>
`);

console.log('wrote', names.length, 'emails + index');
