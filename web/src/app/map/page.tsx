import { MapView } from "./MapView";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export const revalidate = 0;

export default async function MapPage() {
  const session = await auth();

  return (
    <main className="fixed inset-0 z-50 bg-bg">
      <header className="absolute left-0 right-0 top-0 z-20 border-b border-fgMuted bg-bgPanel/95 px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-fg no-underline text-xl font-bold tracking-widest">
            <span className="dim">[</span>codetama<span className="dim">]</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/rules">rules</Link>
            <Link href="/map" className="dim">
              map
            </Link>
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
        </div>
      </header>
      <MapView />
      <footer className="absolute bottom-0 left-0 right-0 z-20 border-t border-fgMuted bg-bgPanel/95 px-6 py-3 text-xs muted flex justify-between">
        <span>codetama.com / MIT</span>
        <span className="flex gap-4">
          <Link href="/privacy">privacy</Link>
          <Link href="/terms">terms</Link>
        </span>
      </footer>
    </main>
  );
}
