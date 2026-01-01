import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { products, type Product } from '../data/products';

interface SearchResult {
    type: 'code' | 'name' | 'house' | 'category' | 'line';
    value: string;
    product?: Product;
}

interface SearchBarProps {
    variant?: 'header' | 'catalog';
    onSearch?: (query: string) => void;
    onFilterApply?: (type: string, value: string) => void;
}

export default function SearchBar({ variant = 'header', onSearch, onFilterApply }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchProducts = (searchQuery: string): SearchResult[] => {
        if (!searchQuery.trim()) return [];

        const q = searchQuery.toLowerCase();
        const results: SearchResult[] = [];
        const seen = new Set<string>();

        // Search by code
        products.forEach((p) => {
            if (p.code.toLowerCase().includes(q)) {
                const key = `code-${p.code}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push({ type: 'code', value: p.code, product: p });
                }
            }
        });

        // Search by name
        products.forEach((p) => {
            if (p.inspiredByName.toLowerCase().includes(q)) {
                const key = `name-${p.inspiredByName}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push({ type: 'name', value: p.inspiredByName, product: p });
                }
            }
        });

        // Search by house
        const houses = [...new Set(products.map((p) => p.house))];
        houses.forEach((house) => {
            if (house.toLowerCase().includes(q)) {
                const key = `house-${house}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push({ type: 'house', value: house });
                }
            }
        });

        // Search by category
        const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];
        categories.forEach((cat) => {
            if (cat.toLowerCase().includes(q)) {
                const key = `category-${cat}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push({ type: 'category', value: cat });
                }
            }
        });

        // Search by line
        const lines = ['FM', 'HM', 'UM'];
        lines.forEach((line) => {
            if (line.toLowerCase().includes(q)) {
                const key = `line-${line}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push({ type: 'line', value: line });
                }
            }
        });

        return results.slice(0, 10);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setResults(searchProducts(value));
        setIsOpen(true);
        onSearch?.(value);
    };

    const handleResultClick = (result: SearchResult) => {
        setQuery('');
        setIsOpen(false);

        if (result.type === 'code' && result.product) {
            navigate(`/producto/${encodeURIComponent(result.product.code)}`);
        } else {
            // Navigate to catalog with filter
            const params = new URLSearchParams();
            if (result.type === 'house') params.set('house', result.value);
            if (result.type === 'category') params.set('category', result.value);
            if (result.type === 'line') params.set('line', result.value);
            if (result.type === 'name') params.set('q', result.value);

            navigate(`/catalogo?${params.toString()}`);
            onFilterApply?.(result.type, result.value);
        }
    };

    const getTypeLabel = (type: SearchResult['type']) => {
        const labels = {
            code: 'Codigo',
            name: 'Nombre',
            house: 'Casa',
            category: 'Categoria',
            line: 'Linea',
        };
        return labels[type];
    };

    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.type]) acc[result.type] = [];
        acc[result.type].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Buscar por codigo, nombre, marca..."
                    className={`
            w-full pl-10 pr-4 py-2.5 bg-surface-light border border-border rounded-lg
            text-white placeholder:text-white/40 text-sm
            transition-all duration-200
            focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none
            ${variant === 'catalog' ? 'py-3 text-base' : ''}
          `}
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            onSearch?.('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-light border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {Object.entries(groupedResults).map(([type, items]) => (
                        <div key={type}>
                            <div className="px-4 py-2 text-xs font-semibold text-gold uppercase tracking-wider bg-surface">
                                {getTypeLabel(type as SearchResult['type'])}
                            </div>
                            {items.map((result, idx) => (
                                <button
                                    key={`${type}-${idx}`}
                                    onClick={() => handleResultClick(result)}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                                >
                                    {result.type === 'code' && result.product ? (
                                        <>
                                            <span className="text-gold font-mono font-semibold">{result.value}</span>
                                            <span className="text-white/60">-</span>
                                            <span className="text-white">{result.product.inspiredByName}</span>
                                            <span className="text-white/40 text-sm ml-auto">{result.product.house}</span>
                                        </>
                                    ) : result.type === 'name' && result.product ? (
                                        <>
                                            <span className="text-white">{result.value}</span>
                                            <span className="text-white/40 text-sm ml-auto">{result.product.house}</span>
                                        </>
                                    ) : (
                                        <span className="text-white">{result.value}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
