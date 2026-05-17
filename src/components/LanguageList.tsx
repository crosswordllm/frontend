import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';

export const LANGUAGES = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Dutch',
    'Polish',
    'Russian',
    'Swedish',
    'Norwegian',
    'Finnish',
    'Danish',
    'Czech',
    'Greek',
    'Turkish',
    'Arabic',
    'Hebrew',
    'Hindi',
    'Japanese',
    'Korean',
    'Chinese',
] as const;

export type Language = (typeof LANGUAGES)[number];

interface LanguageListProps {
    languages?: readonly string[];
    selected?: string;
    onSelect?: (language: string) => void;
}

const LanguageList = ({ languages = LANGUAGES, selected, onSelect }: LanguageListProps) => {
    return (
        <List dense aria-label="languages">
            {languages.map(lang => (
                <ListItem key={lang} disablePadding>
                    <ListItemButton
                        selected={selected === lang}
                        onClick={() => onSelect?.(lang)}
                    >
                        <ListItemText primary={lang} />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    );
};

export default LanguageList;
