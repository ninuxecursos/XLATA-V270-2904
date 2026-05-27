 import { useState } from 'react';
 import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface ProductImageZoomProps {
   images: string[];
   productName: string;
   initialIndex?: number;
   isOpen: boolean;
   onClose: () => void;
 }
 
 export function ProductImageZoom({ 
   images, 
   productName, 
   initialIndex = 0, 
   isOpen, 
   onClose 
 }: ProductImageZoomProps) {
   const [currentIndex, setCurrentIndex] = useState(initialIndex);
   const [touchStartX, setTouchStartX] = useState(0);
   const [touchEndX, setTouchEndX] = useState(0);
 
   if (!isOpen || !images.length) return null;
 
   const handlePrev = () => {
     setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
   };
 
   const handleNext = () => {
     setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
   };
 
   const handleTouchEnd = () => {
     if (images.length <= 1) return;
     const swipeThreshold = 50;
     const diff = touchStartX - touchEndX;
     if (touchEndX !== 0 && Math.abs(diff) > swipeThreshold) {
       if (diff > 0) {
         handleNext();
       } else {
         handlePrev();
       }
     }
     setTouchStartX(0);
     setTouchEndX(0);
   };
 
   const handleBackdropClick = (e: React.MouseEvent) => {
     if (e.target === e.currentTarget) {
       onClose();
     }
   };
 
   return (
     <div 
       className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
       onClick={handleBackdropClick}
     >
       {/* Close button */}
       <button
         onClick={onClose}
         className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
       >
         <X className="w-6 h-6" />
       </button>
 
       {/* Image counter */}
       <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium">
         {currentIndex + 1} / {images.length}
       </div>
 
       {/* Navigation arrows - Desktop */}
       {images.length > 1 && (
         <>
           <button
             onClick={handlePrev}
             className="hidden md:flex absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white transition-colors"
           >
             <ChevronLeft className="w-8 h-8" />
           </button>
           <button
             onClick={handleNext}
             className="hidden md:flex absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white transition-colors"
           >
             <ChevronRight className="w-8 h-8" />
           </button>
         </>
       )}
 
       {/* Main image */}
       <div 
         className="w-full h-full flex items-center justify-center p-4 md:p-12"
         onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
         onTouchMove={(e) => setTouchEndX(e.touches[0].clientX)}
         onTouchEnd={handleTouchEnd}
       >
         <img
           src={images[currentIndex]}
           alt={`${productName} - Imagem ${currentIndex + 1}`}
           className="max-w-full max-h-full object-contain select-none"
           draggable={false}
         />
       </div>
 
       {/* Thumbnail dots - Mobile */}
       {images.length > 1 && (
         <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
           {images.map((_, index) => (
             <button
               key={index}
               onClick={() => setCurrentIndex(index)}
               className={cn(
                 "w-2 h-2 rounded-full transition-all",
                 currentIndex === index 
                   ? "w-6 bg-white" 
                   : "bg-white/40 hover:bg-white/60"
               )}
             />
           ))}
         </div>
       )}
     </div>
   );
 }
 
 // Icon component for triggering zoom
 export function ZoomIcon({ className }: { className?: string }) {
   return (
     <div className={cn(
       "absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white cursor-pointer hover:bg-black/70 transition-colors",
       className
     )}>
       <ZoomIn className="w-5 h-5" />
     </div>
   );
 }