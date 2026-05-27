
import React from 'react';
import SystemLogo from './SystemLogo';

const FooterLogo: React.FC = () => {
  return (
    <div className="flex items-center">
      <SystemLogo 
        size="sm" 
        className=""
        showCompanyName={false}
        fallbackSrc="/lovable-uploads/0a88c5b7-5cee-4840-953d-8ac270aaa491.png"
      />
    </div>
  );
};

export default FooterLogo;
