import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import InputAdornment from '@mui/material/InputAdornment';
import Modal from '@mui/material/Modal';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, useEffect, ChangeEvent } from 'react';
import { useDebouncedCallback } from '../../utils/debounceHelper';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

interface ChatSettingsModalProps {
  userChatDelay: number;
  setUserChatDelay: (v: number) => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  showTimestamp: boolean;
  setShowTimestamp: (v: boolean) => void;
  chatWidth: number | undefined;
  setChatWidth: (v: number | undefined) => void;
}

export default function ChatSettingsModal(props: ChatSettingsModalProps) {
  const {
    userChatDelay,
    setUserChatDelay,
    showModal,
    setShowModal,
    showTimestamp,
    setShowTimestamp,
    chatWidth,
    setChatWidth,
  } = props;
  const [filterWords, setFilterWords] = useState<string[]>([]);

  useEffect(() => {
    if (showModal) {
      const savedSettings = safeLocalStorage.getItem('chatSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (settings.filterWords && Array.isArray(settings.filterWords)) {
            setFilterWords(settings.filterWords as string[]);
          }
        } catch (e) {
          console.error('Failed to parse chat settings from localStorage', e);
        }
      }
    }
  }, [showModal]);

  const debouncedDelayChange = useDebouncedCallback((value: unknown) => {
    if (!isNaN(Number(value))) {
      setUserChatDelay(Number(value));
    }
  }, 300);

  const saveSetting = (key: string, value: unknown) => {
    const savedSettings = safeLocalStorage.getItem('chatSettings');
    let settings: Record<string, unknown> = {};
    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings);
      } catch (e) {
        console.error('Failed to parse chat settings from localStorage', e);
      }
    }
    settings[key] = value;
    safeLocalStorage.setItem('chatSettings', JSON.stringify(settings));
  };

  const debouncedSaveSetting = useDebouncedCallback((...args: unknown[]) => {
    saveSetting(args[0] as string, args[1]);
  }, 500);

  const handleAddWord = () => {
    const input = document.getElementById('filter-word-input') as HTMLInputElement | null;
    if (!input) return;
    const word = input.value.trim();
    if (word && !filterWords.includes(word)) {
      setFilterWords([...filterWords, word]);
      debouncedSaveSetting('filterWords', [...filterWords, word]);
      input.value = '';
    }
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setFilterWords(filterWords.filter((word) => word !== wordToRemove));
    debouncedSaveSetting(
      'filterWords',
      filterWords.filter((word) => word !== wordToRemove)
    );
  };

  return (
    <Modal open={showModal} onClose={() => setShowModal(false)}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 350,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6">Chat Settings</Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="start">secs</InputAdornment>,
                },
              }}
              fullWidth
              label="Chat Delay"
              size="small"
              value={userChatDelay}
              onChange={(evt: ChangeEvent<HTMLInputElement>) => debouncedDelayChange(evt.target.value)}
              onFocus={(evt: React.FocusEvent<HTMLInputElement>) => evt.target.select()}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Chat Width
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Slider
                disabled={typeof window !== 'undefined' && window.innerWidth - 400 <= 150}
                value={chatWidth}
                onChange={(e: Event, newValue: number | number[]) => {
                  const num = typeof newValue === 'number' ? newValue : undefined;
                  setChatWidth(num);
                  debouncedSaveSetting('chatWidth', num);
                }}
                min={150}
                max={typeof window !== 'undefined' ? Math.min(window.innerWidth - 400, 800) : 800}
                step={10}
                valueLabelDisplay="auto"
                valueLabelFormat={(value: number) => `${value}px`}
                sx={{ width: '100%' }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Filter Words
            </Typography>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <TextField
                id="filter-word-input"
                fullWidth
                label="Add word to filter"
                size="small"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddWord()}
              />
              <Button variant="outlined" sx={{ ml: 1 }} onClick={handleAddWord}>
                Add
              </Button>
            </Box>
            <Box sx={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', p: 1, borderRadius: 1 }}>
              {filterWords.length > 0 ? (
                filterWords.map((word, index) => (
                  <Box
                    key={index}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
                  >
                    <Typography variant="body2">{word}</Typography>
                    <Button size="small" color="error" onClick={() => handleRemoveWord(word)}>
                      Remove
                    </Button>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No filter words added
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <FormGroup sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showTimestamp}
                onChange={() => {
                  setShowTimestamp(!showTimestamp);
                  debouncedSaveSetting('showTimestamp', !showTimestamp);
                }}
              />
            }
            label="Show Timestamps"
          />
        </FormGroup>
      </Box>
    </Modal>
  );
}
