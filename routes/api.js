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
      const role = "teacher";
      
      // Call the stored procedure with PRN as first parameter
      db.query(
        'INSERT INTO users (PRN, username, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [prn, username, email, passwordHash, role, firstName, lastName],
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

      const role = "student";
      
      // Insert student record
      db.query(
        'INSERT INTO users (PRN, username, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [prn, username, email, passwordHash,role , firstName, lastName],
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
    query += 'email = ? AND role = ?';
  } else {
    query += 'PRN = ? AND role = ?';
  }
  
  // Get user by username/email or PRN
  db.query(
    query,
    [username, role],
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
      console.log(courseCode, prn);
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


  // ...existing code...

// TASKS API ENDPOINTS

// Get all tasks for a student
router.get('/tasks/:prn', (req, res) => {
  try {
    const { prn } = req.params;
    
    db.query(
      'CALL fetch_all_tasks(?)',
      [prn],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // The stored procedure returns the tasks in the first result set
        const tasks = result[0];
        
        res.status(200).json({
          success: true,
          tasks: tasks
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new task
router.post('/tasks', (req, res) => {
  try {
    const { prn, subject, task, dueDate } = req.body;
    
    db.query(
      'INSERT INTO tasks (PRN, subject, task, due_date) VALUES (?, ?, ?, ?)',
      [prn, subject, task, dueDate],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(201).json({
          success: true,
          message: 'Task added successfully',
          taskId: result.insertId
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status
router.put('/tasks/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    
    db.query(
      'CALL update_task_status(?, ?)',
      [taskId, status],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(200).json({
          success: true,
          message: 'Task status updated'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
router.delete('/tasks/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    
    db.query(
      'CALL delete_task(?)',
      [taskId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(200).json({
          success: true,
          message: 'Task deleted successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all tasks for a student
router.delete('/tasks/clear/:prn', (req, res) => {
  try {
    const { prn } = req.params;
    
    db.query(
      'DELETE FROM tasks WHERE PRN = ?',
      [prn],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(200).json({
          success: true,
          message: 'All tasks cleared successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// ...existing code...

// ANNOUNCEMENTS API ENDPOINTS

// Create a new announcement
router.post('/announcements', (req, res) => {
  try {
    const { courseId, postedBy, title, content } = req.body;
    
    db.query(
      'CALL create_announcment(?, ?, ?, ?)',
      [courseId, postedBy, title, content],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(201).json({
          success: true,
          message: 'Announcement created successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an announcement
router.delete('/announcements/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    db.query(
      'CALL delete_announcment(?)',
      [id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(200).json({
          success: true,
          message: 'Announcement deleted successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/student/announcements', (req, res) => {
  try {
    const { student_id } = req.body;
    
    if (!student_id) {
      return res.status(400).json({ 
        error: 'Missing student ID' 
      });
    }
    
    db.query(
      'CALL fetch_announcments_by_student(?)',
      [student_id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // The stored procedure returns the announcements in the first result set
        const announcements = result[0];
        
        res.status(200).json({
          success: true,
          announcements: announcements
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// POST route to create a new attendance request
router.post('/attendance-request', (req, res) => {
  try {
    const { studentName, PRN, proofUrl, requestDate, requestTime } = req.body;

    db.query(
      'CALL insert_attendance_request(?, ?, ?, ?, ?)',
      [studentName, PRN, proofUrl, requestDate, requestTime],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
          success: true,
          message: 'Attendance request created successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET route to fetch attendance requests for a specific student 
router.get('/attendance-requests/:PRN', (req, res) => {
  try {
    const { PRN } = req.params;

    db.query(
      'CALL fetch_attendance_by_student(?)',
      [PRN],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // The stored procedure returns the requests in the first result set
        const attendanceRequests = result[0];

        res.status(200).json({
          success: true,
          attendanceRequests: attendanceRequests 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// GET route to fetch all attendance requests (for teachers)
router.get('/attendance-requests', (req, res) => {
  try {
    db.query(
      'CALL fetch_all_attendance_requests()',
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // The stored procedure returns the requests in the first result set
        const attendanceRequests = result[0];

        res.status(200).json({
          success: true,
          attendanceRequests: attendanceRequests 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT route to update attendance request status (approve or reject)
router.put('/attendance-request/:requestId', (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    
    // Validate the status
    if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    db.query(
      'CALL update_attendance_status(?, ?)',
      [requestId, status],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(200).json({
          success: true,
          message: `Attendance request ${status}`
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// Get all lectures
router.get('/lectures', (req, res) => {
  try {
    db.query(
      'CALL fetch_all_lectures()',
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // The stored procedure returns the lectures in the first result set
        const lectures = result[0];
        
        res.status(200).json({
          success: true,
          lectures: lectures
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new lecture
router.post('/lectures', (req, res) => {
  try {
    const { teacherName,PRN, subject, dayOfWeek, startTime, endTime } = req.body;
    
    // Validate input
    if (!teacherName || !subject || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    db.query(
      'CALL add_lecture(?,?, ?, ?, ?, ?)',
      [teacherName,PRN, subject, dayOfWeek, startTime, endTime],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(201).json({
          success: true,
          message: 'Lecture added successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a lecture
router.put('/lectures/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { teacherName,PRN, subject, dayOfWeek, startTime, endTime } = req.body;
    
    // Validate input
    if (!teacherName || !subject || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    db.query(
      'CALL update_lecture(?, ?, ?, ?, ?, ?, ?)',
      [id, teacherName,PRN, subject, dayOfWeek, startTime, endTime],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(200).json({
          success: true,
          message: 'Lecture updated successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a lecture
router.delete('/lectures/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    db.query(
      'CALL remove_lecture(?)',
      [id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(200).json({
          success: true,
          message: 'Lecture deleted successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// ASSIGNMENTS API ENDPOINTS

// Create a new assignment
router.post('/assignments', (req, res) => {
  try {
    const { courseId, title, description, dueDate } = req.body;
    
    if (!courseId || !title || !dueDate) {
      return res.status(400).json({ error: 'Course ID, title, and due date are required' });
    }
    
    db.query(
      'CALL create_assignment(?, ?, ?, ?)',
      [courseId, title, description, dueDate],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(201).json({
          success: true,
          message: 'Assignment created successfully',
          assignmentId: result.insertId
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an existing assignment
router.put('/assignments/:assignmentId', (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueDate } = req.body;
    
    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }
    
    db.query(
      'CALL update_assignment(?, ?, ?, ?)',
      [assignmentId, title, description, dueDate],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(200).json({
          success: true,
          message: 'Assignment updated successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an assignment
router.delete('/assignments/:assignmentId', (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    db.query(
      'CALL delete_assignment(?)',
      [assignmentId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(200).json({
          success: true,
          message: 'Assignment deleted successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assignments by course
router.get('/courses/:courseId/assignments', (req, res) => {
  try {
    const { courseId } = req.params;
    
    db.query(
      'CALL fetch_course_assignments(?)',
      [courseId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        const assignments = result[0];
        
        res.status(200).json({
          success: true,
          assignments: assignments
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assignments for a student
router.get('/students/:studentId/assignments', (req, res) => {
  try {
    const { studentId } = req.params;
    
    db.query(
      'CALL fetch_student_assignments(?)',
      [studentId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        const assignments = result[0];
        
        res.status(200).json({
          success: true,
          assignments: assignments
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit an assignment
router.post('/assignments/:assignmentId/submit', (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { studentId, submissionFileUrl, submissionText } = req.body;
    
    if (!studentId || (!submissionFileUrl && !submissionText)) {
      return res.status(400).json({ 
        error: 'Student ID and either file URL or submission text are required' 
      });
    }
    
    db.query(
      'CALL submit_assignment(?, ?, ?, ?)',
      [assignmentId, studentId, submissionFileUrl, submissionText],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(201).json({
          success: true,
          message: 'Assignment submitted successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


  

module.exports = router;
