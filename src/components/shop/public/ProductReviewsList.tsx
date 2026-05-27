import { Star, CheckCircle, User, ExternalLink, Package } from 'lucide-react';
import { useAllShopReviews } from '@/hooks/useProductReviews';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface ProductReviewsListProps {
  primaryColor?: string;
  shopSlug?: string;
}

const getFirstName = (fullName: string | undefined) => {
  return fullName?.split(' ')[0] || 'Cliente';
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export function ProductReviewsList({ primaryColor = '#10B981', shopSlug }: ProductReviewsListProps) {
  const { data: allReviews = [], isLoading } = useAllShopReviews();
  
  const {
    visibleItems: reviews,
    loadMore,
    hasMore,
    loadedCount,
    totalCount
  } = useInfiniteScroll({
    items: allReviews,
    pageSize: 10
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-gray-100 rounded-lg"></div>
        <div className="h-32 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  if (allReviews.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
        <Star className="w-10 h-10 mx-auto mb-2 text-gray-200" />
        <p className="text-sm text-gray-500">Nenhuma avaliação ainda</p>
        <p className="text-xs text-gray-400 mt-1">
          Seja o primeiro a avaliar!
        </p>
      </div>
    );
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClass,
              rating >= star 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-200"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <h3 className="font-semibold text-gray-900">Avaliações dos Clientes</h3>
          <span className="text-sm text-gray-500">
            ({totalCount})
          </span>
        </div>
      </div>

      {/* Lista de avaliações */}
      <div className="divide-y divide-gray-100">
        {reviews.map((review) => {
          const productImage = review.product?.images?.[0];
          const productSlug = review.product?.slug;
          const productName = review.product?.name || 'Produto';
          const productLink = shopSlug 
            ? `/${shopSlug}/produto/${productSlug}` 
            : `/shop/produto/${productSlug}`;

          return (
            <div key={review.id} className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <User className="w-5 h-5" style={{ color: primaryColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Nome e verificação */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">
                      {getFirstName(review.user?.name)}
                    </span>
                    {review.is_verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Compra verificada
                      </span>
                    )}
                  </div>

                  {/* Estrelas e data */}
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-xs text-gray-400">
                      {format(new Date(review.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>

                  {/* Produto avaliado */}
                  {review.product && (
                    <Link 
                      to={productLink}
                      className="flex items-center gap-2 mt-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      {productImage ? (
                        <img 
                          src={productImage} 
                          alt={productName}
                          className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-200"
                        >
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="text-xs text-gray-600 flex-1 min-w-0 truncate">
                        {truncateText(productName, 30)}
                      </span>
                      <ExternalLink 
                        className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" 
                      />
                    </Link>
                  )}

                  {/* Comentário */}
                  {review.comment && (
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                      "{review.comment}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Carregar mais */}
      {hasMore && (
        <div className="p-4 border-t border-gray-100">
          <Button
            variant="outline"
            className="w-full"
            onClick={loadMore}
          >
            Carregar mais avaliações ({totalCount - loadedCount} restantes)
          </Button>
        </div>
      )}
    </div>
  );
}
