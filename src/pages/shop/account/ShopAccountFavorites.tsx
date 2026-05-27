 import { useState } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
 import { ArrowLeft, Heart, Tag, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { ShopHeader } from '@/components/shop/public/ShopHeader';
 import { ShopFooter } from '@/components/shop/public/ShopFooter';
 import { ShopBottomNav } from '@/components/shop/mobile/ShopBottomNav';
 import { useShopAuth } from '@/contexts/ShopAuthContext';
 import { useShopConfig } from '@/hooks/useShopConfig';
 import { useShopFavorites, useToggleFavorite } from '@/hooks/useShopFavorites';
 import { useShopCart } from '@/hooks/useShopCart';
 import { cn } from '@/lib/utils';
 import { toast } from 'sonner';
 
 export default function ShopAccountFavorites() {
   const navigate = useNavigate();
   const { shopUser, isAuthenticated } = useShopAuth();
   const { data: config } = useShopConfig();
   const { data: favorites = [], isLoading } = useShopFavorites(shopUser?.id);
   const toggleFavorite = useToggleFavorite();
   const { addItem } = useShopCart();
   
   const primaryColor = config?.colors?.primary || '#10B981';
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('pt-BR', {
       style: 'currency',
       currency: 'BRL'
     }).format(value);
   };
 
   if (!isAuthenticated) {
     navigate('/shop/account');
     return null;
   }
 
   const handleRemoveFavorite = (productId: string) => {
     if (!shopUser?.id) return;
     toggleFavorite.mutate({
       userId: shopUser.id,
       productId,
       isFavorited: true
     });
   };
 
   const handleAddToCart = (favorite: typeof favorites[0]) => {
     if (!favorite.product) return;
     
     addItem({
       productId: favorite.product.id,
       name: favorite.product.name,
       price: favorite.product.sale_price || favorite.product.price,
       image: favorite.product.images?.[0],
       stockQuantity: favorite.product.stock_quantity ?? undefined
     }, 1);
     
     toast.success('Produto adicionado ao carrinho!');
   };
 
   return (
     <div className="min-h-screen bg-gray-50 light" data-theme="light">
       <ShopHeader />
       
       <main className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-8">
         {/* Header */}
         <div className="flex items-center gap-3 mb-6">
           <Button
             variant="ghost"
             size="icon"
             className="h-10 w-10 rounded-xl text-gray-700 hover:bg-gray-100"
             onClick={() => navigate('/shop/account')}
           >
             <ArrowLeft className="w-5 h-5" />
           </Button>
           <div>
             <h1 className="text-xl font-bold text-gray-900">Meus Favoritos</h1>
             <p className="text-sm text-gray-500">{favorites.length} produto{favorites.length !== 1 ? 's' : ''}</p>
           </div>
         </div>
 
         {/* Content */}
         {isLoading ? (
           <div className="flex items-center justify-center py-16">
             <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
           </div>
         ) : favorites.length === 0 ? (
           <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
             <div 
               className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ backgroundColor: `${primaryColor}15` }}
             >
               <Heart className="w-10 h-10" style={{ color: primaryColor }} />
             </div>
             <h2 className="text-lg font-semibold text-gray-900 mb-2">
               Nenhum favorito ainda
             </h2>
             <p className="text-gray-500 text-sm mb-6">
               Explore a loja e adicione produtos que você gosta aos favoritos
             </p>
             <Button 
               onClick={() => navigate('/shop')}
               className="text-white"
               style={{ backgroundColor: primaryColor }}
             >
               Explorar Produtos
             </Button>
           </div>
         ) : (
           <div className="space-y-3">
             {favorites.map((favorite) => {
               if (!favorite.product) return null;
               
               const product = favorite.product;
               const hasDiscount = product.sale_price && product.sale_price < product.price;
               const discountPercent = hasDiscount 
                 ? Math.round((1 - product.sale_price! / product.price) * 100)
                 : 0;
               const isOutOfStock = product.stock_quantity <= 0;
 
               return (
                 <div 
                   key={favorite.id}
                   className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4"
                 >
                   {/* Product Image */}
                   <Link 
                     to={`/shop/produto/${product.slug}`}
                     className="flex-shrink-0"
                   >
                     <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100 relative">
                       {product.images?.[0] ? (
                         <img
                           src={product.images[0]}
                           alt={product.name}
                           className={cn(
                             "w-full h-full object-cover",
                             isOutOfStock && "opacity-50"
                           )}
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                           <Tag className="w-8 h-8 text-gray-300" />
                         </div>
                       )}
                       {hasDiscount && (
                         <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                           -{discountPercent}%
                         </div>
                       )}
                       {isOutOfStock && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                           <span className="text-white text-sm font-bold bg-red-600 px-3 py-1 rounded shadow-lg uppercase tracking-wide">
                             VENDIDO
                           </span>
                         </div>
                       )}
                     </div>
                   </Link>
 
                   {/* Product Info */}
                   <div className="flex-1 min-w-0 flex flex-col">
                     <Link 
                       to={`/shop/produto/${product.slug}`}
                       className="hover:underline"
                     >
                       <h3 className="font-medium text-gray-900 line-clamp-2 text-sm sm:text-base">
                         {product.name}
                       </h3>
                     </Link>
 
                     <div className="mt-1 flex items-baseline gap-2">
                       {hasDiscount ? (
                         <>
                           <span className="font-bold text-lg" style={{ color: primaryColor }}>
                             {formatCurrency(product.sale_price!)}
                           </span>
                           <span className="text-sm text-gray-400 line-through">
                             {formatCurrency(product.price)}
                           </span>
                         </>
                       ) : (
                         <span className="font-bold text-lg text-gray-900">
                           {formatCurrency(product.price)}
                         </span>
                       )}
                     </div>
 
                     {/* Actions */}
                     <div className="mt-auto pt-3 flex items-center gap-2">
                       <Button
                         size="sm"
                         onClick={() => handleAddToCart(favorite)}
                         disabled={isOutOfStock}
                         className={cn(
                           "flex-1 text-white gap-1.5",
                           isOutOfStock && "opacity-50"
                         )}
                         style={{ backgroundColor: primaryColor }}
                       >
                         <ShoppingCart className="w-4 h-4" />
                         <span className="hidden sm:inline">Adicionar</span>
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => handleRemoveFavorite(product.id)}
                         disabled={toggleFavorite.isPending}
                         className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         )}
       </main>
 
       <ShopFooter />
       <ShopBottomNav />
     </div>
   );
 }