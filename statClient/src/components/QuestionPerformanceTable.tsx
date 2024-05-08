/* eslint-disable react-hooks/exhaustive-deps */
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
import { TableSortLabel } from '@mui/material';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';


const baseURL = process.env.REACT_APP_API_URL || 'https://4ssoluciones.com/album_stats'

interface IQuestionData {
  // define la estructura de los datos que esperas recibir de la API
  questionId: number,
  question: string,
  attempts: number,
  avgLatency: string,
  successProb: string
}

export default function QuestionPerformanceTable() {
  const [selectedDateTo, setSelectedDateTo] = useState('');
  const [selectedDateSince, setSelectedDateSince] = useState('');
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

const handleDateChange = (dateSince: any, dateTo : any) => {
  setSelectedDateSince(dateSince);
  setSelectedDateTo(dateTo);
  if (dateSince || dateTo ) {
    
    dateSince = (dateSince ?? '1970-01-01')||'1970-01-01';
    dateTo = (dateTo ?? '3000-01-01')||'3000-01-01';
    
  
    const partesSince = new Date(dateSince).toLocaleDateString('es-ES').split('/');
    const partesTo = new Date(dateTo).toLocaleDateString('es-ES').split('/');
    
    if (partesSince.length === 3 ) {
      const ddSince = String(partesSince[0]).padStart(2, '0');
      const mmSince = String(partesSince[1]).padStart(2, '0');
      const yyyySince = partesSince[2];
      const fechaFormateadaSince = `${ddSince}/${mmSince}/${yyyySince}`;

      const ddTo = String(partesTo[0]).padStart(2, '0');
      const mmTo = String(partesTo[1]).padStart(2, '0');
      const yyyyTo = partesTo[2];
      const fechaFormateadaTo = `${ddTo}/${mmTo}/${yyyyTo}`;
      axios
        .get(`${baseURL}/questions?since=${fechaFormateadaSince}&to=${fechaFormateadaTo}`)
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
    getAnswers();
  }
};


  const [data, setData] = useState<IQuestionData[]>([]);
  useEffect(() => {
    getAnswers();
  }, []);

  useEffect(() => {
    handleDateChange(selectedDateSince, selectedDateTo);
  }, [selectedDateSince,selectedDateTo]);
    const getAnswers = () => {
      axios
      .get(`${baseURL}/questions`)
      .then((res) => {
        setData(res.data.data);
      })
      .catch((error) => {
        console.log("Error Efect: " + error);
      });
    }

    const handleSort = (columnId: keyof IQuestionData) => {
      const isAsc = orderBy === columnId && order === 'desc';
      setOrderBy(columnId);
      setOrder(isAsc ? 'asc' : 'desc');
      const sortedData = [...data].sort((a, b) => {
        let comparison = 0;
        if (a[columnId] > b[columnId]) {
          comparison = 1;
        } else if (a[columnId] < b[columnId]) {
          comparison = -1;
        }
        return isAsc ? -comparison : comparison;
      });
      setData(sortedData);
    };
    
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
          Desempeño de Preguntas
        </Typography>

        <Tooltip title="Filtrar por fecha desde" sx={{
          alignItems: 'center',
        }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker']}>
          <DemoItem>
            Desde
            <DatePicker
              value={selectedDateSince}
              onAccept={(event) => setSelectedDateSince(event as string)}
              format="DD/MM/YYYY"
              views={['year', 'month', 'day']}
            />
            </DemoItem>
          </DemoContainer>
          </LocalizationProvider>
        </Tooltip>
        
        <Tooltip title="Filtrar por fecha hasta" sx={{
          alignItems: 'center',
        }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker']}>
          <DemoItem>
            Hasta
            <DatePicker
              value={selectedDateTo}
              onAccept={(event) => setSelectedDateTo(event as string)}
              format="DD/MM/YYYY"
              views={['year', 'month', 'day']}
            />
            </DemoItem>
          </DemoContainer>
          </LocalizationProvider>
        </Tooltip>

      </Toolbar>

        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'questionId'}
                  direction={orderBy === 'questionId' ? order : 'asc'}
                  onClick={() => handleSort('questionId')}
                >
                  Identificación de la pregunta
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'question'}
                  direction={orderBy === 'question' ? order : 'asc'}
                  onClick={() => handleSort('question')}
                >
                  Pregunta
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'attempts'}
                  direction={orderBy === 'attempts' ? order : 'asc'}
                  onClick={() => handleSort('attempts')}
                >
                  Número de Intentos
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'avgLatency'}
                  direction={orderBy === 'avgLatency' ? order : 'asc'}
                  onClick={() => handleSort('avgLatency')}
                >
                  Tiempo total de respuesta (Segundos)
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'successProb'}
                  direction={orderBy === 'successProb' ? order : 'asc'}
                  onClick={() => handleSort('successProb')}
                >
                  Probabilidad de exito (%)
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.questionId}>
                <TableCell  align="center">{row.questionId}</TableCell>
                <TableCell  align="left">{row.question}</TableCell>
                <TableCell  align="center">{row.attempts}</TableCell>
                <TableCell  align="center">{Math.round(parseFloat(row.avgLatency))}</TableCell>
                <TableCell  align="center">{Math.round(parseFloat(row.successProb)*100)} %</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
