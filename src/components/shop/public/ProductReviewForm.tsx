import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitReview, useUserReviewForOrder } from '@/hooks/useProductReviews';
import { cn } from '@/lib/utils';

interface ProductReviewFormProps {
  productId: string;
  orderId: string;
  userId: string;
  productName: string;
  onSuccess?: () => void;
}

export function ProductReviewForm({ 
  productId, 
  orderId, 
  userId, 
  productName,
  onSuccess 
}: ProductReviewFormProps) {
  const { data: existingReview, isLoading: loadingExisting } = useUserReviewForOrder(orderId, productId, userId);
  const submitReview = useSubmitReview();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  // Atualiza valores quando existingReview carrega
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    }
  }, [existingReview]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    await submitReview.mutateAsync({
      productId,
      orderId,
      userId,
      rating,
      comment,
      existingReviewId: existingReview?.id
    });
    
    onSuccess?.();
  };

  if (loadingExisting) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-1">
          {existingReview ? 'Editar avaliação' : 'Avaliar produto'}
        </h4>
        <p className="text-sm text-gray-500 line-clamp-1">{productName}</p>
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star 
              className={cn(
                "w-7 h-7 transition-colors",
                (hoverRating || rating) >= star 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating} estrela${rating > 1 ? 's' : ''}` : 'Selecione'}
        </span>
      </div>

      {/* Comment */}
      <Textarea
        placeholder="Conte sua experiência com o produto (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="resize-none"
      />

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || submitReview.isPending}
        className="w-full"
      >
        {submitReview.isPending 
          ? 'Enviando...' 
          : existingReview 
            ? 'Atualizar avaliação' 
            : 'Enviar avaliação'
        }
      </Button>
    </div>
  );
}
