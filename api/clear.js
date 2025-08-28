// Vercel Serverless Function for clearing all employee data
import { clearAllEmployees } from './data-store.js';

export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      clearAllEmployees();
      console.log('모든 직원 데이터 삭제됨 (전역 스토어)');
      
      return res.status(200).json({ 
        success: true, 
        message: 'All employee data cleared successfully' 
      });
    } catch (error) {
      console.error('데이터 삭제 오류:', error);
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