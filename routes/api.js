const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const bcrypt = require('bcrypt');

// TEACHER SIGNUP
router.post('/teacher/signup', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, prn } = req.body;
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if PRN already exists
    db.query('SELECT PRN FROM users WHERE PRN = ?', [prn], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length > 0) {
        return res.status(409).json({ error: 'Teacher ID already exists' });
      }
      
      // Call the stored procedure with PRN as first parameter
      db.query(
        'INSERT INTO users (PRN, username, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, "teacher", ?, ?)', 
        [prn, username, email, passwordHash, firstName, lastName],
        (err, result) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              return res.status(409).json({ error: 'Username or email already exists' });
            }
            return res.status(500).json({ error: err.message });
          }
          
          // Return success
          res.status(201).json({ 
            success: true, 
            message: 'Teacher account created successfully',
            redirect: '/teacher/dashboard'
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// STUDENT SIGNUP
router.post('/student/signup', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, prn } = req.body;
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if PRN already exists
    db.query('SELECT PRN FROM users WHERE PRN = ?', [prn], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length > 0) {
        return res.status(409).json({ error: 'PRN already exists' });
      }
      
      // Insert student record
      db.query(
        'INSERT INTO users (PRN, username, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, "student", ?, ?)', 
        [prn, username, email, passwordHash, firstName, lastName],
        (err, result) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              return res.status(409).json({ error: 'Username or email already exists' });
            }
            return res.status(500).json({ error: err.message });
          }
          
          // Return success
          res.status(201).json({ 
            success: true, 
            message: 'Student account created successfully',
            redirect: '/student/dashboard'
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN (for both teachers and students)
router.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  
  // Build the query based on role
  let query = 'SELECT PRN, username, password_hash, role, first_name, last_name FROM users WHERE ';
  
  if (role === 'teacher') {
    query += 'email = ? AND role = "teacher"';
  } else {
    query += 'PRN = ? AND role = "student"';
  }
  
  // Get user by username/email or PRN
  db.query(
    query,
    [username],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = results[0];
      
      // Compare passwords
      try {
        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Determine redirect based on role
        const redirectUrl = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
        
        // Return user info (except password)
        const { password_hash, ...userInfo } = user;
        
        res.json({
          success: true,
          message: 'Login successful',
          user: userInfo,
          redirect: redirectUrl
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
});

// Example: GET all users
router.get('/users', (req, res) => {
  db.query('SELECT PRN, username, email, role, first_name, last_name FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});




// ...existing code...

// CREATE COURSE (for teachers)
router.post('/course/create', (req, res) => {
    try {
      const { courseName, description, teacherId } = req.body;
      
      // Generate a random 6-character course code
      const courseCode = generateCourseCode();
      
      // Call the stored procedure to create a course
      db.query(
        'CALL create_course(?, ?, ?, ?)',
        [courseName, description, courseCode, teacherId],
        (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({
            success: true,
            message: 'Course created successfully',
            courseCode: courseCode
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // JOIN COURSE (for students)
  router.post('/course/join', (req, res) => {
    try {
      const { courseCode, prn } = req.body;
      
      // First check if the course code is valid
      db.query(
        'CALL is_course_code_valid(?)',
        [courseCode],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          const isValid = result[0][0]?.code_valid;
          
          if (!isValid) {
            return res.status(404).json({ error: 'Invalid course code' });
          }
          
          // Course code is valid, now join the course
          db.query(
            'CALL join_course(?, ?)',
            [courseCode, prn],
            (err, result) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              res.status(200).json({
                success: true,
                message: 'Successfully joined the course'
              });
            }
          );
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET TEACHER COURSES
  router.get('/teacher/courses/:teacherId', (req, res) => {
    try {
      const { teacherId } = req.params;
      
      db.query(
        'CALL get_teacher_courses(?)',
        [teacherId],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // The stored procedure returns multiple result sets
          // The first set contains the courses
          const courses = result[0];
          
          res.status(200).json({
            success: true,
            courses: courses
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET STUDENT COURSES
  router.get('/student/courses/:prn', (req, res) => {
    try {
      const { prn } = req.params;
      
      db.query(
        'CALL get_student_courses(?)',
        [prn],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // The stored procedure returns multiple result sets
          // The first set contains the courses
          const courses = result[0];
          
          res.status(200).json({
            success: true,
            courses: courses
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Helper function to generate a random 6-character course code
  function generateCourseCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    
    return code;
  }
  

module.exports = router;
