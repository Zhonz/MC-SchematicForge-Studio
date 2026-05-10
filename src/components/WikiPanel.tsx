import { useState, useCallback, useEffect, useRef } from 'react'
import { WikiArticle, WikiSearchResult, WikiState } from '@/types/wiki'
import { searchWiki, fetchArticle } from '@/services/wikiService'

export function WikiPanel() {
  const [state, setState] = useState<WikiState>({
    searchQuery: '',
    currentArticle: null,
    searchResults: null,
    isLoading: false,
    error: null,
  })
  const [htmlContent, setHtmlContent] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
    
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setState(prev => ({ ...prev, searchResults: null, currentArticle: null }))
      setHtmlContent('')
      return
    }

    debounceRef.current = setTimeout(async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      try {
        const results = await searchWiki(query)
        setState(prev => ({ ...prev, searchResults: results, isLoading: false }))
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Search failed',
        }))
      }
    }, 300)
  }, [])

  const handleSelectArticle = useCallback(async (article: WikiArticle) => {
    setState(prev => ({ ...prev, isLoading: true, currentArticle: article }))
    try {
      const result = await fetchArticle(article.title)
      if (result) {
        setHtmlContent(result.html)
        setState(prev => ({ ...prev, currentArticle: result.article, isLoading: false }))
      } else {
        setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load article' }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load',
      }))
    }
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (contentRef.current && htmlContent) {
      const style = document.createElement('style')
      style.textContent = `
        .wiki-content { font-size: 13px; line-height: 1.6; color: var(--text-primary); }
        .wiki-content h2 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 1px solid var(--border-subtle); }
        .wiki-content h3 { font-size: 14px; font-weight: 600; margin: 12px 0 6px; }
        .wiki-content p { margin: 6px 0; }
        .wiki-content ul, .wiki-content ol { padding-left: 20px; margin: 6px 0; }
        .wiki-content li { margin: 3px 0; }
        .wiki-content a { color: var(--accent-primary); text-decoration: none; }
        .wiki-content a:hover { text-decoration: underline; }
        .wiki-content img { max-width: 100%; height: auto; border-radius: 4px; }
        .wiki-content table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
        .wiki-content th, .wiki-content td { padding: 6px 8px; border: 1px solid var(--border-subtle); text-align: left; }
        .wiki-content th { background: var(--bg-active); font-weight: 600; }
        .wiki-content code { background: var(--bg-active); padding: 2px 4px; border-radius: 3px; font-family: var(--font-mono); font-size: 11px; }
        .wiki-content pre { background: var(--bg-darkest); padding: 10px; border-radius: 6px; overflow-x: auto; }
      `
      contentRef.current.innerHTML = htmlContent
      contentRef.current.insertBefore(style, contentRef.current.firstChild)
    }
  }, [htmlContent])

  return (
    <div className="wiki-panel">
      <div className="panel-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        Wiki
      </div>

      <div className="search-container">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="搜索方块、生物..."
          value={state.searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {state.isLoading && (
        <div className="loading-state">
          <div className="loading-spinner"/>
          <span>搜索中...</span>
        </div>
      )}

      {state.error && (
        <div className="error-state">{state.error}</div>
      )}

      {!state.currentArticle && state.searchResults && (
        <div className="results-list">
          {state.searchResults.results.length === 0 && !state.isLoading && (
            <div className="empty-state">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <span>没有找到相关条目</span>
            </div>
          )}
          {state.searchResults.results.map((result, i) => (
            <div
              key={i}
              onClick={() => handleSelectArticle(result)}
              className="result-item"
            >
              <div className="result-title">{result.title.replace(/_/g, ' ')}</div>
              <div className="result-excerpt">{result.extract.substring(0, 80)}...</div>
            </div>
          ))}
        </div>
      )}

      {!state.currentArticle && !state.searchResults && !state.isLoading && (
        <div className="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>搜索方块、物品、生物等信息</span>
        </div>
      )}

      {state.currentArticle && (
        <div className="article-view">
          <div className="article-header">
            <span className="article-title">{state.currentArticle.title.replace(/_/g, ' ')}</span>
            <button
              onClick={() => {
                setState(prev => ({ ...prev, currentArticle: null, searchResults: null }))
                setHtmlContent('')
              }}
              className="close-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {state.currentArticle.thumbnail && (
            <div className="article-thumbnail">
              <img src={state.currentArticle.thumbnail} alt={state.currentArticle.title}/>
            </div>
          )}

          {state.currentArticle.extract && (
            <div className="article-intro">
              {state.currentArticle.extract}
            </div>
          )}

          <div ref={contentRef} className="article-content"/>

          <div className="article-footer">
            <a href={state.currentArticle.url} target="_blank" rel="noopener noreferrer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              在 Wiki 中查看原文
            </a>
          </div>
        </div>
      )}

      <style>{`
        .wiki-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-dark);
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-subtle);
        }

        .search-container {
          position: relative;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .search-icon {
          position: absolute;
          left: 22px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px 8px 32px;
          font-size: 12px;
          background: var(--bg-darkest);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          outline: none;
          transition: all 120ms var(--ease-out);
        }

        .search-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(92, 155, 255, 0.15);
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px;
          color: var(--text-muted);
          font-size: 12px;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border-medium);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-state {
          padding: 12px;
          font-size: 12px;
          color: var(--accent-danger);
          background: rgba(255, 92, 92, 0.1);
          margin: 8px;
          border-radius: var(--radius-md);
        }

        .results-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
        }

        .result-item {
          padding: 10px 12px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 100ms var(--ease-out);
        }

        .result-item:hover {
          background: var(--bg-hover);
        }

        .result-title {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .result-excerpt {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 20px;
          color: var(--text-muted);
          font-size: 12px;
        }

        .article-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .article-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .article-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 120ms var(--ease-out);
        }

        .close-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .article-thumbnail {
          padding: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .article-thumbnail img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: var(--radius-md);
        }

        .article-intro {
          padding: 12px;
          font-size: 12px;
          line-height: 1.5;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-subtle);
        }

        .article-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .article-footer {
          padding: 10px 12px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-medium);
        }

        .article-footer a {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: var(--accent-primary);
          text-decoration: none;
        }

        .article-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
