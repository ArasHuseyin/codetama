import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/profile");

  return (
    <main className="space-y-8 max-w-md mx-auto pt-12">
      <div className="text-center">
        <p className="dim text-sm">/login</p>
        <h1 className="text-3xl mt-2">sign in</h1>
        <p className="mt-3 text-sm dim">
          GitHub is the only sign-in option. We use it as your stable identity for multiplayer.
        </p>
      </div>

      <form
        className="flex justify-center"
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/profile" });
        }}
      >
        <button type="submit" className="btn text-base">
          continue with github
        </button>
      </form>

      <p className="text-xs muted text-center">
        We read only your public profile (name, avatar, github id). No repo access.
      </p>
    </main>
  );
}
