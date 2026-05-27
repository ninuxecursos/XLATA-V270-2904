
import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit } from 'lucide-react';

interface LandingEditButtonProps {
  onClick: () => void;
  className?: string;
}

const LandingEditButton: React.FC<LandingEditButtonProps> = ({ onClick, className = "" }) => {
  return (
    <Button
      onClick={onClick}
      size="sm"
      variant="outline"
      className={`absolute top-2 right-2 z-50 bg-blue-600 hover:bg-blue-700 border-blue-600 text-white opacity-70 hover:opacity-100 transition-opacity ${className}`}
    >
      <Edit className="h-3 w-3" />
    </Button>
  );
};

export default LandingEditButton;
