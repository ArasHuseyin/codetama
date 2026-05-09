import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "https://codetama.com"),
  title: {
    default: "Codetama — a creature that lives in your code",
    template: "%s · Codetama",
  },
  description:
    "A digital pet that grows as you use Claude Code. Every prompt is food. Every tool shapes its character. Battle other developers on a shared world map.",
  applicationName: "Codetama",
  keywords: ["claude code", "tamagotchi", "developer game", "cli", "ai pet"],
  openGraph: {
    title: "Codetama",
    description: "A digital pet that grows as you use Claude Code.",
    url: "/",
    siteName: "Codetama",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Codetama",
    description: "A digital pet that grows as you use Claude Code.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-4xl px-6 py-8">
          <header className="mb-10 flex items-center justify-between">
            <Link href="/" className="text-fg no-underline text-xl font-bold tracking-widest">
              <span className="dim">[</span>codetama<span className="dim">]</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/about">about</Link>
              <Link href="/rules">rules</Link>
              <Link href="/map" className="dim">map</Link>
              {session?.user ? (
                <>
                  <Link href="/profile">profile</Link>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button type="submit" className="text-fgDim hover:text-fg">
                      logout
                    </button>
                  </form>
                </>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await signIn("github", { redirectTo: "/profile" });
                  }}
                >
                  <button type="submit" className="text-fg">
                    login
                  </button>
                </form>
              )}
            </nav>
          </header>
          {children}
          <footer className="mt-16 border-t border-fgMuted pt-6 text-xs muted flex flex-col gap-3 sm:flex-row sm:justify-between">
            <span>codetama.com · MIT</span>
            <span className="flex flex-wrap gap-4">
              <Link href="/about">about</Link>
              <Link href="/privacy">privacy</Link>
              <Link href="/terms">terms</Link>
              <Link href="mailto:hello@codetama.com">contact</Link>
            </span>
          </footer>
        </div>
      </body>
    </html>
  );
}
