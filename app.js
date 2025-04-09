const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // serve static files

// Routes
app.use('/api', apiRoutes);

// Serve HTML files
app.get('/student-login',(req, res)=>{
    res.sendFile(path.join(__dirname, 'views', 'studentlogin.html'));
  })
  app.get('/teacher-login',(req, res)=>{
      res.sendFile(path.join(__dirname, 'views', 'teacherlogin.html'));
    })
  app.get('/student/dashboard',(req, res)=>{
      res.sendFile(path.join(__dirname, 'views', 'studentdashboard.html'));
    })
  
  app.get('/teacher/dashboard',(req, res)=>{
      res.sendFile(path.join(__dirname, 'views', 'teacherdashboard.html'));
    })
    
  app.get('/student-signup',(req, res)=>{
      res.sendFile(path.join(__dirname, 'views', 'studentsignup.html'));
    })
    
  app.get('/teacher-signup',(req, res)=>{
      res.sendFile(path.join(__dirname, 'views', 'teachersignup.html'));
    })




app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});