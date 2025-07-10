
import React, { useState } from 'react';
import { SearchResult } from '../types';
import { LinkIcon, CheckIcon } from './Icons';
import StarRating from './StarRating';
import ValidityRating from './ValidityRating';

interface ResultCardProps {
  result: SearchResult;
  selectionMode: boolean;
  onSelect: () => void;
}

const ImageLoader: React.FC = () => (
    <div className="w-full aspect-[3/4] bg-stone-300 animate-pulse flex items-center justify-center">
        <svg className="w-8 h-8 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
    </div>
)

const ResultCard: React.FC<ResultCardProps> = ({ result, selectionMode, onSelect }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const domain = result.url ? new URL(result.url).hostname.replace('www.','') : 'N/A';

  const isRecentAndValid = result.publicationYear &&
                           result.validityRating &&
                           (new Date().getFullYear() - result.publicationYear <= 5) &&
                           result.validityRating !== 'N/A' &&
                           result.validityRating !== 'C';

  const cardInnerContent = (
    <>
      <div className="relative">
        {isRecentAndValid && <ValidityRating rating={result.validityRating!} />}
        {result.selected && (
          <div className="absolute inset-0 bg-sky-500/70 z-20 flex items-center justify-center backdrop-blur-sm">
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
              <CheckIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        {!imageLoaded && <ImageLoader />}
        <img 
            src={result.coverImageUrl} 
            alt={`Cover for ${result.title}`}
            className={`w-full aspect-[3/4] object-cover ${imageLoaded ? 'block' : 'hidden'}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.querySelector('.w-full.aspect-\\[3\\/4\\]')?.classList.remove('hidden') }}
        />
      </div>
      <div className="p-3 flex-grow flex flex-col">
        <h3 className="text-sm font-bold truncate leading-tight flex-grow">{result.title}</h3>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-stone-500">
            <LinkIcon className="w-3 h-3 flex-shrink-0" />
            <p className="truncate">{domain}</p>
        </div>
        {result.rating !== undefined && <StarRating rating={result.rating} />}
        {result.tags && result.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-xs bg-sky-200 text-sky-800 px-1.5 py-0.5 rounded-full font-semibold">{result.tags[0]}</span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className={`group relative transition-all duration-300 ${result.selected ? 'ring-4 ring-sky-400 ring-offset-2 ring-offset-stone-800 rounded-lg' : ''}`}>
        {selectionMode ? (
            <div
            onClick={onSelect}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
            role="button"
            tabIndex={0}
            className="cursor-pointer block bg-stone-100 text-stone-800 rounded-md overflow-hidden shadow-lg transform transition-transform duration-300 ease-in-out group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-black/30 h-full flex flex-col"
            title={result.title}
            >
            {cardInnerContent}
            </div>
        ) : (
            <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-stone-100 text-stone-800 rounded-md overflow-hidden shadow-lg transform transition-transform duration-300 ease-in-out group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-black/30 h-full flex flex-col"
            title={result.title}
            >
            {cardInnerContent}
            </a>
        )}
      {result.briefSummary && (
        <div className="absolute bottom-full mb-2 w-full p-3 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
          <p className="text-sm text-stone-200 font-semibold">Resumo</p>
          <p className="text-xs text-stone-300 mt-1">{result.briefSummary}</p>
        </div>
      )}
    </div>
  );
};

export default ResultCard;
