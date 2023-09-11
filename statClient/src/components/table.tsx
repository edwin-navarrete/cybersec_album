import { Divider } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const baseURL = process.env.REACT_APP_API_URL || 'https://4ssoluciones.com/album_stats'
const today = dayjs();


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

  const [selectedDate, setSelectedDate] = useState(today);

  const handleDateChange = (date: any) => {
    setSelectedDate(date)
    console.log('fecha entrada: ',date);
    console.log('estado: ',selectedDate)
    axios
      .get(`${baseURL}/ranking?date=${new Date(date.valueOf()).toLocaleDateString('es-ES')}`)//Url api server
      .then((res) => {
        setData(res.data.data);
        console.log(new Date(date.valueOf()).toLocaleDateString('es-ES'));


      })
      .catch((error) => {
        console.log('Error Fecha',error);
      });

  };

  // Hooks for query data from server API
  const [data, setData] = useState<IData[]>([]);

  useEffect(() => {
    getRanking();

  }, []);

    const getRanking = () => {
      axios
      .get(`${baseURL}/ranking`)
      .then((res) => {
        setData(res.data.data);
        console.log("Example:" + new Date(selectedDate.valueOf()).toLocaleDateString('es-ES'));

        console.log(data.valueOf().toLocaleString());


      })
      .catch((error) => {
        console.log("Error Efect: " + error);
      });
    }

    const handleButtonClick = () => {
      setSelectedDate(today);
      getRanking();

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
              onChange={(event) => handleDateChange(event)}
              format="DD/MM/YYYY"
              views={['year', 'month', 'day']}
            />
              <button onClick={handleButtonClick}>Click Me</button>
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
