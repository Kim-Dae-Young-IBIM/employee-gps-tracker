// Vercel Serverless Function for GPS tracking
import { getEmployees, addOrUpdateEmployee, clearAllEmployees } from './data-store.js';

// Serverless 환경에서 메모리 공유를 위한 글로벌 저장소
let serverlessEmployees = [];
let isInitialized = false;

function initializeData() {
  if (!isInitialized) {
    try {
      serverlessEmployees = getEmployees();
      isInitialized = true;
    } catch (error) {
      console.log('데이터 초기화 실패, 빈 배열로 시작');
      serverlessEmployees = [];
    }
  }
}

function saveEmployee(employee) {
  initializeData();
  const existingIndex = serverlessEmployees.findIndex(emp => emp.employeeId === employee.employeeId);
  
  if (existingIndex !== -1) {
    serverlessEmployees[existingIndex] = employee;
  } else {
    serverlessEmployees.push(employee);
  }
  
  // data-store도 업데이트
  addOrUpdateEmployee(employee);
}

function getAllEmployees() {
  initializeData();
  return [...serverlessEmployees];
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

      saveEmployee(locationData);
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
      const employees = getAllEmployees();
      console.log('📋 location.js GET에서 직원 수:', employees.length);
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
      clearAllEmployees();
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