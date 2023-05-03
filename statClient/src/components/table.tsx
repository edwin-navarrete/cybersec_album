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
import useSort from '../hooks/useSort';
import { Divider } from '@mui/material';
import dayjs from 'dayjs';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';


const today = dayjs();
//

interface IData {

  // define la estructura de los datos que esperas recibir de la API
  album_id: string; // En 
  error_number: number;
  answered_question_number: number;
  ended_album: string;
  error_percentage: number;
  total_response_time: number;
  epocas: number;

}


export default function BasicTable() {

  const [selectedDate, setSelectedDate] = useState(today);

  const handleDateChange = (date: any) => {
    setSelectedDate(date);
  };

  // Hooks for query data from server API 
  const [data, setData] = useState<IData[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:8001/user")//Url api server
      .then((res) => {
        setData(res.data.data);

      })
      .catch((error) => {
        console.log(error);
      });

  }, []);

  //Use of hook useSort to 
  const dataSorted = useSort(data);
  // console.log(dataSorted)

  // Filter data to show only rows with matching dates
  const filteredData = data.filter(row => {
    const rowDate = dayjs(row.epocas);
    if (selectedDate == today) {
      return rowDate
    }
    else {

      return rowDate.isSame(selectedDate, 'day');
    }
  });
  ;

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
                  onChange={handleDateChange}
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
            <TableCell>Album Id</TableCell>
            <TableCell align="right">Número de errores</TableCell>
            <TableCell align="right">Preguntas respondidas</TableCell>
            <TableCell align="right">Album finalizado</TableCell>
            <TableCell align="right">Tiempo total de respuesta (s)</TableCell>
            <TableCell align="right">Porcentaje de error (%)  </TableCell>
            <TableCell align="right">Fecha</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((row) => (
            <TableRow
              key={row.album_id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.album_id.slice(-5)}
              </TableCell>
              <TableCell align="right">{row.error_number}</TableCell>
              <TableCell align="right">{row.answered_question_number}</TableCell>
              <TableCell align="right">{row.ended_album}</TableCell>
              <TableCell align="right">{row.error_percentage}</TableCell>
              <TableCell align="right">{row.total_response_time}</TableCell>
              <TableCell align="right">{
                row.epocas ? new Date(row.epocas).toLocaleDateString() : new Date().toLocaleDateString()
              }</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    
  );
}