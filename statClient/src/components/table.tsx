import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
  Paper,
  Tooltip,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  LocalizationProvider,
  DatePicker
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUser  } from '@fortawesome/free-solid-svg-icons';
const baseURL = process.env.REACT_APP_API_URL || 'https://4ssoluciones.com/album_stats';

interface IData {
  is_group:number;
  group_id:string;
  is_leader:number;
  player_name: string;
  team : string;
  started_on: number;
  ended_on: number | string;
  number_errors: number;
  total_latency: number;
  finished: boolean;
  answered: number;
  errors: number;
  rank: number;
  album_id: string;
}

export default function BasicTable() {
  const [selectedDate, setSelectedDate] = useState('');
  const [data, setData] = useState<IData[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [selectedMode, setSelectedMode] = useState('general'); 

  useEffect(() => {
    getRanking();
  }, []);

  useEffect(() => {
    const handleDateChange = (date: any) => {
      setSelectedDate(date);
      if (date) {
        const partes = new Date(date).toLocaleDateString('es-ES').split('/');
        if (partes.length === 3) {
          const dd = String(partes[0]).padStart(2, '0');
          const mm = String(partes[1]).padStart(2, '0');
          const yyyy = partes[2];
          const fechaFormateada = `${dd}/${mm}/${yyyy}`;

          axios
            .get(`${baseURL}/ranking?date=${fechaFormateada}`)
            .then((res) => {
              setData(res.data.data);
            })
            .catch((error) => {
              console.log('Error Fecha', error);
            });
        } else {
          console.log('Fecha no válida');
        }
      } else {
        getRanking();
      }
    };
    handleDateChange(selectedDate);
  }, [selectedDate]);

  const getRanking = () => {
    axios
      .get(`${baseURL}/ranking`)
      .then((res) => {
        setData(res.data.data);
      })
      .catch((error) => {
        console.log("Error Efect: " + error);
      });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof IData];
        let bValue = b[sortConfig.key as keyof IData];
        if (sortConfig.key === 'finished') {
          aValue = a.finished ? 1 : 0;
          bValue = b.finished ? 1 : 0;
        }
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }


    return sortableData;
  }, [data, sortConfig]);

  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode !== null) {
      setSelectedMode(newMode);
    }
  };

  return (

    <TableContainer component={Paper}>
      <Toolbar
  sx={{
    border: '5px solid white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }}
>

  <Typography
    sx={{
      display: 'flex',
      width: 'fit-content',
      border: (theme) => `1px solid white`,
      borderRadius: 1,
    }}
    variant="h6"
    id="tableTitle"
    component="div"
  >
    <h3>
      Tabla de Clasificación
    </h3>
  </Typography>

  <ToggleButtonGroup
    value={selectedMode}
    exclusive
    onChange={handleModeChange}
    aria-label="gameMode"
    size="medium"
    sx={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}
    
  >
    <ToggleButton value="general" aria-label="solo">
      <div className="languageToggle">
        <i className="fas fa-user"> General</i>
      </div>
    </ToggleButton>
    <ToggleButton value="alone" aria-label="solo">
      <div className="languageToggle">
        <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#555' }} />
        <i className="fas fa-user"> Invividual</i>
      </div>
    </ToggleButton>
    <ToggleButton value="group" aria-label="cooperative">
      <div className="languageToggle">
        <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px', color: '#555' }} />
        <i className="fas fa-users"> Equipo</i>
      </div>
    </ToggleButton>
  </ToggleButtonGroup>

  <Tooltip
    title="Filtrar por fecha"
    sx={{
      display: 'flex',
      alignItems: 'center',
    }}
  >
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={['DatePicker']}>
        <DemoItem>
          <DatePicker
            value={selectedDate}
            onAccept={(event) => setSelectedDate(event as string)}
            format="DD/MM/YYYY"
            views={['year', 'month', 'day']}
          />
        </DemoItem>
      </DemoContainer>
    </LocalizationProvider>
  </Tooltip>
</Toolbar>


      <Divider></Divider>
      <h3  style={{ textAlign: 'center' }} >
      {selectedMode === 'general' && (
        <>
          Resultados Generales
        </>
      )}

      {selectedMode === 'group' && (
        <>
          <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px', color: '#555' }} />
            Resultados Grupales
        </>
      )}

      {selectedMode === 'alone' && (
        <>
          <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#555' }} />
            Resultados Individuales
        </>
      )}
      </h3>
      <Divider></Divider>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Posición</TableCell>
            <TableCell>
                        Jugador
            </TableCell>
            <TableCell align="center">Número de errores</TableCell>
            <TableCell align="center">Preguntas respondidas</TableCell>
            <TableCell align="center"onClick={() => handleSort('finished')} >
              Album finalizado
              </TableCell>
            {/* <TableCell align="right" onClick={() => handleSort('total_latency')}> */}
            <TableCell align="center">
              Tiempo total de respuesta (Segundos)
            </TableCell>
            <TableCell align="center" onClick={() => handleSort('errors')}>
              Porcentaje de error (%)
            </TableCell>
            <TableCell align="center">Fecha y Hora de Inicio</TableCell>
            {/* <TableCell align="right">Fecha y Hora de finalizacion</TableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>
  {sortedData
    .filter((row) => {
      if (selectedMode === 'general') return true; // Muestra todos los datos
      if (selectedMode === 'group' && row.is_group === 1) return true; // Solo los grupos en modo 'group'
      if (selectedMode === 'alone' && row.is_group === 0) return true; // Solo los individuales en modo 'individual'
      return false; // No mostrar otros casos
    })
    .map((row, index) => (
      <TableRow
        key={row.album_id}
        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
      >
        <TableCell>
          {/* Renumeración dinámica solo en vistas 'group' e 'individual' */}
          {selectedMode !== 'general' ? index + 1 : row.rank}
        </TableCell> {/* Aquí asignamos la posición dinámica */}
        
        <TableCell align="left">
          {selectedMode === 'general' && (
            <>
              {row.is_group === 1 ? (
                <>
                  <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px', color: '#555' }} />
                  {row.player_name}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#555' }} />
                  {row.player_name}
                </>
              )}
            </>
          )}
          {selectedMode === 'group' && row.is_group === 1 && (
            <>
              <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px', color: '#555' }} />
              {row.player_name}
            </>
          )}
          {selectedMode === 'alone' && row.is_group === 0 && (
            <>
              <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#555' }} />
              {row.player_name}
            </>
          )}
        </TableCell>
        <TableCell align="center">{row.number_errors}</TableCell>
        <TableCell align="center">{row.answered}</TableCell>
        <TableCell align="center">{row.finished ? "Si" : "No"}</TableCell>
        <TableCell align="center">{Math.round(row.total_latency)}</TableCell>
        <TableCell align="center">{Math.round(row.errors * 100)} %</TableCell>
        <TableCell align="center">{new Date(row.started_on).toLocaleString()}</TableCell>
      </TableRow>
    ))}
</TableBody>
      </Table>
    </TableContainer>
  );
}
