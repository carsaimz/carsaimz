'use client';
import { PostDetail } from '@/components/blog/post-detail';
import { useParams } from 'next/navigation';
export default function BlogPostPageRoute() {
  const params = useParams();
  return <PostDetail slug={params.slug as string} />;
}
