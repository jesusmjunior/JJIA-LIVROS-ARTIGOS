
import React from 'react';

interface ValidityRatingProps {
  rating: string;
}

const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.116 3.986 1.257 5.27c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.27-4.117-3.986c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
  </svg>
);


const ValidityRating: React.FC<ValidityRatingProps> = ({ rating }) => {
  return (
    <div 
        className="absolute top-1 right-1 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-amber-300 px-1.5 py-0.5 rounded-full shadow-md"
        title={`Classificação de Validade (Qualis Est.): ${rating}`}
    >
      <StarIcon className="w-3.5 h-3.5" />
      <span className="text-xs font-bold">{rating}</span>
    </div>
  );
};

export default ValidityRating;
