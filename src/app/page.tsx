import { FeedPage } from "@/components/feed";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <FeedPage path="/" params={await searchParams} />;
}
