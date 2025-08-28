// Vercel Serverless Function for GPS tracking
import fs from 'fs';
import path from 'path';

const DATA_FILE = '/tmp/employees.json';

function readEmployees() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading employees file:', error);
  }
  return [];
}

function writeEmployees(employees) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(employees, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing employees file:', error);
    return false;
  }
}

export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { employeeId, employeeName, latitude, longitude, timestamp } = req.body;
      
      if (!employeeId || !employeeName || !latitude || !longitude) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }
      
      const locationData = {
        employeeId,
        employeeName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: timestamp || new Date().toISOString()
      };

      const employees = readEmployees();
      const existingIndex = employees.findIndex(emp => emp.employeeId === employeeId);
      
      if (existingIndex !== -1) {
        employees[existingIndex] = locationData;
      } else {
        employees.push(locationData);
      }

      writeEmployees(employees);
      console.log('위치 업데이트:', locationData);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Location updated successfully',
        data: locationData 
      });
    } catch (error) {
      console.error('POST 오류:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const employees = readEmployees();
      return res.status(200).json(employees);
    } catch (error) {
      console.error('GET 오류:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      writeEmployees([]);
      console.log('모든 직원 데이터 삭제됨');
      return res.status(200).json({ 
        success: true, 
        message: 'All employee data cleared successfully' 
      });
    } catch (error) {
      console.error('DELETE 오류:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed' 
  });
}