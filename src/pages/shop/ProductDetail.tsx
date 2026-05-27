import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Heart, 
  Share2, 
  AlertCircle, 
  Star, 
  Truck, 
  Shield, 
  CheckCircle,
  Package,
  Clock,
  Tag,
  ChevronRight,
  Home,
  MapPin
} from 'lucide-react';
import { SEOHead } from '@/components/portal/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShopLayout } from '@/components/shop/public/ShopLayout';
import { InteractiveOfferPanel } from '@/components/shop/public/InteractiveOfferPanel';
import { useShopProductBySlug } from '@/hooks/useShopProducts';
import { useActiveInteractiveEvents } from '@/hooks/useInteractiveEvents';
import { useShopCart } from '@/hooks/useShopCart';
import { useShopConfig } from '@/hooks/useShopConfig';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { ShopAuthModal } from '@/components/shop/public/ShopAuthModal';
import { ProductReviewsList } from '@/components/shop/public/ProductReviewsList';
import { ProductSuggestions } from '@/components/shop/public/ProductSuggestions';
import { useProductRatingStats } from '@/hooks/useProductReviews';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useShopFavorites';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { WhatsAppButton } from '@/components/shop/public/WhatsAppButton';
import { ProductImageZoom, ZoomIcon } from '@/components/shop/public/ProductImageZoom';
import { supabase } from '@/integrations/supabase/client';

const conditionConfig = {
  novo: { label: 'Novo', color: 'bg-emerald-500', textColor: 'text-emerald-500', bgLight: 'bg-emerald-50' },
  usado: { label: 'Usado', color: 'bg-blue-500', textColor: 'text-blue-500', bgLight: 'bg-blue-50' },
  no_estado: { label: 'No Estado', color: 'bg-amber-500', textColor: 'text-amber-500', bgLight: 'bg-amber-50' }
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useShopProductBySlug(slug || '');
  const { data: activeEvents = [] } = useActiveInteractiveEvents();
  const { addItem } = useShopCart();
  const { data: config } = useShopConfig();
  const { shopUser, isAuthenticated } = useShopAuth();
  
  // Rating stats dinâmico
  const { data: ratingStats } = useProductRatingStats(product?.id);
  
  // Favoritos
  const { data: isFavoritedData } = useIsFavorite(shopUser?.id, product?.id);
  const toggleFavorite = useToggleFavorite();
  
  const [quantity, setQuantity] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [showImageZoom, setShowImageZoom] = useState(false);
  
  const isFavorited = isFavoritedData ?? false;

  const primaryColor = config?.colors?.primary || '#10B981';
  const colors = config?.colors;

  // Encontra evento interativo ativo para este produto
  const activeEvent = activeEvents.find(e => e.product_id === product?.id);

  // Incrementar view_count quando o produto é visualizado
  useEffect(() => {
    if (!product?.id) return;
    
    // Incrementar view_count silenciosamente (fire and forget)
    const incrementView = async () => {
      try {
        await supabase.rpc('increment_view_count', {
          table_name: 'shop_products',
          record_id: product.id
        });
      } catch {
        // Ignorar erros silenciosamente
      }
    };
    
    incrementView();
  }, [product?.id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (!config?.is_open) {
      toast.error('A loja está fechada no momento');
      return;
    }

    if (product.stock_quantity <= 0) {
     toast.error('Este produto já foi vendido');
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image: product.images?.[0],
      stockQuantity: product.stock_quantity ?? undefined
    }, quantity);

    toast.success(`${quantity} ${quantity > 1 ? 'itens adicionados' : 'item adicionado'} ao carrinho!`);
    setQuantity(1);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/shop/carrinho');
  };

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        text: product?.description || '',
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    }
  };

  const hasDiscount = product?.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product!.sale_price! / product!.price) * 100)
    : 0;

  const currentImage = product?.images?.[selectedImageIndex] || null;
  const hasImages = product?.images && product.images.length > 0;

  if (isLoading) {
    return (
      <ShopLayout hideBottomNav>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mb-6" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="aspect-square bg-gray-200 rounded-2xl" />
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-20" />
                  <div className="h-10 bg-gray-200 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                  <div className="h-16 bg-gray-200 rounded" />
                  <div className="h-32 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (error || !product) {
    return (
      <ShopLayout hideBottomNav>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center py-16 px-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <AlertCircle className="w-10 h-10" style={{ color: primaryColor }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
            <p className="text-gray-500 mb-8 max-w-md">
              O produto que você procura não existe ou foi removido da nossa loja.
            </p>
            <Button 
              onClick={() => navigate('/shop')} 
              className="text-white font-semibold px-6"
              style={{ backgroundColor: primaryColor }}
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar à Loja
            </Button>
          </div>
        </div>
      </ShopLayout>
    );
  }

  const isInteractive = product.sale_type === 'interactive' && activeEvent;
  const conditionInfo = product.condition ? conditionConfig[product.condition as keyof typeof conditionConfig] : null;

  // WhatsApp - número configurado no CMS
  const whatsappNumber = config?.footer_config?.whatsapp || '';
  
  // Gerar mensagem detalhada para WhatsApp
  const getWhatsAppMessage = () => {
    if (!product) return '';
    
    const conditionLabel = conditionInfo?.label || 'Não informada';
    const currentPrice = product.sale_price || product.price;
    const productUrl = window.location.href;
    
    return `Olá! Tenho interesse neste produto:

📦 Produto: ${product.name}
💰 Preço: ${formatCurrency(currentPrice)}
🏷️ Condição: ${conditionLabel}${product.sku ? `
📋 SKU: ${product.sku}` : ''}
🔗 Link: ${productUrl}

Gostaria de mais informações!`;
  };

  return (
    <ShopLayout hideBottomNav>
      {/* SEO Meta Tags */}
      <SEOHead
        title={product.seo_title || product.name}
        description={product.seo_description || product.short_description || product.description?.slice(0, 160) || ''}
        canonical={`https://xlata.site/shop/${product.slug}`}
        ogImage={product.images?.[0] || '/lovable-uploads/XLATALOGO.png'}
        ogType="product"
        allowIndexing={product.is_active}
      />
      {/* Rich Pins + Schema.org Product JSON-LD */}
      <Helmet>
        {/* Pinterest Rich Pin meta tags */}
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={String(product.sale_price || product.price)} />
        <meta property="product:price:currency" content="BRL" />
        <meta property="product:availability" content={product.stock_quantity > 0 ? 'in stock' : 'out of stock'} />
        <meta property="product:condition" content={product.condition === 'novo' ? 'new' : 'used'} />
        <meta property="product:brand" content={config?.store_name || 'XLata'} />
        {product.images?.[0] && <meta property="og:image:width" content="1000" />}
        {product.images?.[0] && <meta property="og:image:height" content="1000" />}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.seo_title || product.name,
            "description": product.seo_description || product.short_description || '',
            "image": product.images || [],
            "sku": product.sku || undefined,
            "brand": { "@type": "Brand", "name": config?.store_name || "XLata" },
            "offers": {
              "@type": "Offer",
              "url": `https://xlata.site/shop/${product.slug}`,
              "priceCurrency": "BRL",
              "price": product.sale_price || product.price,
              "availability": product.stock_quantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
              "condition": product.condition === 'novo'
                ? "https://schema.org/NewCondition"
                : "https://schema.org/UsedCondition"
            },
            ...(ratingStats?.review_count && ratingStats.review_count > 0 && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": ratingStats.average_rating,
                "reviewCount": ratingStats.review_count
              }
            })
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
        {/* Breadcrumb - Hidden on Mobile */}
        <div 
          className="border-b hidden lg:block"
          style={{ 
            backgroundColor: colors?.surface || '#FFFFFF',
            borderColor: colors?.border || '#E5E7EB'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <Link 
                to="/shop" 
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Início</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className="text-gray-400 truncate max-w-none">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Mobile Back Button */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!isAuthenticated || !shopUser) {
                    setShowAuthModal(true);
                    return;
                  }
                  toggleFavorite.mutate({
                    userId: shopUser.id,
                    productId: product.id,
                    isFavorited
                  });
                }}
                disabled={toggleFavorite.isPending}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isFavorited 
                    ? "bg-red-50 text-red-500" 
                    : "text-gray-600"
                )}
              >
                <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full text-gray-600 flex items-center justify-center"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto lg:px-4 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12">
            
            {/* Left Column - Gallery */}
            <div className="lg:space-y-4">
              {/* Main Image - Full width on mobile */}
              <div 
                className="relative aspect-square lg:rounded-2xl overflow-hidden lg:shadow-lg"
                style={{ 
                  backgroundColor: colors?.surface || '#FFFFFF',
                }}
                onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                onTouchMove={(e) => setTouchEndX(e.touches[0].clientX)}
                onTouchEnd={() => {
                  if (!product?.images || product.images.length <= 1) return;
                  const swipeThreshold = 50;
                  const diff = touchStartX - touchEndX;
                  if (touchEndX !== 0 && Math.abs(diff) > swipeThreshold) {
                    if (diff > 0) {
                      setSelectedImageIndex(prev => prev < product.images.length - 1 ? prev + 1 : 0);
                    } else {
                      setSelectedImageIndex(prev => prev > 0 ? prev - 1 : product.images.length - 1);
                    }
                  }
                  setTouchStartX(0);
                  setTouchEndX(0);
                }}
              >
                {currentImage ? (
                  <>
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => setShowImageZoom(true)}
                    />
                    <ZoomIcon className="lg:hidden" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Tag className="w-24 h-24 text-gray-300" />
                  </div>
                )}
                
                {/* Desktop Floating Actions */}
                <div className="hidden lg:flex absolute top-4 right-4 flex-col gap-2">
                  <button
                    onClick={() => {
                      if (!isAuthenticated || !shopUser) {
                        setShowAuthModal(true);
                        return;
                      }
                      toggleFavorite.mutate({
                        userId: shopUser.id,
                        productId: product.id,
                        isFavorited
                      });
                    }}
                    disabled={toggleFavorite.isPending}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all",
                      isFavorited 
                        ? "bg-red-500 text-white" 
                        : "bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Discount Badge */}
                {hasDiscount && (
                  <div 
                    className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-white font-bold text-sm shadow-lg"
                    style={{ backgroundColor: '#EF4444' }}
                  >
                    -{discountPercent}% OFF
                  </div>
                )}

                {/* Mobile Image Dots Indicator */}
                {hasImages && product.images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 lg:hidden">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          selectedImageIndex === index 
                            ? "w-6" 
                            : "bg-white/60"
                        )}
                        style={{
                          backgroundColor: selectedImageIndex === index ? primaryColor : undefined
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails - Desktop only */}
              {hasImages && product.images.length > 1 && (
                <div className="hidden lg:flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        "flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200",
                        selectedImageIndex === index 
                          ? "ring-2 ring-offset-2" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{
                        borderColor: selectedImageIndex === index ? primaryColor : undefined,
                        ...(selectedImageIndex === index && { '--tw-ring-color': primaryColor } as React.CSSProperties)
                      }}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Product Info */}
            <div className="px-4 lg:px-0 pt-4 lg:pt-0 space-y-4 lg:space-y-5">
              {/* Product Title - Prominent like Webmotors */}
              <div>
                <h1 className="text-xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
                {product.short_description && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2 lg:hidden">
                    {product.short_description}
                  </p>
                )}
              </div>

              {/* Rating, Condition & Sales - Compact inline */}
              <div className="flex items-center gap-3 flex-wrap text-sm">
                {conditionInfo && (
                  <Badge 
                    className={cn(
                      "text-white font-medium px-2.5 py-0.5 text-xs",
                      conditionInfo.color
                    )}
                  >
                    {conditionInfo.label}
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-gray-900">
                    {ratingStats?.average_rating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-gray-400">
                    ({ratingStats?.review_count || 0})
                  </span>
                </div>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  {product.sold_count || 0} vendidos
                </span>
              </div>

              {/* Interactive Panel OR Price Section */}
              {isInteractive && activeEvent ? (
                <InteractiveOfferPanel 
                  event={activeEvent} 
                  onAuthRequired={handleAuthRequired}
                  productName={product?.name}
                />
              ) : (
                <>
                  {/* Price Card */}
                  <div 
                    className="rounded-2xl p-5 space-y-4"
                    style={{ 
                      backgroundColor: colors?.surface || '#FFFFFF',
                      border: `1px solid ${colors?.border || '#E5E7EB'}`
                    }}
                  >
                    <div className="flex items-baseline gap-3 flex-wrap">
                      {hasDiscount ? (
                        <>
                          <span 
                            className="text-3xl lg:text-4xl font-bold"
                            style={{ color: primaryColor }}
                          >
                            {formatCurrency(product.sale_price!)}
                          </span>
                          <span className="text-lg text-gray-400 line-through">
                            {formatCurrency(product.price)}
                          </span>
                        </>
                      ) : (
                        <span 
                          className="text-3xl lg:text-4xl font-bold"
                          style={{ color: primaryColor }}
                        >
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Delivery Info */}
                    <div className="space-y-2">
                      {((product as any).delivery_type === 'pickup' || !(product as any).delivery_type || (product as any).delivery_type === 'both') && (
                        <div 
                          className="flex items-center justify-between gap-2.5 p-3 rounded-xl"
                          style={{ backgroundColor: `${primaryColor}10` }}
                        >
                          <div className="flex items-center gap-2.5">
                            <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                            <span className="text-sm font-medium" style={{ color: primaryColor }}>
                              Disponível para retirada
                            </span>
                          </div>
                          {config?.footer_config?.google_maps_link && (
                            <button
                              onClick={() => window.open(config.footer_config!.google_maps_link, '_blank', 'noopener,noreferrer')}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
                            >
                              Saber o endereço
                            </button>
                          )}
                        </div>
                      )}
                      {((product as any).delivery_type === 'delivery' || (product as any).delivery_type === 'both') && (
                        <div 
                          className="flex items-center justify-between gap-2.5 p-3 rounded-xl"
                          style={{ backgroundColor: `${primaryColor}10` }}
                        >
                          <div className="flex items-center gap-2.5">
                            <Truck className="w-5 h-5" style={{ color: primaryColor }} />
                            <span className="text-sm font-medium" style={{ color: primaryColor }}>
                              Entrega disponível
                            </span>
                          </div>
                          {whatsappNumber && (
                            <button
                              onClick={() => {
                                const msg = `Olá! Gostaria de consultar o frete para o produto: ${product.name}`;
                                window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
                              }}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                            >
                              Consultar frete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center gap-2">
                    {product.stock_quantity <= 0 ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                       <span className="font-semibold">Produto Vendido</span>
                      </div>
                    ) : product.stock_quantity <= 5 ? (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold">
                          Últimas {product.stock_quantity} unidades!
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2" style={{ color: primaryColor }}>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">
                          Em estoque ({product.stock_quantity} disponíveis)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4">
                    <span className="text-gray-700 font-medium">Quantidade:</span>
                    <div 
                      className="flex items-center rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${colors?.border || '#E5E7EB'}` }}
                    >
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span 
                        className="w-14 h-11 flex items-center justify-center font-bold text-gray-900"
                        style={{ backgroundColor: colors?.background_alt || '#F9FAFB' }}
                      >
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                        disabled={quantity >= product.stock_quantity}
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      variant="outline"
                      className="flex-1 h-14 text-base font-semibold rounded-xl border-2 bg-transparent hover:bg-gray-50/50"
                      style={{ 
                        borderColor: primaryColor, 
                        color: primaryColor,
                        backgroundColor: 'transparent'
                      }}
                      onClick={handleAddToCart}
                      disabled={product.stock_quantity <= 0 || !config?.is_open}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Adicionar ao Carrinho
                    </Button>
                    {config?.show_buy_now_button !== false && (
                      <Button 
                        className="flex-1 h-14 text-base font-semibold rounded-xl text-white shadow-lg transition-all hover:shadow-xl"
                        style={{ backgroundColor: primaryColor }}
                        onClick={handleBuyNow}
                        disabled={product.stock_quantity <= 0 || !config?.is_open}
                      >
                        Comprar Agora
                      </Button>
                    )}
                  </div>

                  {/* WhatsApp Button - Desktop */}
                  {config?.show_interest_button !== false && whatsappNumber && (
                    <WhatsAppButton
                      phoneNumber={whatsappNumber}
                      message={getWhatsAppMessage()}
                      variant="full"
                      className="mt-3"
                      label="Tenho Interesse"
                    />
                  )}
                </>
              )}

              {/* Trust Badges - More compact on mobile */}
              <div 
                className="flex flex-wrap gap-4 pt-4 text-gray-600"
                style={{ borderTop: `1px solid ${colors?.border || '#E5E7EB'}` }}
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" style={{ color: primaryColor }} />
                  <span className="text-xs font-medium">Compra Segura</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(product as any).delivery_type === 'delivery' ? (
                    <>
                      <Truck className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className="text-xs font-medium">Entrega Disponível</span>
                    </>
                  ) : (product as any).delivery_type === 'both' ? (
                    <>
                      <Truck className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className="text-xs font-medium">Retirada ou Entrega</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className="text-xs font-medium">Retirada na Loja</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" style={{ color: primaryColor }} />
                  <span className="text-xs font-medium">Produto Verificado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="mt-4 lg:mt-12 px-4 lg:px-0 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Description */}
            <div 
              className="lg:col-span-2 rounded-xl lg:rounded-2xl overflow-hidden"
              style={{ 
                backgroundColor: colors?.surface || '#FFFFFF',
                border: `1px solid ${colors?.border || '#E5E7EB'}`
              }}
            >
              <div 
                className="px-4 lg:px-6 py-3 lg:py-4 font-bold text-gray-900 flex items-center gap-2"
                style={{ 
                  borderBottom: `1px solid ${colors?.border || '#E5E7EB'}`,
                  backgroundColor: colors?.background_alt || '#F9FAFB'
                }}
              >
                📝 <span className="text-sm lg:text-base">Descrição do Produto</span>
              </div>
              <div className="p-4 lg:p-6 space-y-4">
                {product.description_about && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">📦 Sobre o produto</h3>
                    <p className="text-gray-600 leading-relaxed text-sm lg:text-base whitespace-pre-line">{product.description_about}</p>
                  </div>
                )}
                {product.description_condition && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">⚙️ Estado</h3>
                    <p className="text-gray-600 leading-relaxed text-sm lg:text-base whitespace-pre-line">{product.description_condition}</p>
                  </div>
                )}
                {product.description_highlights && product.description_highlights.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">✨ Destaques</h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm lg:text-base">
                      {product.description_highlights.map((h, i) => (<li key={i}>{h}</li>))}
                    </ul>
                  </div>
                )}
                {product.specs && product.specs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">📋 Características</h3>
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          {product.specs.map((s, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="px-3 py-2 font-medium text-gray-700 w-1/3">{s.label}</td>
                              <td className="px-3 py-2 text-gray-600">{s.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {!product.description_about && !product.description_condition && (!product.description_highlights || product.description_highlights.length === 0) && (!product.specs || product.specs.length === 0) && (
                  product.description ? (
                    <div
                      className="text-gray-600 leading-relaxed text-sm lg:text-base prose prose-sm max-w-none prose-headings:text-gray-800 prose-strong:text-gray-800 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked.parse(product.description) as string)
                      }}
                    />
                  ) : (
                    <p className="text-gray-400 italic text-sm">Nenhuma descrição disponível para este produto.</p>
                  )
                )}
              </div>
            </div>

            {/* Product Info Card */}
            <div 
              className="rounded-xl lg:rounded-2xl overflow-hidden h-fit"
              style={{ 
                backgroundColor: colors?.surface || '#FFFFFF',
                border: `1px solid ${colors?.border || '#E5E7EB'}`
              }}
            >
              <div 
                className="px-4 lg:px-6 py-3 lg:py-4 font-bold text-gray-900 flex items-center gap-2"
                style={{ 
                  borderBottom: `1px solid ${colors?.border || '#E5E7EB'}`,
                  backgroundColor: colors?.background_alt || '#F9FAFB'
                }}
              >
                📋 <span className="text-sm lg:text-base">Informações</span>
              </div>
              <div className="p-4 space-y-2.5">
                {product.sku && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">SKU</span>
                    <span className="font-medium text-gray-900">{product.sku}</span>
                  </div>
                )}
                {conditionInfo && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Condição</span>
                    <Badge className={cn("text-white text-xs", conditionInfo.color)}>
                      {conditionInfo.label}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estoque</span>
                  <span className="font-medium text-gray-900">{product.stock_quantity} un.</span>
                </div>
                {product.tags && product.tags.length > 0 && (
                  <div className="pt-2.5" style={{ borderTop: `1px solid ${colors?.border || '#E5E7EB'}` }}>
                    <span className="text-xs text-gray-500 block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: `${primaryColor}15`,
                            color: primaryColor
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section - Real Component */}
          <div className="mt-4 lg:mt-6 px-4 lg:px-0">
            <ProductReviewsList 
              primaryColor={primaryColor}
            />
          </div>

          {/* Product Suggestions */}
          <div className="mt-4 lg:mt-6 px-4 lg:px-0">
            <ProductSuggestions
              currentProductId={product.id}
              categoryId={product.category_id}
              tags={product.tags}
              price={product.sale_price || product.price}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar - Webmotors style */}
      {!isInteractive && (
        <div 
          className="fixed bottom-0 left-0 right-0 lg:hidden border-t shadow-2xl z-40"
          style={{ 
            backgroundColor: colors?.surface || '#FFFFFF',
            borderColor: colors?.border || '#E5E7EB'
          }}
        >
          {/* Price display on bar */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500">Preço</span>
              <div className="flex items-baseline gap-2">
                <span 
                  className="text-xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {formatCurrency(product.sale_price || product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
            </div>
            {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
              <span className="text-xs text-amber-600 font-medium">
                Últimas {product.stock_quantity} un!
              </span>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="px-4 pb-4 flex gap-2">
            <Button 
              variant="outline"
              className="h-12 w-14 font-semibold rounded-xl border-2 bg-transparent hover:bg-transparent"
              style={{ borderColor: primaryColor, color: primaryColor }}
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0 || !config?.is_open}
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
            {/* WhatsApp Button - Mobile */}
            {config?.show_interest_button !== false && whatsappNumber && (
              <WhatsAppButton
                phoneNumber={whatsappNumber}
                message={getWhatsAppMessage()}
                variant="icon"
                className="h-12 w-14 rounded-xl"
              />
            )}
            {config?.show_buy_now_button !== false && (
              <Button 
                className="flex-1 h-12 font-semibold rounded-xl text-white text-base"
                style={{ backgroundColor: primaryColor }}
                onClick={handleBuyNow}
                disabled={product.stock_quantity <= 0 || !config?.is_open}
              >
                Comprar Agora
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <ShopAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Image Zoom Modal */}
      {hasImages && (
        <ProductImageZoom
          images={product.images}
          productName={product.name}
          initialIndex={selectedImageIndex}
          isOpen={showImageZoom}
          onClose={() => setShowImageZoom(false)}
        />
      )}
    </ShopLayout>
  );
}
