import { useState, useCallback, useEffect, useRef } from 'react'
import { WikiArticle, WikiSearchResult, WikiState } from '@/types/wiki'
import { searchWiki, fetchArticle } from '@/services/wikiService'

interface WikiPanelProps {
  initialQuery?: string
}

export function WikiPanel({ initialQuery }: WikiPanelProps) {
  const [state, setState] = useState<WikiState>({
    searchQuery: initialQuery || '',
    currentArticle: null,
    searchResults: null,
    isLoading: false,
    error: null,
  })
  const [htmlContent, setHtmlContent] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialSearchDone = useRef(false)

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
    if (initialQuery && !initialSearchDone.current) {
      initialSearchDone.current = true
      handleSearch(initialQuery)
    }
  }, [initialQuery, handleSearch])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (contentRef.current && htmlContent) {
      const style = document.createElement('style')
      style.textContent = `
        .wiki-content { font-size: 13px; line-height: 1.6; }
        .wiki-content h2 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(148,163,184,0.2); }
        .wiki-content h3 { font-size: 14px; font-weight: 600; margin: 12px 0 6px; }
        .wiki-content p { margin: 6px 0; }
        .wiki-content ul, .wiki-content ol { padding-left: 20px; margin: 6px 0; }
        .wiki-content li { margin: 3px 0; }
        .wiki-content a { color: var(--color-accent-diamond); text-decoration: none; }
        .wiki-content a:hover { text-decoration: underline; }
        .wiki-content img { max-width: 100%; height: auto; border-radius: 4px; }
        .wiki-content table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
        .wiki-content th, .wiki-content td { padding: 6px 8px; border: 1px solid rgba(148,163,184,0.15); text-align: left; }
        .wiki-content th { background: rgba(74,222,128,0.1); font-weight: 600; }
        .wiki-content code { background: rgba(148,163,184,0.1); padding: 2px 4px; border-radius: 3px; font-family: var(--font-mono); font-size: 11px; }
        .wiki-content pre { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; overflow-x: auto; }
        .wiki-content .infobox { float: right; margin: 0 0 10px 10px; background: var(--color-bg-elevated); border: 1px solid var(--color-border-strong); border-radius: 6px; padding: 10px; max-width: 200px; }
      `
      contentRef.current.innerHTML = htmlContent
      contentRef.current.insertBefore(style, contentRef.current.firstChild)
    }
  }, [htmlContent])

  return (
    <div className="flex flex-col flex-shrink-0 border-l" style={{
      width: 'var(--sidebar-width)',
      background: 'var(--color-bg-surface)',
      borderColor: 'var(--color-border)'
    }}>
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <div className="text-sm font-display font-bold tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
          📖 Minecraft Wiki
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          实时查阅百科
        </div>
      </div>

      <div className="px-3 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <input
          type="text"
          placeholder="搜索 Wiki..."
          value={state.searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="input-search"
        />
      </div>

      {state.isLoading && (
        <div className="py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
          <div className="text-xs animate-pulse">加载中...</div>
        </div>
      )}

      {state.error && (
        <div className="p-3 text-xs text-red-400">{state.error}</div>
      )}

      {!state.currentArticle && state.searchResults && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {state.searchResults.results.length === 0 && !state.isLoading && (
            <div className="py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-xs">没有找到相关条目</div>
            </div>
          )}
          {state.searchResults.results.map((result, i) => (
            <div
              key={i}
              onClick={() => handleSelectArticle(result)}
              className="block-item cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="block-name truncate">{result.title.replace(/_/g, ' ')}</div>
                <div className="block-name-en truncate">{result.extract.substring(0, 80)}...</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!state.currentArticle && !state.searchResults && !state.isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center px-4" style={{ color: 'var(--color-text-muted)' }}>
          <div className="text-4xl mb-3">📚</div>
          <div className="text-xs text-center leading-relaxed">
            搜索方块、物品、生物等信息<br />
            点击搜索结果查看详细内容
          </div>
        </div>
      )}

      {state.currentArticle && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-3 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>
                {state.currentArticle.title.replace(/_/g, ' ')}
              </div>
              <button
                onClick={() => {
                  setState(prev => ({ ...prev, currentArticle: null, searchResults: null }))
                  setHtmlContent('')
                }}
                className="text-[10px] px-2 py-0.5 rounded ml-2 flex-shrink-0"
                style={{
                  background: 'var(--color-bg-hover)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {state.currentArticle.thumbnail && (
            <div className="px-3 py-2 flex-shrink-0">
              <img
                src={state.currentArticle.thumbnail}
                alt={state.currentArticle.title}
                className="w-full h-auto rounded-md"
                style={{ maxHeight: '120px', objectFit: 'contain' }}
              />
            </div>
          )}

          {state.currentArticle.extract && (
            <div className="px-3 py-2 flex-shrink-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {state.currentArticle.extract}
              </div>
            </div>
          )}

          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-3 py-3 wiki-content"
            style={{ color: 'var(--color-text-primary)' }}
          />

          <div className="px-3 py-2 border-t flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            <a
              href={state.currentArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] block text-center"
              style={{ color: 'var(--color-accent-diamond)' }}
            >
              🔗 在 Minecraft Wiki 中查看原文
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
