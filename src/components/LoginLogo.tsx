
import React from 'react';
import SystemLogo from './SystemLogo';

const LoginLogo: React.FC = () => {
  return (
    <div className="flex justify-center mb-8">
      <SystemLogo 
        size="lg" 
        className="max-w-[200px]"
        showCompanyName={false}
        fallbackSrc="/lovable-uploads/0a88c5b7-5cee-4840-953d-8ac270aaa491.png"
      />
    </div>
  );
};

export default LoginLogo;
