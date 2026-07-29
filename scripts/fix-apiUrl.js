const fs = require('fs');
const path = require('path');

const root = 'c:/Users/mayan/Documents/GitHub/SanjivniAI';
const files = [
  'app/page.js',
  'app/dashboard/doctor/page.js',
  'app/dashboard/hospital/page.js',
  'app/dashboard/ambulance/page.js',
  'components/RideBookingModal.jsx',
  'components/ReferredDoctors.jsx',
  'components/NearbyFacilities.jsx',
  'components/DriverRideManager.jsx'
];

files.forEach(f => {
  const filePath = path.join(root, f);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace fetch(apiUrl('...') or fetch(apiUrl(`...`) with fetch(apiUrl('...'))
  // This adds the closing parenthesis that was missed by the previous script.
  content = content.replace(/fetch\(apiUrl\((['`].*?['`])/g, 'fetch(apiUrl($1)');
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed', filePath);
});
