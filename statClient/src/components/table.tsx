import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Divider } from '@mui/material';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const baseURL = process.env.REACT_APP_API_URL || 'https://4ssoluciones.com/album_stats'

interface IData {

  // define la estructura de los datos que esperas recibir de la API
  started_on: number,
  number_errors: number,
  total_latency: number,
  finished: boolean,
  answered: number,
  errors: number,
  rank: number,
  album_id: string,
}

export default function BasicTable() {
  const [selectedDate, setSelectedDate] = useState('');
  
const handleDateChange = (date: any) => {
  setSelectedDate(date);
  if (date) {
    const partes = new Date(date).toLocaleDateString('es-ES').split('/');
    if (partes.length === 3) {
      const dd = partes[0];
      const mm = partes[1];
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

  // Hooks for query data from server API
  const [data, setData] = useState<IData[]>([]);
  useEffect(() => {
    getRanking();
  }, []);

  useEffect(() => {
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
    }

  return (
    <TableContainer component={Paper}>
      <Toolbar sx={{
        border: '5px solid white',
      }}>

        <Typography
          sx={{
            flex: '1 1 100%',
            display: 'flex',
            width: 'fit-content',
            border: (theme) => `1px solid white`,
            borderRadius: 1,
          }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Tabla de Clasificación
        </Typography>

        <Tooltip title="Filtrar por fecha" sx={{
          alignItems: 'center',
        }}>
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
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Posición</TableCell>
            <TableCell>Album Id</TableCell>
            <TableCell align="right">Número de errores</TableCell>
            <TableCell align="right">Preguntas respondidas</TableCell>
            <TableCell align="right">Album finalizado</TableCell>
            <TableCell align="right">Tiempo total de respuesta (Segundos)</TableCell>
            <TableCell align="right">Porcentaje de error (%)  </TableCell>
            <TableCell align="right">Fecha y Hora de Inicio</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.album_id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell>{row.rank}</TableCell>
              <TableCell align="right" >
                {row.album_id.slice(-5)}
              </TableCell>
              <TableCell align="right">{row.number_errors}</TableCell>
              <TableCell align="right">{row.answered}</TableCell>
              <TableCell align="right">{row.finished ? "Sí" : "No"}</TableCell>
              <TableCell align="right">{Math.round(row.total_latency)}</TableCell>
              <TableCell align="right">{Math.round(row.errors * 100)} % </TableCell>
              <TableCell align="right">{new Date(row.started_on).toLocaleString()}</TableCell>


            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
