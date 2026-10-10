import { notFound } from "next/navigation";
import { db, session } from "@/lib/supabase";
import { ModerateButton } from "@/components/admin";
import { Pagination } from "@/components/feed";
import { reasons } from "@/lib/validation";
type Row = {
  id: string;
  target_type?: string;
  target_id?: string;
  title?: string;
  body?: string;
  status?: string;
  reason?: string;
  description?: string;
  preview?: string;
  alias?: string;
  role?: string;
  created_at: string;
  expires_at?: string;
  moderator?: string;
  action?: string;
  locked?: boolean;
  account_id?: string;
};
export default async function Admin({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { section: parts } = await params;
  if (parts && parts.length > 1) notFound();
  const section = parts?.[0] || "reports";
  if (!["reports", "posts", "users", "audit"].includes(section)) notFound();
  const profile = await session();
  if (!profile || profile.role === "member" || profile.suspension) notFound();
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const client = await db();
  const { data, error } = await client!.rpc("admin_data", {
    section,
    page_number: page,
    state: query.status || "",
    reason_filter: query.reason || "",
    type_filter: query.type || "",
  });
  if (error) throw new Error("Moderation data could not be loaded.");
  const rows = data as Row[];
  return (
    <section>
      <h2>
        {section === "posts"
          ? "Content moderation"
          : section === "reports"
            ? "Report queue"
            : section === "users"
              ? "Account restrictions"
              : "Audit history"}
      </h2>
      {["reports", "posts"].includes(section) && (
        <form className="admin-filters" action={`/admin/${section}`}>
          <label>
            Status
            <select name="status" defaultValue={query.status || ""}>
              <option value="">All</option>
              {(section === "reports"
                ? ["pending", "dismissed", "resolved"]
                : ["published", "open", "closed", "hidden", "removed"]
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select name="type" defaultValue={query.type || ""}>
              <option value="">All</option>
              {["post", "comment", "poll", "suggestion"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {section === "reports" && (
            <label>
              Reason
              <select name="reason" defaultValue={query.reason || ""}>
                <option value="">All</option>
                {reasons.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          )}
          <button className="button secondary">Apply filters</button>
        </form>
      )}
      {!rows.length && (
        <div className="empty-state">
          <h3>All clear here.</h3>
          <p>No matching records in this part of amiTea.</p>
        </div>
      )}
      {rows.map((row) => (
        <article key={row.id} className="post-card admin-record">
          <div className="post-meta">
            <span className="category-tag">
              {row.target_type || row.role || section}
            </span>
            <time>
              {new Date(row.created_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </time>
            {row.status && <span className="status-pill">{row.status}</span>}
          </div>
          <h3>{row.title || row.alias || row.action || row.reason}</h3>
          <p className="post-body">{row.body || row.description || ""}</p>
          {row.preview && <blockquote>{row.preview}</blockquote>}
          {row.reason && (
            <p>
              <strong>Reason:</strong> {row.reason}
            </p>
          )}
          {row.moderator && <p>Moderator: {row.moderator}</p>}
          {row.target_id && (
            <p className="small-note">Target reference: {row.target_id}</p>
          )}
          {row.account_id && (
            <p className="small-note">Account reference: {row.account_id}</p>
          )}
          {row.expires_at && (
            <p>
              Restriction expiry:{" "}
              {new Date(row.expires_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </p>
          )}
          <div className="moderation-actions">
            {section === "reports" && (
              <>
                <ModerateButton
                  id={row.id}
                  type="report"
                  action="dismiss"
                  label="Dismiss report"
                />
                <ModerateButton
                  id={row.id}
                  type="report"
                  action="resolve"
                  label="Mark resolved"
                />
                {row.preview && (
                  <ModerateButton
                    id={row.target_id!}
                    type={row.target_type!}
                    action="hide"
                    label="Hide content"
                  />
                )}
              </>
            )}
            {section === "posts" && (
              <>
                <ModerateButton
                  id={row.id}
                  type={row.target_type!}
                  action="hide"
                  label="Hide"
                />
                <ModerateButton
                  id={row.id}
                  type={row.target_type!}
                  action="remove"
                  label="Remove"
                />
                <ModerateButton
                  id={row.id}
                  type={row.target_type!}
                  action="restore"
                  label="Restore"
                />
                {row.target_type === "post" && (
                  <ModerateButton
                    id={row.id}
                    type="post"
                    action={row.locked ? "unlock" : "lock"}
                    label={row.locked ? "Unlock" : "Lock"}
                  />
                )}{" "}
                {row.target_type === "poll" && (
                  <ModerateButton
                    id={row.id}
                    type="poll"
                    action="close"
                    label="Close poll"
                  />
                )}
                {row.target_type === "suggestion" && (
                  <ModerateButton
                    id={row.id}
                    type="suggestion"
                    action="status"
                    label="Update status"
                  />
                )}
                {row.account_id && (
                  <ModerateButton
                    id={row.account_id}
                    type="user"
                    action="suspend"
                    label="Restrict author 7 days"
                  />
                )}
              </>
            )}
            {section === "users" && row.role === "member" && (
              <>
                <ModerateButton
                  id={row.id}
                  type="user"
                  action="suspend"
                  label="Suspend 7 days"
                />
                <ModerateButton
                  id={row.id}
                  type="user"
                  action="reinstate"
                  label="Reinstate"
                />
              </>
            )}
          </div>
        </article>
      ))}
      <Pagination
        path={`/admin/${section}`}
        params={query}
        page={page}
        count={rows.length}
        size={20}
      />
    </section>
  );
}
