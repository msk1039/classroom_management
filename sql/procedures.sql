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