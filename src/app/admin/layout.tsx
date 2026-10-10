import { session } from "@/lib/supabase";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
export const metadata = {
  title: "Moderation",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await session();
  if (!profile) redirect("/login?next=/admin");
  if (profile.role === "member" || profile.suspension) notFound();
  return (
    <div className="admin-page">
      <span className="eyebrow">AMITEA MODERATION</span>
      <h1>Keep the conversation kind.</h1>
      <p>Private moderation workspace. Every action needs a reason.</p>
      <nav className="category-chips" aria-label="Moderation navigation">
        {["reports", "posts", "users", "audit"].map((s) => (
          <Link href={`/admin/${s}`} key={s}>
            {s === "posts"
              ? "All content"
              : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
