import CrossWordGame from "../services/crossword/crossword";
import "./wordcell.css"
import { Input } from '@mui/material';


const Wordcell = (wordIndex: number, letterIndex: number, game: CrossWordGame) => {
    return <div key={wordIndex} className="wordcel">
        <Input
            key={`${wordIndex}-${letterIndex}`}
            type="text"
            inputProps={{
                maxLength: 1
            }}
            maxRows={1}
            multiline={false}
            value={game.getUserInputByCoordenates(wordIndex, letterIndex)}
            //onChange={(e) => handleInputChange(index, colIndex, e.target.value)}
            className="w-10 h-10 text-center m-1"
            //disabled={char !== ''}
        />
    </div>
}

export default Wordcell;