import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Button,
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert
} from '@mui/material';

const API_URL = 'http://192.168.1.176:4000'; // เปลี่ยนเป็น IP backend จริง

function LatestList({ type, onBack }) {
  const [queue, setQueue] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/queue?type=${type}`);
        const latest = res.data.slice(0, 20);
        // ถ้ามีข้อมูลใหม่เข้ามา (จำนวนมากขึ้น) ให้โชว์ Alert
        if (latest.length > 0 && latest.length > lastCount) {
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 1500);
        }
        setLastCount(latest.length);
        setQueue(latest);
      } catch {
        setQueue([]);
      }
    }, 1200);
    return () => clearInterval(timer);
  }, [type, lastCount]);

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Button
        variant="outlined"
        onClick={onBack}
        sx={{ mb: 3, fontSize: '1.2rem', px: 4, py: 2 }}
      >
        ย้อนกลับ
      </Button>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Latest {type === 'male' ? 'ชาย' : 'หญิง'}
      </Typography>
      <Snackbar
        open={showAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={() => setShowAlert(false)}
        autoHideDuration={1500}
      >
        <Alert severity="success" sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
          New scan detect!
        </Alert>
      </Snackbar>
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem' }}>ชื่อ</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem' }}>ทะเบียน</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem' }}>ห้อง</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queue.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  ยังไม่มีข้อมูล
                </TableCell>
              </TableRow>
            )}
            {queue.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ fontSize: '1.15rem' }}>{item.name}</TableCell>
                <TableCell sx={{ fontSize: '1.15rem' }}>{item.registration}</TableCell>
                <TableCell sx={{ fontSize: '1.15rem' }}>{item.room}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

function App() {
  const [page, setPage] = useState('home');

  // หน้าแรก: เลือกชาย/หญิง
  const renderHome = () => (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography
        variant="h2"
        gutterBottom
        sx={{ fontWeight: 900, mb: 6, letterSpacing: 1 }}
      >
        เลือกรายการ
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 8, mb: 7, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          sx={{
            width: 250,
            height: 130,
            fontSize: '2.3rem',
            fontWeight: 700,
            borderRadius: 6,
            background: '#1976d2',
            color: '#fff',
            boxShadow: 4
          }}
          onClick={() => setPage('male')}
        >
          ชาย
        </Button>
        <Button
          variant="contained"
          sx={{
            width: 250,
            height: 130,
            fontSize: '2.3rem',
            fontWeight: 700,
            borderRadius: 6,
            background: '#9c27b0',
            color: '#fff',
            boxShadow: 4
          }}
          onClick={() => setPage('female')}
        >
          หญิง
        </Button>
      </Box>
    </Container>
  );

  return (
    <>
      {page === 'home' && renderHome()}
      {page === 'male' && <LatestList type="male" onBack={() => setPage('home')} />}
      {page === 'female' && <LatestList type="female" onBack={() => setPage('home')} />}
    </>
  );
}

export default App;
