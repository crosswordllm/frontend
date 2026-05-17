import { useState, useEffect, useRef } from 'react';

interface ClueItem {
    number: number;
    clue: string;
    row: number;
    col: number;
}

interface CrosswordData {
    theme: string;
    date: string;
    grid: string[][];
    clues: {
        across: ClueItem[];
        down: ClueItem[];
    };
}

const CELL_SIZE = 44;

const CrosswordGame = () => {
    const [data, setData] = useState<CrosswordData | null>(null);
    const [userInput, setUserInput] = useState<string[][]>([]);
    const [selected, setSelected] = useState<{ row: number; col: number; dir: 'across' | 'down' } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);
    const cellNumbers = useRef<Map<string, number>>(new Map());
    const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    useEffect(() => {
        fetch('/api/crossword')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((d: CrosswordData) => {
                setData(d);
                setUserInput(d.grid.map(row => row.map(() => '')));

                const nums = new Map<string, number>();
                for (const cl of [...d.clues.across, ...d.clues.down]) {
                    nums.set(`${cl.row},${cl.col}`, cl.number);
                }
                cellNumbers.current = nums;
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const handleCellClick = (row: number, col: number) => {
        if (!selected || selected.row !== row || selected.col !== col) {
            setSelected({ row, col, dir: 'across' });
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
                // Move backward
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
    };

    const moveFocus = (row: number, col: number, dir: 'across' | 'down', delta: number, grid: string[][]) => {
        const { nr, nc } = move(row, col, dir, delta, grid);
        setSelected({ row: nr, col: nc, dir });
        inputRefs.current.get(`${nr},${nc}`)?.focus();
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
        if (!data) return;
        const letter = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(-1);
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
            // Find start and end of this across word
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

    if (loading) return <div style={styles.center}>Generating today's puzzle…</div>;
    if (error) return <div style={styles.center}>Error: {error}</div>;
    if (!data) return null;

    const rows = data.grid.length;
    const cols = data.grid[0]?.length ?? 0;

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>Daily Crossword</h1>
            <p style={styles.meta}>{data.date} · <em>{data.theme}</em></p>

            {completed && (
                <div style={styles.congrats}>🎉 Puzzle complete!</div>
            )}

            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
                    gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
                    border: '2px solid #222',
                }}>
                    {data.grid.map((row, r) =>
                        row.map((cell, c) => {
                            const num = cellNumbers.current.get(`${r},${c}`);
                            const isActive = selected?.row === r && selected?.col === c;
                            const highlight = isHighlighted(r, c);

                            if (cell === '') {
                                return <div key={`${r},${c}`} style={styles.blackCell} />;
                            }

                            return (
                                <div
                                    key={`${r},${c}`}
                                    style={{
                                        ...styles.whiteCell,
                                        background: isActive ? '#fde68a' : highlight ? '#bfdbfe' : '#fff',
                                    }}
                                    onClick={() => handleCellClick(r, c)}
                                >
                                    {num != null && <span style={styles.cellNum}>{num}</span>}
                                    <input
                                        ref={el => {
                                            if (el) inputRefs.current.set(`${r},${c}`, el);
                                            else inputRefs.current.delete(`${r},${c}`);
                                        }}
                                        style={styles.cellInput}
                                        maxLength={2}
                                        value={userInput[r]?.[c] ?? ''}
                                        onChange={e => handleInput(e, r, c)}
                                        onKeyDown={e => handleKeyDown(e, r, c)}
                                        onFocus={() => setSelected(s => ({ row: r, col: c, dir: s?.dir ?? 'across' }))}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Clues */}
                <div style={styles.clues}>
                    <div style={styles.clueCol}>
                        <h3 style={styles.clueHeader}>Across</h3>
                        {data.clues.across.map(cl => (
                            <p
                                key={cl.number}
                                style={{
                                    ...styles.clueItem,
                                    fontWeight: selected?.dir === 'across' && isClueActive(cl, selected, data, 'across') ? 700 : 400,
                                }}
                                onClick={() => {
                                    setSelected({ row: cl.row, col: cl.col, dir: 'across' });
                                    inputRefs.current.get(`${cl.row},${cl.col}`)?.focus();
                                }}
                            >
                                <strong>{cl.number}.</strong> {cl.clue}
                            </p>
                        ))}
                    </div>
                    <div style={styles.clueCol}>
                        <h3 style={styles.clueHeader}>Down</h3>
                        {data.clues.down.map(cl => (
                            <p
                                key={cl.number}
                                style={{
                                    ...styles.clueItem,
                                    fontWeight: selected?.dir === 'down' && isClueActive(cl, selected, data, 'down') ? 700 : 400,
                                }}
                                onClick={() => {
                                    setSelected({ row: cl.row, col: cl.col, dir: 'down' });
                                    inputRefs.current.get(`${cl.row},${cl.col}`)?.focus();
                                }}
                            >
                                <strong>{cl.number}.</strong> {cl.clue}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

function move(row: number, col: number, dir: 'across' | 'down', delta: number, grid: string[][]): { nr: number; nc: number } {
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
    selected: { row: number; col: number; dir: 'across' | 'down' } | null,
    data: CrosswordData,
    dir: 'across' | 'down'
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

const styles: Record<string, React.CSSProperties> = {
    page: { fontFamily: 'Georgia, serif', maxWidth: 960, margin: '0 auto', padding: 24 },
    title: { textAlign: 'center', fontSize: 28, marginBottom: 4 },
    meta: { textAlign: 'center', color: '#555', marginBottom: 20 },
    center: { textAlign: 'center', padding: 60, fontSize: 18 },
    congrats: { textAlign: 'center', color: '#16a34a', fontWeight: 'bold', fontSize: 20, marginBottom: 16 },
    blackCell: { width: CELL_SIZE, height: CELL_SIZE, background: '#222', border: '1px solid #111' },
    whiteCell: {
        width: CELL_SIZE, height: CELL_SIZE,
        border: '1px solid #999',
        position: 'relative',
        cursor: 'pointer',
    },
    cellNum: {
        position: 'absolute', top: 2, left: 3,
        fontSize: 10, lineHeight: 1, color: '#333', pointerEvents: 'none',
    },
    cellInput: {
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        border: 'none', background: 'transparent',
        textAlign: 'center', fontSize: 18, fontWeight: 'bold',
        textTransform: 'uppercase', outline: 'none',
        paddingTop: 8, cursor: 'pointer',
        fontFamily: 'Georgia, serif',
    },
    clues: { display: 'flex', gap: 32 },
    clueCol: { minWidth: 200, maxWidth: 280 },
    clueHeader: { borderBottom: '2px solid #222', paddingBottom: 4, marginBottom: 8 },
    clueItem: { fontSize: 14, lineHeight: 1.5, margin: '4px 0', cursor: 'pointer' },
};

export default CrosswordGame;
