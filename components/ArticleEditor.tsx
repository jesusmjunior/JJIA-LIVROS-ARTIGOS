
import React from 'react';

interface ArticleEditorProps {
    articleHtml: string;
    onBackToSearch: () => void;
    onExportArticle: () => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ articleHtml, onBackToSearch, onExportArticle }) => {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-amber-200/90">Artigo Científico Gerado</h2>
                <div className="flex gap-4">
                    <button
                        onClick={onBackToSearch}
                        className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-md transition-colors font-medium text-stone-200"
                    >
                        &larr; Voltar para Pesquisa
                    </button>
                    <button
                        onClick={onExportArticle}
                        className="px-4 py-2 bg-sky-800 hover:bg-sky-700 text-sky-100 font-semibold rounded-md transition-colors"
                    >
                        Exportar como HTML
                    </button>
                </div>
            </div>

            <div 
                className="bg-white text-black p-8 sm:p-12 md:p-16 rounded-md shadow-lg"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: '1.5' }}
            >
                <div dangerouslySetInnerHTML={{ __html: articleHtml }} />
            </div>
        </div>
    );
};

export default ArticleEditor;
