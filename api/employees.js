// Vercel Serverless Function for getting all employees
import { getEmployees } from './data-store.js';

export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const employees = getEmployees();
      console.log('📋 employees.js에서 직원 데이터 조회:', employees.length, '명');
      return res.status(200).json(employees);
    } catch (error) {
      console.error('GET 오류:', error);
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