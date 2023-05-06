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
import dayjs from 'dayjs';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';


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

function sortArray (dataToSort:any) {
  if (dataToSort.length > 0) {
    // setDataSorted(dataToSort);
   dataToSort.sort(function(a: any,b:any) {
        //Sort by less time
        return a.total_response_time - b.total_response_time;
    })
   dataToSort.sort(function(a: any,b:any) {
        //Sort by status of album (enden or not)
        if (a.ended_album > b.ended_album) {
            return -1;
        }

        if (a.ended_album < b.ended_album) {
            return 1;
        }
        // //Sort by less error number
        return a.error_number - b.error_number ;
    })
  }
  return addRank(dataToSort)
}
//Método que añade posiciones
function addRank(arrayData:any) {
  let position = 1
  for (let index = 0; index < arrayData.length; index++) {
    const element = arrayData[index];
    element.rank = position++;
  }
  // console.log(arrayData)
  return arrayData
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
      .get("http://localhost:8001/ranking")//Url api server
      .then((res) => {
        setData(sortArray(res.data.data));

      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // Filter data to show only rows with matching dates
  const filteredData = data.filter(row => {
    const rowDate = dayjs(row.started_on);
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
          {filteredData.map((row) => (
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
              <TableCell align="right">{row.finished? "Sí" : "No"}</TableCell>
              <TableCell align="right">{Math.round(row.total_latency)}</TableCell>
              <TableCell align="right">{Math.round(row.errors*100)} % </TableCell>
              <TableCell align="right">{new Date(row.started_on).toLocaleString() }</TableCell>
             

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
