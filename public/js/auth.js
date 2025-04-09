document.addEventListener('DOMContentLoaded', function() {
    // Handle login forms
    const loginForms = document.querySelectorAll('form[data-role="student"], form[data-role="teacher"]');
    loginForms.forEach(form => {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const isTeacher = form.getAttribute('data-role') === 'teacher';
        // For teachers, we use email as username; for students, we use PRN
        const username = form.querySelector('input:first-of-type').value;
        const password = form.querySelector('input[type="password"]').value;
        
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              username, 
              password,
              role: isTeacher ? 'teacher' : 'student'
            })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            alert(data.error || 'Login failed');
            return;
          }
          
          // Store user info in localStorage
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Redirect to dashboard
          window.location.href = data.redirect;
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
        }
      });
    });
    
    // Handle signup forms
    const signupForms = document.querySelectorAll('form[data-role="student-signup"], form[data-role="teacher-signup"]');
    signupForms.forEach(form => {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const isTeacher = form.dataset.role === 'teacher-signup';
        const inputs = form.querySelectorAll('input');
        
        // Parse full name into first and last name
        const fullName = inputs[0].value;
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        // For teachers, second input is department; for students, it's PRN
        const prn = !isTeacher ? inputs[1].value : generateTeacherPRN();
        const email = inputs[2].value;
        const password = inputs[3].value;
        const confirmPassword = inputs[4].value;
        
        // Check if passwords match
        if (password !== confirmPassword) {
          alert('Passwords do not match');
          return;
        }
        
        try {
          const endpoint = isTeacher ? '/api/teacher/signup' : '/api/student/signup';
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              username: isTeacher ? email : prn, // Teachers use email as username, students use PRN
              email,
              password,
              firstName, 
              lastName,
              prn
            })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            alert(data.error || 'Signup failed');
            return;
          }
          
          alert('Account created successfully! You can now login.');
          
          // Redirect to login page
          window.location.href = isTeacher ? '/teacher-login' : '/student-login';
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
        }
      });
    });
    
    // Helper function to generate a teacher PRN (T followed by 9 digits)
    function generateTeacherPRN() {
      return 'T' + Math.floor(100000000 + Math.random() * 900000000);
    }
  });