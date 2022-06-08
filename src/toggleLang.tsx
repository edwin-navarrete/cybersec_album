import * as React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export default function ToggleLang() {
  const [alignment, setAlignment] = React.useState<string | null>('left');

  const handleAlignment = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string | null,
  ) => {
    setAlignment(newAlignment);
  };

  return (
    <ToggleButtonGroup
      value={alignment}
      exclusive
      onChange={handleAlignment}
      aria-label="language"
      size="small"
    >
      <ToggleButton value="es" aria-label="left aligned">
        Español
      </ToggleButton>
      <ToggleButton value="en" aria-label="centered">
        English
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
