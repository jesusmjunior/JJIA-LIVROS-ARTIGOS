
import React from 'react';
import { CorrelationData } from '../types';

interface CorrelationMapProps {
    data: CorrelationData;
}

const CorrelationMap: React.FC<CorrelationMapProps> = ({ data }) => {
    return (
        <div className="mt-12 animate-fade-in">
            <h2 className="text-xl font-bold text-amber-200/90 mb-6 text-center">Mapa de Correlação Temática</h2>
            <div className="p-6 bg-stone-900/40 border border-stone-700/60 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
                    {data.clusters.map((cluster, clusterIndex) => (
                        <div key={clusterIndex} className="flex-1 min-w-0 w-full">
                            <div className="text-center p-3 bg-stone-800/50 rounded-t-lg">
                                <h3 className="font-bold text-stone-200">{cluster.theme}</h3>
                                <p className="text-xs text-stone-400 mt-1 italic">{cluster.description}</p>
                            </div>
                            <div className="relative pt-6 pb-2 px-4 border-x border-b border-dashed border-stone-600 rounded-b-lg">
                                {/* Vertical line */}
                                <div className="absolute top-0 left-1/2 w-px h-6 bg-stone-600 border-l border-dashed border-stone-600"></div>

                                {cluster.nodes.map((node) => (
                                    <div key={node.resultIndex} className="relative flex justify-center mb-4">
                                        {/* Horizontal connecting line */}
                                        <div className="absolute top-1/2 left-0 w-1/2 h-px border-t border-dashed border-stone-600"></div>
                                        <div className="absolute top-1/2 right-0 w-1/2 h-px border-t border-dashed border-stone-600"></div>
                                        
                                        <div className="relative z-10 px-3 py-1.5 bg-stone-700 border border-stone-600 rounded-md text-center shadow">
                                            <p className="text-sm text-stone-300 truncate" title={node.title}>
                                                {node.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CorrelationMap;
