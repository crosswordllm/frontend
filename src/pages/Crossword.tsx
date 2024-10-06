import { useState, useEffect } from 'react';
import { Input } from '@mui/material';
import { Card, CardHeader, CardContent } from '@mui/material';


const CrosswordGame = () => {
    const [puzzle, setPuzzle] = useState([
        ['', '', 'C', '', ''],
        ['', '', 'R', '', ''],
        ['C', 'O', 'O', 'L', ''],
        ['', '', 'S', '', ''],
        ['', '', 'S', '', ''],
    ]);

    const [clues, setClues] = useState({
        across: {
            3: "Opposite of warm",
        },
        down: {
            2: "A puzzle type",
        },
    });

    const [userInput, setUserInput] = useState(
        puzzle.map(row => row.map(() => ''))
    );

    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        checkCompletion();
    }, [userInput]);

    const handleInputChange = (rowIndex: number, colIndex: number, value: string) => {
        const newUserInput = [...userInput];
        newUserInput[rowIndex][colIndex] = value.toUpperCase();
        setUserInput(newUserInput);
    };

    const checkCompletion = () => {
        const isCompleted = puzzle.every((row, rowIndex) =>
            row.every((cell, colIndex) =>
                cell === '' || cell === userInput[rowIndex][colIndex]
            )
        );
        setCompleted(isCompleted);
    };

    const renderPuzzle = () => {
        return puzzle.map((row, rowIndex) => (
            <div key={rowIndex} className="wordcel">
                {row.map((cell, colIndex) => (
                    <Input
                        key={`${rowIndex}-${colIndex}`}
                        type="text"
                        inputProps={{
                            maxLength: 1
                        }}
                        maxRows={1}
                        multiline={false}
                        value={userInput[rowIndex][colIndex]}
                        onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
                        className="w-10 h-10 text-center m-1"
                        disabled={cell !== ''}
                    />
                ))}
            </div>
        ));
    };

    const renderClues = () => {
        return (
            <div className="mt-4">
                <h3 className="text-lg font-semibold">Across</h3>
                {Object.entries(clues.across).map(([number, clue]) => (
                    <p key={`across-${number}`}>{number}. {clue}</p>
                ))}
                <h3 className="text-lg font-semibold mt-2">Down</h3>
                {Object.entries(clues.down).map(([number, clue]) => (
                    <p key={`down-${number}`}>{number}. {clue}</p>
                ))}
            </div>
        );
    };

    return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
            <CardHeader>Crossword Puzzle</CardHeader>
            <CardContent>
                <div className="flex flex-col items-center">
                    {renderPuzzle()}
                    {renderClues()}
                    {completed && (
                        <div className="mt-4 text-green-600 font-bold">
                            Congratulations! You've completed the puzzle!
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CrosswordGame;