'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  MessageSquarePlus,
  Send,
  User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { useToast } from '@/hooks/use-toast';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ServiceReview {
  id: string;
  serviceId: string;
  name: string;
  rating: number;
  content: string;
  contentI18n?: string | null;
  avatar?: string | null;
  createdAt?: string;
}

// ──────────────────────────────────────────────
// Star Rating Display
// ──────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Interactive Star Selector
// ──────────────────────────────────────────────

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className="p-1 hover:scale-110 transition-transform"
          aria-label={`Rate ${i + 1} stars`}
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              i < value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

interface ServiceReviewsProps {
  serviceId: string;
  serviceName: string;
}

export function ServiceReviews({ serviceId, serviceName }: ServiceReviewsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formContent, setFormContent] = useState('');

  // Fetch reviews
  useEffect(() => {
    if (!serviceId) return;

    apiFetch(`/api/service-reviews?serviceId=${encodeURIComponent(serviceId)}`)
      .then((res) => safeJson(res))
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          setReviews(data.data);
        }
      })
      .catch(() => {
        // Error - show empty state
      })
      .finally(() => setLoading(false));
  }, [serviceId]);

  // Compute average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Submit review
  const handleSubmit = async () => {
    if (!formName.trim() || !formContent.trim()) {
      toast({
        title: t('common.error') || 'Error',
        description: t('testimonials.nameContentRequired') || 'Name and content are required',
        variant: 'destructive',
      });
      return;
    }

    if (formContent.trim().length < 10) {
      toast({
        title: t('common.error') || 'Error',
        description: t('serviceReviews.minLength') || 'Review must be at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/service-reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          name: formName.trim(),
          email: formEmail.trim(),
          rating: formRating,
          content: formContent.trim(),
        }),
      });

      const data = await safeJson(res);
      if (data?.success) {
        toast({
          title: t('common.success') || 'Success',
          description:
            t('serviceReviews.submittedForReview') ||
            'Your review has been submitted and will appear after approval',
        });
        setDialogOpen(false);
        // Reset form
        setFormName('');
        setFormEmail('');
        setFormRating(5);
        setFormContent('');
      } else {
        toast({
          title: t('common.error') || 'Error',
          description: data?.message || 'Failed to submit review',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('common.error') || 'Error',
        description: t('common.networkError') || 'Network error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      <Separator className="mb-8" />

      {/* Header with average rating */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            {t('serviceReviews.title') || 'Reviews'}
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(averageRating)} size="md" />
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} ({reviews.length}{' '}
                {reviews.length === 1
                  ? t('serviceReviews.review') || 'review'
                  : t('serviceReviews.reviews') || 'reviews'}
                )
              </span>
            </div>
          )}
        </div>

        {/* Submit Review Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              {t('serviceReviews.writeReview') || 'Write a Review'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5 text-emerald-600" />
                {t('serviceReviews.writeReview') || 'Write a Review'} — {serviceName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="review-name">{t('common.name') || 'Name'} *</Label>
                <Input
                  id="review-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('common.enterName') || 'Enter your name'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-email">{t('common.email') || 'Email'}</Label>
                <Input
                  id="review-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder={t('common.enterEmail') || 'Enter your email'}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('testimonials.rating') || 'Rating'} *</Label>
                <StarSelector value={formRating} onChange={setFormRating} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-content">
                  {t('serviceReviews.yourReview') || 'Your Review'} *
                </Label>
                <Textarea
                  id="review-content"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={
                    t('serviceReviews.contentPlaceholder') ||
                    'Share your experience with this service...'
                  }
                  rows={4}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting
                  ? t('common.submitting') || 'Submitting...'
                  : t('common.submit') || 'Submit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-24 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquarePlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-1">
            {t('serviceReviews.noReviews') || 'No reviews yet'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('serviceReviews.beFirst') || 'Be the first to share your experience!'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {reviews.map((review) => (
            <Card
              key={review.id}
              className="border-emerald-200/30 dark:border-emerald-800/20 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-emerald-200 dark:border-emerald-800/50">
                      <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                        {review.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{review.name}</p>
                      {review.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  &ldquo;{review.content}&rdquo;
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
}
