'use client';
import { TopicDetail } from '@/components/forum/topic-detail';
import { useParams } from 'next/navigation';
export default function ForumTopicPageRoute() {
  const params = useParams();
  return <TopicDetail slug={params.slug as string} />;
}
