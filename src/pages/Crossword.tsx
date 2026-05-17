import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './Crossword.css';
import LanguageList from '../components/LanguageList';

interface ClueItem {
    number: number;
    clue: string;
    row: number;
    col: number;
}

interface CrosswordData {
    id: string;
    theme: string;
    language: string;
    topic: string;
    createdAt: string;
    grid: string[][];
    clues: {
        across: ClueItem[];
        down: ClueItem[];
    };
}

type Dir = 'across' | 'down';
type Selected = { row: number; col: number; dir: Dir };

const API_BASE = 'https://backend-302501130751.europe-west1.run.app';

const CrosswordGame = () => {
    const [data, setData] = useState<CrosswordData | null>(null);
    const [userInput, setUserInput] = useState<string[][]>([]);
    const [selected, setSelected] = useState<Selected | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('English');
    const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    const cellNumbers = useMemo(() => {
        const nums = new Map<string, number>();
        if (data) {
            for (const cl of [...data.clues.across, ...data.clues.down]) {
                nums.set(`${cl.row},${cl.col}`, cl.number);
            }
        }
        return nums;
    }, [data]);

    const selectPuzzle = useCallback((p: CrosswordData) => {
        setData(p);
        setUserInput(p.grid.map(row => row.map(() => '')));
        setSelected(null);
        setCompleted(false);
    }, []);

    const loadList = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const r = await fetch(`${API_BASE}/api/crossword`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const list: CrosswordData[] = await r.json();
            if (list && list.length > 0) {
                selectPuzzle(list[list.length - 1]);
            } else {
                setData(null);
                setShowCreate(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'failed to load');
        } finally {
            setLoading(false);
        }
    }, [selectPuzzle]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        try {
            const r = await fetch(`${API_BASE}/api/crossword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: language || 'English',
                    topic: topic.trim(),
                }),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const p: CrosswordData = await r.json();
            selectPuzzle(p);
            setShowCreate(false);
            setTopic('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'failed to create');
        } finally {
            setCreating(false);
        }
    };

    const handleCellClick = (row: number, col: number) => {
        if (!selected || selected.row !== row || selected.col !== col) {
            setSelected(s => ({ row, col, dir: s?.dir ?? 'across' }));
        } else {
            setSelected(s => s ? { ...s, dir: s.dir === 'across' ? 'down' : 'across' } : null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
        if (!data) return;
        const dir = selected?.dir ?? 'across';

        if (e.key === 'Backspace') {
            e.preventDefault();
            const newInput = userInput.map(r => [...r]);
            if (newInput[row][col] !== '') {
                newInput[row][col] = '';
                setUserInput(newInput);
            } else {
                const { nr, nc } = move(row, col, dir, -1, data.grid);
                setSelected({ row: nr, col: nc, dir });
                inputRefs.current.get(`${nr},${nc}`)?.focus();
            }
            return;
        }

        if (e.key === 'ArrowRight') { moveFocus(row, col, 'across', 1, data.grid); return; }
        if (e.key === 'ArrowLeft') { moveFocus(row, col, 'across', -1, data.grid); return; }
        if (e.key === 'ArrowDown') { moveFocus(row, col, 'down', 1, data.grid); return; }
        if (e.key === 'ArrowUp') { moveFocus(row, col, 'down', -1, data.grid); return; }
        if (e.key === ' ' || e.key === 'Tab') {
            e.preventDefault();
            setSelected(s => s ? { ...s, dir: s.dir === 'across' ? 'down' : 'across' } : null);
        }
    };

    const moveFocus = (row: number, col: number, dir: Dir, delta: number, grid: string[][]) => {
        const { nr, nc } = move(row, col, dir, delta, grid);
        setSelected({ row: nr, col: nc, dir });
        inputRefs.current.get(`${nr},${nc}`)?.focus();
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
        if (!data) return;
        const letter = e.target.value.replace(/[^\p{L}]/gu, '').toUpperCase().slice(-1);
        const newInput = userInput.map(r => [...r]);
        newInput[row][col] = letter;
        setUserInput(newInput);

        if (letter) {
            const dir = selected?.dir ?? 'across';
            const { nr, nc } = move(row, col, dir, 1, data.grid);
            setSelected({ row: nr, col: nc, dir });
            inputRefs.current.get(`${nr},${nc}`)?.focus();
        }

        const done = data.grid.every((gridRow, r) =>
            gridRow.every((cell, c) => cell === '' || newInput[r][c] === cell)
        );
        setCompleted(done);
    };

    const isHighlighted = (row: number, col: number): boolean => {
        if (!selected || !data) return false;
        const { row: sr, col: sc, dir } = selected;
        if (dir === 'across') {
            if (row !== sr) return false;
            let start = sc, end = sc;
            while (start > 0 && data.grid[row][start - 1] !== '') start--;
            while (end < data.grid[row].length - 1 && data.grid[row][end + 1] !== '') end++;
            return col >= start && col <= end;
        } else {
            if (col !== sc) return false;
            let start = sr, end = sr;
            while (start > 0 && data.grid[start - 1][col] !== '') start--;
            while (end < data.grid.length - 1 && data.grid[end + 1][col] !== '') end++;
            return row >= start && row <= end;
        }
    };

    const activeClue = useMemo(() => {
        if (!selected || !data) return null;
        const list = selected.dir === 'across' ? data.clues.across : data.clues.down;
        return list.find(cl => isClueActive(cl, selected, data, selected.dir)) ?? null;
    }, [selected, data]);

    const rows = data?.grid.length ?? 0;
    const cols = data?.grid[0]?.length ?? 0;

    return (
        <div className="cw-page">
            <header className="cw-header">
                <h1 className="cw-title">Crossword</h1>
                <div className="cw-header-actions">
                    <button
                        className="cw-btn"
                        onClick={() => setShowCreate(s => !s)}
                        disabled={creating}
                    >
                        {showCreate ? 'Close' : '+ New Puzzle'}
                    </button>
                </div>
            </header>

            {showCreate && (
                <div className="cw-form">
                    <div className="cw-form-row">
                        <input
                            className="cw-input"
                            placeholder="Topic (optional, e.g. astronomy)"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            disabled={creating}
                        />
                    </div>
                    <div className="cw-lang-label">Language: <strong>{language}</strong></div>
                    <div className="cw-lang-picker">
                        <LanguageList
                            selected={language}
                            onSelect={lang => { if (!creating) setLanguage(lang); }}
                        />
                    </div>
                    <div className="cw-form-actions">
                        <button
                            className="cw-btn cw-btn-secondary"
                            onClick={() => setShowCreate(false)}
                            disabled={creating}
                        >
                            Cancel
                        </button>
                        <button
                            className="cw-btn"
                            onClick={handleCreate}
                            disabled={creating}
                        >
                            {creating ? 'Generating…' : 'Generate'}
                        </button>
                    </div>
                </div>
            )}

            {error && <div className="cw-error">Error: {error}</div>}

            {loading && <div className="cw-status">Loading puzzles…</div>}

            {!loading && !data && (
                <div className="cw-status">
                    No puzzles yet — tap “+ New Puzzle” to generate one.
                </div>
            )}

            {data && (
                <>
                    <p className="cw-meta">
                        <strong>{data.theme || 'Untitled'}</strong>
                        {data.topic ? ` · ${data.topic}` : ''}
                        {data.language ? ` · ${data.language}` : ''}
                    </p>

                    {completed && (
                        <div className="cw-congrats">🎉 Puzzle complete!</div>
                    )}

                    {activeClue && (
                        <div className="cw-active-clue">
                            <span className="cw-active-clue-num">
                                {activeClue.number}
                                {selected!.dir === 'across' ? 'A' : 'D'}
                            </span>
                            {activeClue.clue}
                        </div>
                    )}

                    <div className="cw-layout">
                        <div
                            className="cw-grid"
                            style={{
                                ['--cw-cols' as never]: cols,
                                ['--cw-rows' as never]: rows,
                            }}
                        >
                            {data.grid.map((row, r) =>
                                row.map((cell, c) => {
                                    if (cell === '') {
                                        return <div key={`${r},${c}`} className="cw-cell-black" />;
                                    }
                                    const num = cellNumbers.get(`${r},${c}`);
                                    const isActive = selected?.row === r && selected?.col === c;
                                    const highlight = isHighlighted(r, c);
                                    const cellClass =
                                        'cw-cell' +
                                        (isActive ? ' cw-cell-active' : highlight ? ' cw-cell-highlight' : '');
                                    return (
                                        <div
                                            key={`${r},${c}`}
                                            className={cellClass}
                                            onClick={() => handleCellClick(r, c)}
                                        >
                                            {num != null && <span className="cw-cell-num">{num}</span>}
                                            <input
                                                ref={el => {
                                                    if (el) inputRefs.current.set(`${r},${c}`, el);
                                                    else inputRefs.current.delete(`${r},${c}`);
                                                }}
                                                className="cw-cell-input"
                                                maxLength={2}
                                                value={userInput[r]?.[c] ?? ''}
                                                onChange={e => handleInput(e, r, c)}
                                                onKeyDown={e => handleKeyDown(e, r, c)}
                                                onFocus={() =>
                                                    setSelected(s => ({
                                                        row: r,
                                                        col: c,
                                                        dir: s?.dir ?? 'across',
                                                    }))
                                                }
                                                inputMode="text"
                                                autoCapitalize="characters"
                                                autoCorrect="off"
                                                autoComplete="off"
                                                spellCheck={false}
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="cw-clues">
                            <div className="cw-clue-col">
                                <h3>Across</h3>
                                {data.clues.across.map(cl => {
                                    const active =
                                        selected?.dir === 'across' &&
                                        isClueActive(cl, selected, data, 'across');
                                    return (
                                        <p
                                            key={cl.number}
                                            className={'cw-clue' + (active ? ' cw-clue-active' : '')}
                                            onClick={() => {
                                                setSelected({ row: cl.row, col: cl.col, dir: 'across' });
                                                inputRefs.current.get(`${cl.row},${cl.col}`)?.focus();
                                            }}
                                        >
                                            <span className="cw-clue-num">{cl.number}.</span>
                                            {cl.clue}
                                        </p>
                                    );
                                })}
                            </div>
                            <div className="cw-clue-col">
                                <h3>Down</h3>
                                {data.clues.down.map(cl => {
                                    const active =
                                        selected?.dir === 'down' &&
                                        isClueActive(cl, selected, data, 'down');
                                    return (
                                        <p
                                            key={cl.number}
                                            className={'cw-clue' + (active ? ' cw-clue-active' : '')}
                                            onClick={() => {
                                                setSelected({ row: cl.row, col: cl.col, dir: 'down' });
                                                inputRefs.current.get(`${cl.row},${cl.col}`)?.focus();
                                            }}
                                        >
                                            <span className="cw-clue-num">{cl.number}.</span>
                                            {cl.clue}
                                        </p>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

function move(row: number, col: number, dir: Dir, delta: number, grid: string[][]): { nr: number; nc: number } {
    let nr = row + (dir === 'down' ? delta : 0);
    let nc = col + (dir === 'across' ? delta : 0);
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    nr = Math.max(0, Math.min(rows - 1, nr));
    nc = Math.max(0, Math.min(cols - 1, nc));
    if (grid[nr][nc] === '') return { nr: row, nc: col };
    return { nr, nc };
}

function isClueActive(
    cl: ClueItem,
    selected: Selected | null,
    data: CrosswordData,
    dir: Dir
): boolean {
    if (!selected) return false;
    const { row: sr, col: sc } = selected;
    if (dir === 'across') {
        if (sr !== cl.row) return false;
        let start = sc;
        while (start > 0 && data.grid[sr][start - 1] !== '') start--;
        return start === cl.col;
    } else {
        if (sc !== cl.col) return false;
        let start = sr;
        while (start > 0 && data.grid[start - 1][sc] !== '') start--;
        return start === cl.row;
    }
}

export default CrosswordGame;
