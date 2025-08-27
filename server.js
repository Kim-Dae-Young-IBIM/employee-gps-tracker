const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let employees = [];

app.post('/api/location', (req, res) => {
  const { employeeId, employeeName, latitude, longitude, timestamp } = req.body;
  
  const locationData = {
    employeeId,
    employeeName,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    timestamp: timestamp || new Date().toISOString()
  };

  const existingIndex = employees.findIndex(emp => emp.employeeId === employeeId);
  
  if (existingIndex !== -1) {
    employees[existingIndex] = locationData;
  } else {
    employees.push(locationData);
  }

  io.emit('locationUpdate', locationData);
  
  res.json({ success: true, message: 'Location updated successfully' });
});

app.get('/api/employees', (req, res) => {
  res.json(employees);
});

app.get('/api/employee/:id', (req, res) => {
  const employee = employees.find(emp => emp.employeeId === req.params.id);
  if (employee) {
    res.json(employee);
  } else {
    res.status(404).json({ error: 'Employee not found' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.emit('allEmployees', employees);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
});