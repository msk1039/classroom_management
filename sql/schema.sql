-- 1. USERS TABLE
DROP DATABASE classroom_management;
CREATE DATABASE IF NOT EXISTS classroom_management;
use classroom_management;

CREATE TABLE users (
  PRN VARCHAR(10) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. COURSES
CREATE TABLE courses (
  course_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(255) NOT NULL,
  course_description TEXT,
  course_code CHAR(6) NOT NULL UNIQUE,
  created_by VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(PRN) ON DELETE SET NULL
);

-- 3. COURSE MEMBERS
CREATE TABLE course_members (
  course_id INT UNSIGNED,
  PRN VARCHAR(10),
  role ENUM('student', 'teacher', 'ta') NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (course_id, PRN),
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (PRN) REFERENCES users(PRN) ON DELETE CASCADE
);

-- 4. ASSIGNMENTS
CREATE TABLE assignments (
  assignment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- 5. SUBMISSIONS
CREATE TABLE submissions (
  submission_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT UNSIGNED NOT NULL,
  PRN VARCHAR(10) NOT NULL,
  submission_file_url TEXT,
  submission_text TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_submission (assignment_id, PRN),
  FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
  FOREIGN KEY (PRN) REFERENCES users(PRN) ON DELETE CASCADE
);

-- 6. GRADES
CREATE TABLE grades (
  grade_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id INT UNSIGNED NOT NULL,
  grader_id VARCHAR(10),
  grade FLOAT CHECK (grade >= 0),
  feedback TEXT,
  graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_grade (submission_id),
  FOREIGN KEY (submission_id) REFERENCES submissions(submission_id) ON DELETE CASCADE,
  FOREIGN KEY (grader_id) REFERENCES users(PRN)
);

-- 7. ANNOUNCEMENTS
CREATE TABLE announcements (
  announcement_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  posted_by VARCHAR(10),
  title VARCHAR(255),
  content TEXT,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (posted_by) REFERENCES users(PRN)
);

-- 8. MATERIALS
CREATE TABLE materials (
  material_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  uploaded_by VARCHAR(10),
  title VARCHAR(255),
  material_type ENUM('file', 'link', 'document') NOT NULL,
  file_url TEXT,
  content TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(PRN)
);