
import React, { useState, useEffect } from 'react';
import { SearchResult, AppStatus, SearchSession, CorrelationData, AppView } from './types';
import { generateGroundedResponse, generateCoverImage, enrichSourceData, generateCorrelationMap, generateScientificArticle } from './services/geminiService';
import { getRecentSearches, saveSearch, exportSearches, deleteSearchByTimestamp, exportArticleAsHtml } from './services/storageService';

import Header from './components/Header';
import SearchInput from './components/SearchInput';
import Loader from './components/Loader';
import ResultsDisplay from './components/ResultsDisplay';
import PostSearchActions from './components/ActionButtons';
import { BookIcon } from './components/Icons';
import HistoryPane from './components/HistoryPane';
import ArticleEditor from './components/ArticleEditor';

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchSession[]>([]);

  // New state for article workflow
  const [view, setView] = useState<AppView>(AppView.SEARCH);
  const [selectionMode, setSelectionMode] = useState(false);
  const [articleHtml, setArticleHtml] = useState('');


  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setError("Por favor, insira um tópico para pesquisar.");
      return;
    }
    
    setView(AppView.SEARCH);
    setSelectionMode(false);
    setStatus(AppStatus.LOADING);
    setError(null);
    setResults([]);
    setSummary('');
    setCorrelationData(null);
    let finalCorrelationData: CorrelationData | null = null;

    try {
      setLoadingMessage('Encontrando fontes relevantes...');
      const groundedResponse = await generateGroundedResponse(searchQuery);
      setSummary(groundedResponse.summary);

      if (!groundedResponse.sources || groundedResponse.sources.length === 0) {
        setStatus(AppStatus.SUCCESS);
        const newSession: SearchSession = { query: searchQuery, summary: groundedResponse.summary, results: [], timestamp: Date.now() };
        const updatedSearches = saveSearch(newSession);
        setRecentSearches(updatedSearches);
        return;
      }
      
      setLoadingMessage('Analisando documentos e gerando capas...');
      const titles = groundedResponse.sources.map(s => s.web?.title || 'Sem título');
      
      const [enrichedData, base64Images] = await Promise.all([
        enrichSourceData(titles, searchQuery),
        Promise.all(titles.map(title => generateCoverImage(title)))
      ]);

      const searchResults: SearchResult[] = groundedResponse.sources.map((source, index) => ({
        title: source.web?.title || 'Sem título',
        url: source.web?.uri || '#',
        coverImageUrl: `data:image/jpeg;base64,${base64Images[index]}`,
        rating: enrichedData[index]?.rating,
        tags: enrichedData[index]?.tags,
        briefSummary: enrichedData[index]?.briefSummary,
        publicationYear: enrichedData[index]?.publicationYear,
        validityRating: enrichedData[index]?.validityRating,
        selected: false,
      }));
      setResults(searchResults);
      
      if (searchResults.length > 1) {
          setLoadingMessage('Mapeando conexões temáticas...');
          const correlation = await generateCorrelationMap(searchResults);
          setCorrelationData(correlation);
          finalCorrelationData = correlation;
      }

      setStatus(AppStatus.SUCCESS);
      
      const newSession: SearchSession = { 
        query: searchQuery, 
        summary: groundedResponse.summary, 
        results: searchResults, 
        correlationData: finalCorrelationData || undefined,
        timestamp: Date.now(),
        selectionMode: false,
      };
      const updatedSearches = saveSearch(newSession);
      setRecentSearches(updatedSearches);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(`A pesquisa falhou: ${errorMessage}`);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleNewSearch = () => {
    setStatus(AppStatus.IDLE);
    setView(AppView.SEARCH);
    setQuery('');
    setResults([]);
    setSummary('');
    setError(null);
    setCorrelationData(null);
    setSelectionMode(false);
  };
  
  const handleLoadRecent = (session: SearchSession) => {
    setQuery(session.query);
    setSummary(session.summary);
    setResults(session.results.map(r => ({ ...r, selected: r.selected || false })));
    setCorrelationData(session.correlationData || null);
    setSelectionMode(session.selectionMode || false);
    setStatus(AppStatus.SUCCESS);
    setError(null);
    setView(AppView.SEARCH);
  };

  const handleDeleteSearch = (timestamp: number) => {
    const updatedSearches = deleteSearchByTimestamp(timestamp);
    setRecentSearches(updatedSearches);
  };
  
  const handleExportCurrentSearch = () => {
    const currentSession: SearchSession = {
        query,
        summary,
        results,
        correlationData: correlationData || undefined,
        timestamp: Date.now(),
        selectionMode,
    };
    exportSearches(currentSession);
  };

  const handleToggleSelection = () => {
    const newMode = !selectionMode;
    setSelectionMode(newMode);
    if (!newMode) {
      setResults(prev => prev.map(r => ({ ...r, selected: false })));
    }
  };

  const handleSelectResult = (resultToToggle: SearchResult) => {
    if (!selectionMode) return;
    setResults(prevResults =>
      prevResults.map(r =>
        r.url === resultToToggle.url ? { ...r, selected: !r.selected } : r
      )
    );
  };

  const handleGenerateArticle = async () => {
    const selected = results.filter(r => r.selected);
    if (selected.length === 0) {
      alert("Por favor, selecione pelo menos uma obra para gerar o artigo.");
      return;
    }

    setStatus(AppStatus.LOADING);
    setLoadingMessage('Escrevendo e formatando o artigo científico...');
    setError(null);
    
    try {
        const generatedHtml = await generateScientificArticle(selected);
        setArticleHtml(generatedHtml);
        setView(AppView.EDITOR);
        setStatus(AppStatus.SUCCESS); 
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
        setError(`A geração do artigo falhou: ${errorMessage}`);
        setStatus(AppStatus.ERROR);
    }
  };

  const handleBackToSearch = () => {
    setView(AppView.SEARCH);
    setStatus(AppStatus.SUCCESS);
  };

  const handleExportArticle = () => {
    exportArticleAsHtml(articleHtml, query);
  };
  
  const selectedCount = results.filter(r => r.selected).length;

  return (
    <div className="min-h-screen font-serif p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="mt-8">
          {view === AppView.EDITOR ? (
             <ArticleEditor 
              articleHtml={articleHtml}
              onBackToSearch={handleBackToSearch}
              onExportArticle={handleExportArticle}
            />
          ) : (
            <>
              {status !== AppStatus.IDLE && view === AppView.SEARCH && (
                <div className="mb-8">
                    <SearchInput query={query} setQuery={setQuery} onSearch={handleSearch} disabled={status === AppStatus.LOADING} />
                </div>
              )}

              {status === AppStatus.LOADING && (
                <Loader message={loadingMessage} />
              )}
              
              {status === AppStatus.IDLE && (
                <div className="text-center">
                    <div className="max-w-2xl mx-auto">
                        <BookIcon className="w-16 h-16 mx-auto text-amber-200/50 mb-4" />
                        <h2 className="text-2xl font-bold text-stone-200">Bem-vindo ao J.J. I.A.</h2>
                        <p className="text-stone-400 mt-2 max-w-2xl mx-auto">
                        Seu assistente de IA para pesquisa de obras e artigos. Insira um tópico para iniciar.
                        </p>
                        <div className="my-8">
                          <SearchInput query={query} setQuery={setQuery} onSearch={handleSearch} disabled={false} />
                        </div>
                    </div>
                    <HistoryPane
                        searches={recentSearches}
                        onLoad={handleLoadRecent}
                        onDelete={handleDeleteSearch}
                        onExportAll={() => exportSearches()}
                    />
                </div>
              )}

              {status === AppStatus.ERROR && (
                <div className="mt-8 text-center bg-red-900/30 border border-red-700/50 text-red-300 p-4 rounded-lg max-w-2xl mx-auto">
                  <p className="font-semibold">Ocorreu um erro</p>
                  <p className="mt-1">{error}</p>
                  <button onClick={handleNewSearch} className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md">Tentar Novamente</button>
                </div>
              )}
              
              {status === AppStatus.SUCCESS && view === AppView.SEARCH && (
                <>
                  <PostSearchActions 
                    onNewSearch={handleNewSearch} 
                    onExport={handleExportCurrentSearch} 
                    selectionMode={selectionMode}
                    onToggleSelection={handleToggleSelection}
                    onGenerateArticle={handleGenerateArticle}
                    selectedCount={selectedCount}
                  />
                  <ResultsDisplay 
                    summary={summary} 
                    results={results} 
                    correlationData={correlationData}
                    selectionMode={selectionMode}
                    onSelectResult={handleSelectResult}
                   />
                </>
              )}
            </>
          )}
        </main>
        <footer className="text-center py-6 mt-12 text-sm text-stone-500 border-t border-stone-800">
          <p>Desenvolvido por Adm. Jesus Martins Oliveira Junior</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
