import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noindex?: boolean;
  /** Explicitly control if this page should be indexed. When false, adds noindex meta tag. */
  allowIndexing?: boolean;
  /** Custom canonical URL. If not provided, uses current path. */
  customCanonical?: string;
}

export const SEOHead = ({
  title,
  description,
  canonical,
  ogImage = '/images/og-blog-default.jpg',
  ogType = 'website',
  publishedTime,
  modifiedTime,
  author,
  noindex = false,
  allowIndexing = true,
  customCanonical,
}: SEOHeadProps) => {
  const safeTitle = title || 'XLata - Sistema para Depósito de Reciclagem';
  const fullTitle = safeTitle.includes('XLata') ? safeTitle : `${safeTitle} | XLata`;
  // Use customCanonical first, then canonical prop, then default
  const canonicalUrl = customCanonical || canonical || `https://xlata.site${window.location.pathname}`;
  const ogImageUrl = ogImage?.startsWith('http') ? ogImage : `https://xlata.site${ogImage}`;
  
  // Should add noindex if either noindex is true OR allowIndexing is false
  const shouldNoindex = noindex || !allowIndexing;
  
  // Determine robots meta content
  const robotsContent = shouldNoindex 
    ? 'noindex, nofollow' 
    : 'index, follow, max-image-preview:large, max-snippet:-1';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Always include explicit robots meta */}
      <meta name="robots" content={robotsContent} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:site_name" content="XLata - Sistema para Depósito de Reciclagem" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* Article specific */}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
    </Helmet>
  );
};
