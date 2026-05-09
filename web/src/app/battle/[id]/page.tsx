import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getBattleSnapshot } from "@/lib/battle-state";
import { BattleView } from "./BattleView";

export const revalidate = 0;

export default async function BattlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const snap = await getBattleSnapshot(id);
  if (!snap) notFound();
  if (snap.attacker.userId !== session.user.id && snap.defender.userId !== session.user.id) {
    notFound();
  }

  return <BattleView battleId={id} initial={snap} viewerId={session.user.id} />;
}
