use classroom_management

DELIMITER //

CREATE PROCEDURE signup_teacher (
  IN p_username VARCHAR(50),
  IN p_email VARCHAR(255),
  IN p_password_hash VARCHAR(255),
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100)
)
BEGIN
  INSERT INTO users (username, email, password_hash, role, first_name, last_name)
  VALUES (p_username, p_email, p_password_hash, 'teacher', p_first_name, p_last_name);
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE signup_student (
  IN p_username VARCHAR(50),
  IN p_email VARCHAR(255),
  IN p_password_hash VARCHAR(255),
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100)
)
BEGIN
  INSERT INTO users (username, email, password_hash, role, first_name, last_name)
  VALUES (p_username, p_email, p_password_hash, 'student', p_first_name, p_last_name);
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE create_course (
  IN p_course_name VARCHAR(255),
  IN p_description TEXT,
  IN p_course_code CHAR(6),
  IN p_teacher_id VARCHAR(10)
)
BEGIN
  DECLARE existing_id INT;

  SELECT course_id INTO existing_id
  FROM courses
  WHERE course_code = p_course_code;

  IF existing_id IS NULL THEN
    INSERT INTO courses (course_name, course_description, course_code, created_by)
    VALUES (p_course_name, p_description, p_course_code, p_teacher_id);

    INSERT INTO course_members (course_id, PRN, role)
    VALUES (LAST_INSERT_ID(), p_teacher_id, 'teacher');
  END IF;
END //

DELIMITER ;




DELIMITER //

CREATE PROCEDURE join_course (
  IN p_course_code CHAR(6),
  IN p_PRN VARCHAR(10)
)
BEGIN
  DECLARE target_course_id INT;
  DECLARE already_joined INT;

  SELECT course_id INTO target_course_id
  FROM courses
  WHERE course_code = p_course_code;

  IF target_course_id IS NOT NULL THEN
    SELECT COUNT(*) INTO already_joined
    FROM course_members
    WHERE course_id = target_course_id AND PRN = p_PRN;

    IF already_joined = 0 THEN
      INSERT INTO course_members (course_id, PRN, role)
      VALUES (target_course_id, p_PRN, 'student');
    END IF;
  END IF;
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE get_student_courses (
  IN p_PRN VARCHAR(10)
)
BEGIN
  SELECT c.course_id, c.course_name, c.course_code, c.created_by
  FROM courses c
  JOIN course_members cm ON c.course_id = cm.course_id
  WHERE cm.PRN = p_PRN AND cm.role = 'student';
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE get_teacher_courses (
  IN p_teacher_id VARCHAR(10)
)
BEGIN
  SELECT c.course_id, c.course_name, c.course_code, c.course_description
  FROM courses c
  JOIN course_members cm ON c.course_id = cm.course_id
  WHERE cm.PRN = p_teacher_id AND cm.role = 'teacher';
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE is_course_code_valid (
  IN p_code CHAR(6)
)
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM courses WHERE course_code = p_code
  ) AS code_valid;
END //

DELIMITER ;



DELIMITER //

CREATE PROCEDURE add_task (
  IN PRN VARCHAR(10),
  IN p_subject VARCHAR(255),
  IN p_task TEXT,
  IN p_due_date DATE
)
BEGIN
  INSERT INTO tasks (student_id, subject, task, due_date)
  VALUES (p_student_id, p_subject, p_task, p_due_date);
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE update_task_status (
  IN p_task_id INT UNSIGNED,
  IN p_status ENUM('pending', 'in_progress', 'completed')
)
BEGIN
  UPDATE tasks
  SET status = p_status
  WHERE task_id = p_task_id;
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE delete_task (
  IN p_task_id INT UNSIGNED
)
BEGIN
  DELETE FROM tasks
  WHERE task_id = p_task_id;
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE fetch_all_tasks (
  IN P_PRN VARCHAR(10)
)
BEGIN
  SELECT * from tasks
  WHERE PRN = P_PRN;
END //

DELIMITER ;




DELIMITER //

CREATE PROCEDURE create_announcment (
  IN p_course_id VARCHAR(255),
  IN p_posted_by VARCHAR(50),
  IN p_title VARCHAR(20),
  IN p_content TEXT
)
BEGIN


    INSERT INTO announcements (course_id, posted_by, title, content)
    VALUES (p_course_id, p_posted_by, p_title, p_content);

  
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE delete_announcment (
  IN p_announcement_id INT UNSIGNED
)
BEGIN


    DELETE FROM announcements
    WHERE announcement_id = p_announcement_id;

END //

DELIMITER ;


DELIMITER //
CREATE PROCEDURE fetch_announcments (
  IN p_course_id INT UNSIGNED
)
BEGIN
  SELECT * FROM announcements
  WHERE course_id = p_course_id;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE fetch_announcments_by_student (
  IN p_student_id VARCHAR(10)
) 
BEGIN
  SELECT a.*
  FROM announcements a
  JOIN courses c ON a.course_id = c.course_id
  JOIN course_members cm ON c.course_id = cm.course_id
  WHERE cm.PRN = p_student_id;
END //
DELIMITER ;




DELIMITER //

CREATE PROCEDURE insert_attendance_request (
  IN p_student_name VARCHAR(255),
  IN p_PRN VARCHAR(10),
  IN p_proof_url TEXT,
  IN p_request_date DATE,
  IN p_request_time TIME
)
BEGIN
  INSERT INTO attendance_request (student_name, PRN, proof_url, request_date, request_time)
  VALUES (p_student_name, p_PRN, p_proof_url, p_request_date, p_request_time);
END //

DELIMITER ;



DELIMITER //

CREATE PROCEDURE update_attendance_status (
  IN p_request_id INT UNSIGNED,
  IN p_status ENUM('pending', 'approved', 'rejected')
)
BEGIN
  UPDATE attendance_request
  SET status = p_status
  WHERE request_id = p_request_id;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE delete_attendance_request (
  IN p_request_id INT UNSIGNED
)
BEGIN
  DELETE FROM attendance_request
  WHERE request_id = p_request_id;
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE fetch_all_attendance_requests ()
BEGIN
  SELECT request_id, student_name, PRN, proof_url, 
         request_date, request_time, status, created_at
  FROM attendance_request
  ORDER BY created_at DESC;
END //

DELIMITER ;