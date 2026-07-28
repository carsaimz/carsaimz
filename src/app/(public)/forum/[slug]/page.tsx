import { TopicDetail } from '@/components/forum/topic-detail';

// Required for static export: return empty array since all slugs are dynamic
export async function generateStaticParams() {
  return [];
}

// Server component that renders the client component
export default function ForumTopicPageRoute() {
  return <TopicDetail slug="__dynamic__" />;
}
