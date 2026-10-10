"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
  Home,
  Compass,
  Flame,
  MessageCircle,
  ChartNoAxesColumn,
  Lightbulb,
  Bookmark,
  Activity,
  Settings,
  ShieldCheck,
  ArrowUpRight,
  Sun,
  Moon,
  Search,
} from "lucide-react";
import { useState } from "react";
import type { Profile } from "@/lib/supabase";
const links = [
  { href: "/", label: "Campus feed", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/trending", label: "Trending", icon: Flame },
  { href: "/confessions", label: "Confessions", icon: MessageCircle },
  { href: "/polls", label: "Campus polls", icon: ChartNoAxesColumn },
  { href: "/suggestions", label: "Suggestions", icon: Lightbulb },
];
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="amiTea home">
      <span className="brand-icon">
        <Coffee size={23} />
      </span>
      <span>
        ami<span className="accent">Tea</span>
        <small>CAMPUS, UNFILTERED.</small>
      </span>
    </Link>
  );
}
export function Shell({
  children,
  profile,
  college,
}: {
  children: React.ReactNode;
  profile: Profile | null;
  college: string;
}) {
  const path = usePathname();
  const [light, setLight] = useState(false);
  return (
    <div className="app-shell" data-theme={light ? "light" : "dark"}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="campus-label">
          <span className="online-dot" />
          {college}
          <span className="tiny-label">COMMUNITY</span>
        </div>
        <p className="nav-heading">THE COMMON ROOM</p>
        <nav aria-label="Main navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              className={`nav-link ${path === href ? "active" : ""}`}
              href={href}
              key={href}
            >
              <Icon size={19} />
              {label}
              {path === href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="nav-divider" />
        <p className="nav-heading">YOUR LITTLE CORNER</p>
        <nav aria-label="Your account">
          {[
            { href: "/saved", label: "Saved posts", icon: Bookmark },
            { href: "/activity", label: "Your activity", icon: Activity },
            { href: "/settings", label: "Settings", icon: Settings },
            ...(profile && profile.role !== "member"
              ? [{ href: "/admin", label: "Moderation", icon: ShieldCheck }]
              : []),
          ].map(({ href, label, icon: Icon }) => (
            <Link
              className={`nav-link ${path.startsWith(href) ? "active" : ""}`}
              href={href}
              key={href}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <ShieldCheck size={19} />
            <div>
              Your stories. Your space.
              <small>Your real identity stays off the feed.</small>
            </div>
          </div>
          <div className="sidebar-footer">
            <Link href="/rules">Guidelines</Link>
            <span>·</span>
            <Link href="/privacy">Privacy</Link>
            <button
              className="icon-button"
              aria-label={light ? "Use dark mode" : "Use light mode"}
              onClick={() => setLight(!light)}
            >
              {light ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="breadcrumb">
            Your campus <span>/</span> Your community
          </div>
          <div className="top-actions">
            <button
              className="icon-button mobile-theme"
              aria-label={light ? "Use dark mode" : "Use light mode"}
              onClick={() => setLight(!light)}
            >
              {light ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <Link
              href="/explore"
              className="icon-button"
              aria-label="Search amiTea"
            >
              <Search size={19} />
            </Link>
            {profile ? (
              <Link className="profile-chip" href="/settings">
                <span className="avatar small">
                  {profile.alias.slice(0, 1)}
                </span>
                <span>{profile.alias}</span>
              </Link>
            ) : (
              <>
                <Link className="quiet-button" href="/login">
                  Log in
                </Link>
                <Link className="button primary small-button" href="/signup">
                  Find your people <ArrowUpRight size={16} />
                </Link>
              </>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="page-footer">
          <span>amiTea · A little more connected.</span>
          <div>
            <Link href="/rules">Rules</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/report">Get help</Link>
          </div>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[
          links[0],
          links[1],
          links[4],
          links[5],
          { href: "/settings", label: "You", icon: Settings },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            href={href}
            key={href}
            className={path === href ? "active" : ""}
          >
            <Icon size={20} />
            <span>
              {label === "Campus feed"
                ? "Home"
                : label === "Campus polls"
                  ? "Polls"
                  : label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
