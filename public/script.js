let map;
let markers = {};
let employees = [];
let selectedEmployee = null;
const socket = io();

function initMap() {
    map = L.map('map').setView([37.5665, 126.9780], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    loadEmployees();
}

function loadEmployees() {
    fetch('/api/employees')
        .then(response => response.json())
        .then(data => {
            employees = data;
            updateEmployeeList();
            updateMarkers();
            updateStats();
        })
        .catch(error => console.error('Error loading employees:', error));
}

function updateEmployeeList() {
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = '';
    
    employees.forEach(employee => {
        const employeeItem = document.createElement('div');
        employeeItem.className = 'employee-item';
        employeeItem.innerHTML = `
            <div class="employee-name">
                <span class="status-online"></span>
                ${employee.employeeName}
            </div>
            <div class="employee-info">
                ID: ${employee.employeeId}<br>
                위치: ${employee.latitude.toFixed(6)}, ${employee.longitude.toFixed(6)}<br>
                업데이트: ${new Date(employee.timestamp).toLocaleString('ko-KR')}
            </div>
        `;
        
        employeeItem.addEventListener('click', () => {
            selectEmployee(employee, employeeItem);
        });
        
        employeeList.appendChild(employeeItem);
    });
}

function selectEmployee(employee, element) {
    document.querySelectorAll('.employee-item').forEach(item => {
        item.classList.remove('active');
    });
    
    element.classList.add('active');
    selectedEmployee = employee;
    
    map.setView([employee.latitude, employee.longitude], 16);
    
    if (markers[employee.employeeId]) {
        markers[employee.employeeId].openPopup();
        
        const marker = markers[employee.employeeId];
        let bounceCount = 0;
        const bounceInterval = setInterval(() => {
            marker.setLatLng([
                employee.latitude + (Math.sin(bounceCount * 0.5) * 0.0001),
                employee.longitude
            ]);
            bounceCount++;
            if (bounceCount > 10) {
                clearInterval(bounceInterval);
                marker.setLatLng([employee.latitude, employee.longitude]);
            }
        }, 100);
    }
}

function updateMarkers() {
    employees.forEach(employee => {
        const position = [employee.latitude, employee.longitude];
        
        if (markers[employee.employeeId]) {
            markers[employee.employeeId].setLatLng(position);
            markers[employee.employeeId].getPopup().setContent(`
                <div style="padding: 5px;">
                    <h4>${employee.employeeName}</h4>
                    <p>직원 ID: ${employee.employeeId}</p>
                    <p>위치: ${employee.latitude.toFixed(6)}, ${employee.longitude.toFixed(6)}</p>
                    <p>시간: ${new Date(employee.timestamp).toLocaleString('ko-KR')}</p>
                </div>
            `);
        } else {
            const blueIcon = L.divIcon({
                className: 'employee-marker',
                html: `<div style="
                    width: 24px; 
                    height: 24px; 
                    background-color: #3498db; 
                    border: 3px solid white; 
                    border-radius: 50%; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            
            const marker = L.marker(position, { icon: blueIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="padding: 5px;">
                        <h4>${employee.employeeName}</h4>
                        <p>직원 ID: ${employee.employeeId}</p>
                        <p>위치: ${employee.latitude.toFixed(6)}, ${employee.longitude.toFixed(6)}</p>
                        <p>시간: ${new Date(employee.timestamp).toLocaleString('ko-KR')}</p>
                    </div>
                `);
            
            markers[employee.employeeId] = marker;
        }
    });
}

function updateStats() {
    document.getElementById('employeeCount').textContent = `직원 수: ${employees.length}명`;
    document.getElementById('lastUpdate').textContent = 
        `마지막 업데이트: ${new Date().toLocaleString('ko-KR')}`;
}

document.addEventListener('DOMContentLoaded', function() {
    initMap();
});

socket.on('allEmployees', (data) => {
    employees = data;
    updateEmployeeList();
    updateMarkers();
    updateStats();
});

socket.on('locationUpdate', (employee) => {
    const existingIndex = employees.findIndex(emp => emp.employeeId === employee.employeeId);
    
    if (existingIndex !== -1) {
        employees[existingIndex] = employee;
    } else {
        employees.push(employee);
    }
    
    updateEmployeeList();
    updateMarkers();
    updateStats();
    
    console.log(`${employee.employeeName} 위치 업데이트됨`);
});

socket.on('connect', () => {
    console.log('서버에 연결됨');
});

socket.on('disconnect', () => {
    console.log('서버 연결 끊어짐');
});