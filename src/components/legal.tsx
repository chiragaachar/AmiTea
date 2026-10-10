import Link from "next/link";
import { siteConfig } from "@/lib/config";
const sections: Record<
  string,
  { title: string; intro: string; items: [string, string][] }
> = {
  rules: {
    title: "Keep it real. Keep it respectful.",
    intro:
      "amiTea is a space for campus stories, thoughtful disagreement and small acts of connection.",
    items: [
      [
        "People before punchlines",
        "No bullying, targeted harassment, threats, hate, impersonation or humiliating someone. Critique ideas and campus systems without targeting identifiable students.",
      ],
      [
        "Private stays private",
        "Do not post names or identifying details to target someone, private contact details, nonconsensual intimate content, or information that could expose someone. Avoid unverified, targeted accusations.",
      ],
      [
        "Share with care",
        "No spam, scams, malicious links or attempts to bypass suspensions. Share only content you have the right to share. Text posts are the only supported content format.",
      ],
      [
        "Help keep the table welcoming",
        "Use the flag on any post, comment, poll or suggestion. Reports are private. Moderators can hide or remove content, lock discussions, close polls and restrict accounts.",
      ],
      [
        "Review and appeal",
        "Moderators record reasons for their actions. If you believe a decision was mistaken, use the contact listed under Get help. Include the content URL and your public alias; never send your password. Review times depend on volunteer availability.",
      ],
    ],
  },
  privacy: {
    title: "Your privacy, without the fine-print fog.",
    intro:
      "amiTea offers pseudonymous participation, not guaranteed untraceability. This policy template must be reviewed by the campus operator before launch.",
    items: [
      [
        "What we collect",
        "You sign in with a username and password. The server converts your username to a deterministic internal identifier; Supabase Auth stores that identifier, a password hash and authentication records. No email address, real name, student number or phone number is requested. amiTea stores a random public alias, contributions, votes, saved posts, reports, moderation records and minimal per-account rate counters.",
      ],
      [
        "What other students see",
        "Public content includes your alias (or CampusConfession in confession mode), text, timestamps and aggregate engagement. Your login username and internal account ID are excluded from public projections. Aliases are stable and can be correlated; confession mode does not make the content untraceable. Public pages can be copied or indexed.",
      ],
      [
        "Who can access account information",
        "Moderators can access reports, internal account identifiers and moderation history to investigate abuse. They cannot sign in as you. Trusted Supabase project administrators can access authentication information, including internal login identifiers and password hashes. These identifiers are not encryption and can be matched against a guessed username. Hosting and authentication providers process technical logs under their own policies.",
      ],
      [
        "Cookies and service providers",
        "A first-party session cookie keeps you signed in. Supabase handles authentication and the database; Vercel hosts the app when deployed there. This app includes no advertising trackers or third-party analytics, and does not itself store IP addresses. Providers may retain technical logs according to their settings and policies.",
      ],
      [
        "Retention",
        "Contributions remain until you delete them, delete your account or the operator removes them. Hidden and removed content stays available to moderators until purged. The included maintenance procedure purges removed content after 30 days and reports/audit records after 90 days; the operator must schedule it before launch. Rate counters use one bounded row per account and action bucket. Backups and provider logs may retain data beyond live deletion.",
      ],
      [
        "Deletion and rights requests",
        "Settings lets you delete your account and its content, votes and bookmarks. Dependent replies may also be deleted. Retained reports and audit records lose their account link but may still contain text someone supplied. Request access, corrections or further deletion through Get help. Do not include passwords.",
      ],
      [
        "Before launch",
        "The operator must publish its identity and monitored contact, confirm retention schedules and provider regions, and obtain appropriate privacy/legal review. This template does not claim compliance with any specific law.",
      ],
    ],
  },
  terms: {
    title: "A shared space. A little shared responsibility.",
    intro:
      "These amiTea terms are a template for the campus operator to review before launch.",
    items: [
      [
        "Using amiTea",
        "Public pages can be read by anyone with access to the website. Posting, voting, saving and reporting require a username-and-password account. Save your login details: there is no email reset or automatic account recovery. Accounts do not verify college enrollment. Follow the community rules and any published campus eligibility requirements. Do not create accounts to manipulate votes or evade restrictions.",
      ],
      [
        "Your contributions",
        "You retain your rights to your content and permit the operator to display and moderate it as part of amiTea. Do not submit private or unlawful material, content you do not have the right to share, or malicious links. Other readers may copy publicly displayed content.",
      ],
      [
        "Moderation",
        "The operator may hide or remove content, close or lock discussions, and restrict accounts for rule violations. Reporting and appeals are described under Get help. No moderation response time is guaranteed.",
      ],
      [
        "Availability and responsibility",
        "amiTea is an independent community service unless the operator explicitly states otherwise. Posts represent their authors’ views and are not verified announcements. Free hosting has limits and may pause or become unavailable. Do not use amiTea for emergencies or critical records.",
      ],
      [
        "Operator details and applicable terms",
        "Before opening registration, the operator must add its legal identity, jurisdiction, age/eligibility rules, support contact and a reviewed limitation-of-liability clause appropriate to its use. Terms and privacy changes should be communicated to members.",
      ],
    ],
  },
};
export function Legal({ section }: { section: string }) {
  const data = sections[section];
  return (
    <article className="document-page">
      <span className="eyebrow">THE AMITEA WAY</span>
      <h1>{data.title}</h1>
      <p className="lead">{data.intro}</p>
      {data.items.map(([title, body]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </section>
      ))}
      <Link className="text-link" href="/report">
        Questions? Get help →
      </Link>
    </article>
  );
}
export function Help() {
  const { support } = siteConfig();
  return (
    <article className="document-page">
      <span className="eyebrow">WE LOOK OUT FOR EACH OTHER</span>
      <h1>Something doesn’t feel right?</h1>
      <p className="lead">
        Help keep amiTea a space everyone can feel welcome in.
      </p>
      <section>
        <h2>Report a conversation</h2>
        <p>
          Sign in, open the content and select its flag icon. Choose a reason
          and add context if helpful. Reports are sent privately to the
          moderation team. Never put private details into a public reply.
        </p>
      </section>
      <section>
        <h2>Urgent safety concerns</h2>
        <p>
          If someone is in immediate danger, contact local emergency services or
          campus security directly. amiTea is not monitored continuously and
          cannot provide emergency assistance.
        </p>
      </section>
      <section>
        <h2>Appeals, account help and privacy requests</h2>
        <p>
          Include your public alias and the relevant content URL. Explain what
          happened and the outcome you are requesting. Do not share your
          password or another student’s personal details.
        </p>
        {support ? (
          <a href={`mailto:${support}`} className="button primary">
            Contact the amiTea team
          </a>
        ) : (
          <p className="notice">
            The campus operator has not configured a support address yet. This
            must be completed before amiTea opens to students.
          </p>
        )}
      </section>
      <Link href="/rules" className="text-link">
        Read the community guidelines →
      </Link>
    </article>
  );
}
