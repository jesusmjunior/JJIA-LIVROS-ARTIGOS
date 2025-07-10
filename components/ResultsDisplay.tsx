
import React from 'react';
import { SearchResult, CorrelationData } from '../types';
import ResultCard from './ResultCard';
import CorrelationMap from './CorrelationMap';

interface ResultsDisplayProps {
  summary: string;
  results: SearchResult[];
  correlationData: CorrelationData | null;
  selectionMode: boolean;
  onSelectResult: (result: SearchResult) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ summary, results, correlationData, selectionMode, onSelectResult }) => {
  return (
    <div className="mt-8 animate-fade-in">
      {/* AI Summary Section */}
      <div className="mb-12 p-6 bg-stone-900/40 border border-stone-700/60 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-amber-200/90 mb-3">Resumo da IA</h2>
        <p className="text-stone-300 leading-relaxed whitespace-pre-wrap">{summary}</p>
      </div>

      {/* Bookshelf Section */}
      {results.length > 0 && (
        <div className="mb-12">
            <h2 className="text-xl font-bold text-amber-200/90 mb-6 text-center">Documentos Fonte</h2>
            <div className="p-8 rounded-lg bookshelf-bg border-2 border-amber-900/50 shadow-inner">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {results.map((result, index) => (
                        <ResultCard 
                            key={result.url + index} 
                            result={result} 
                            selectionMode={selectionMode}
                            onSelect={() => onSelectResult(result)}
                        />
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Correlation Map Section */}
      {correlationData && correlationData.clusters.length > 0 && (
          <CorrelationMap data={correlationData} />
      )}

       {results.length === 0 && summary && (
         <div className="text-center mt-12 p-8 rounded-lg bookshelf-bg border-2 border-amber-900/50">
            <h2 className="text-2xl font-bold text-stone-200">Nenhuma fonte encontrada.</h2>
            <p className="text-stone-400 mt-2 max-w-2xl mx-auto">
              O resumo da IA foi gerado, mas nenhum documento fonte específico pôde ser recuperado para esta consulta.
            </p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
