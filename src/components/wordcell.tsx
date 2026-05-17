import "./wordcell.css"
import { Input } from '@mui/material';

interface WordcellProps {
    wordIndex: number;
    letterIndex: number;
    value: string;
}

const Wordcell = ({ wordIndex, letterIndex, value }: WordcellProps) => {
    return <div className="wordcel">
        <Input
            key={`${wordIndex}-${letterIndex}`}
            type="text"
            inputProps={{
                maxLength: 1
            }}
            maxRows={1}
            multiline={false}
            value={value}
            className="w-10 h-10 text-center m-1"
        />
    </div>
}

export default Wordcell;