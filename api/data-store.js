// 전역 데이터 스토어 - 모든 API 함수가 공유
let globalEmployees = [];
let isCleared = false;

export function getEmployees() {
  if (isCleared) {
    return [];
  }
  return [...globalEmployees];
}

export function setEmployees(employees) {
  globalEmployees = [...employees];
  isCleared = false;
}

export function addOrUpdateEmployee(employee) {
  if (isCleared) {
    globalEmployees = [];
    isCleared = false;
  }
  
  const existingIndex = globalEmployees.findIndex(emp => emp.employeeId === employee.employeeId);
  
  if (existingIndex !== -1) {
    globalEmployees[existingIndex] = employee;
  } else {
    globalEmployees.push(employee);
  }
}

export function clearAllEmployees() {
  globalEmployees = [];
  isCleared = true;
}

export function isClearedState() {
  return isCleared;
}