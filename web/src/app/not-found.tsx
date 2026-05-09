import Link from "next/link";

const ART = `
   .-""-.
  /  .-. \\
 |  / x \\ |
 |  \\___/ |
  \\      /
   '----'
`;

export default function NotFound() {
  return (
    <main className="space-y-8 text-center max-w-md mx-auto pt-12">
      <pre className="ascii text-fg text-sm">{ART}</pre>
      <div>
        <h1 className="text-3xl">404</h1>
        <p className="dim mt-2">that egg never hatched.</p>
      </div>
      <div className="flex justify-center gap-3">
        <Link href="/" className="btn">← home</Link>
        <Link href="/map" className="btn">world map</Link>
      </div>
    </main>
  );
}
