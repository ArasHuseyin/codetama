import { redirect } from "next/navigation";

export default async function UserMapPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  redirect(`/map?u=${encodeURIComponent(userId)}`);
}
