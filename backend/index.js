const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Queue สำหรับฝั่งชาย/หญิง
const maleQueue = [];
const femaleQueue = [];

// ฟังก์ชันอ่าน students.csv (header ไม่สนตัวเล็กใหญ่)
function readStudentsCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream('students.csv')
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase(),
        bom: true
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// ฟังก์ชันแปลงรหัสห้อง
function convertRoom(room) {
  room = room.trim().toLowerCase();
  if (/^a([1-4])/.test(room)) {
    const n = room.match(/^a([1-4])/)[1];
    return `อนุบาล ${n}`;
  }
  if (/^1[a-d]/.test(room)) return "ป.1";
  if (/^2[a-d]/.test(room)) return "ป.2";
  if (/^([3-6])([a-d])/.test(room)) {
    const n = room.match(/^([3-6])/)[1];
    return `ป.${n}`;
  }
  if (/^(1[0-2])([a-d])/.test(room)) {
    const n = room.match(/^(1[0-2])/)[1];
    return `ม.${parseInt(n, 10) - 6}`;
  }
  if (/^(7|8|9)([a-d])/.test(room)) {
    const n = room.match(/^([7-9])/)[1];
    return `ม.${parseInt(n, 10) - 6}`;
  }
  return room;
}

// Logic แยกฝั่ง
function getShowOn(student) {
  const room = student.room.trim().toLowerCase();
  const sex = student.sex.trim();
  if (
    /^a[1-4]/.test(room) ||
    /^1[a-d]/.test(room) ||
    /^2[a-d]/.test(room)
  ) {
    return ['หญิง'];
  }
  if (sex === 'หญิง') return ['หญิง'];
  if (sex === 'ชาย') return ['ชาย'];
  return [];
}

// POST /scan: รับ UID แล้ว push เข้า queue
app.post('/scan', async (req, res) => {
  console.log('Received POST /scan:', req.body);
  const { uid } = req.body;
  if (!uid) {
    console.log('UID not provided');
    return res.status(400).json({ error: 'Missing UID' });
  }

  try {
    const students = await readStudentsCSV();
    const inCard = students.filter(s => s.uid === uid);

    if (inCard.length === 0) {
      console.log('UID not found:', uid);
      return res.status(404).json({ error: 'UID not found' });
    }

    inCard.forEach(student => {
      const showOn = getShowOn(student);
      const displayObj = {
        name: student.name,
        registration: student.registration,
        room: convertRoom(student.room),
        time: Date.now()
      };
      if (showOn.includes('ชาย')) maleQueue.unshift(displayObj);
      if (showOn.includes('หญิง')) femaleQueue.unshift(displayObj);
    });

    console.log('maleQueue:', maleQueue);
    console.log('femaleQueue:', femaleQueue);

    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /queue?type=male|female: ส่ง 20 รายการล่าสุด
app.get('/queue', (req, res) => {
  const type = req.query.type;
  if (!type || !['male', 'female'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }
  if (type === 'male') {
    res.json(maleQueue.slice(0, 20));
  } else {
    res.json(femaleQueue.slice(0, 20));
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Backend running on port', PORT);
});
