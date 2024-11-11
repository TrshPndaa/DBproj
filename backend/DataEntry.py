import sqlite3
import bcrypt
from datetime import datetime, timedelta

def create_sample_data():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    try:
        # Create sample users with hashed passwords
        users = [
            ('admin_user', 'admin123', 'admin', None, 'admin@school.com'),
            ('teacher_smith', 'teacher123', 'teacher', 1, 'smith@school.com'),
            ('teacher_jones', 'teacher123', 'teacher', 2, 'jones@school.com'),
            ('student_john', 'student123', 'student', 1, 'john@school.com'),
            ('student_jane', 'student123', 'student', 2, 'jane@school.com'),
            ('parent_doe', 'parent123', 'parent', 1, 'doe@school.com')
        ]
        
        for username, password, role, ref_id, email in users:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            cursor.execute('''
                INSERT OR IGNORE INTO users (username, password, role, reference_id, email)
                VALUES (?, ?, ?, ?, ?)
            ''', (username, hashed_password, role, ref_id, email))

        # Create sample teachers
        teachers = [
            ('John', 'Smith', 'smith@school.com', '1234567890', 'Mathematics'),
            ('Sarah', 'Jones', 'jones@school.com', '1234567891', 'Science')
        ]
        
        cursor.execute('DELETE FROM teachers')  # Clear existing data
        cursor.executemany('''
            INSERT INTO teachers (firstName, lastName, email, phoneNumber, department)
            VALUES (?, ?, ?, ?, ?)
        ''', teachers)

        # Create sample courses
        courses = [
            ('Mathematics 101', 'Introduction to Mathematics', 3),
            ('Physics 101', 'Introduction to Physics', 3),
            ('Chemistry 101', 'Introduction to Chemistry', 3),
            ('Biology 101', 'Introduction to Biology', 3)
        ]
        
        cursor.execute('DELETE FROM course')  # Clear existing data
        cursor.executemany('''
            INSERT INTO course (courseName, courseDescription, credits)
            VALUES (?, ?, ?)
        ''', courses)

        # Create sample students
        students = [
            ('John', 'Doe', 'john@school.com', '2000-01-01', '123 Student St', '1234567892'),
            ('Jane', 'Smith', 'jane@school.com', '2000-02-01', '456 Student Ave', '1234567893')
        ]
        
        cursor.execute('DELETE FROM student')  # Clear existing data
        cursor.executemany('''
            INSERT INTO student (firstName, lastName, email, dateOfBirth, address, phoneNumber)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', students)

        # Create sample parents
        parents = [
            ('Robert', 'Doe', 'doe@school.com', '1234567894', 'Father'),
            ('Mary', 'Smith', 'mary@school.com', '1234567895', 'Mother')
        ]
        
        cursor.execute('DELETE FROM parent_guardian')  # Clear existing data
        cursor.executemany('''
            INSERT INTO parent_guardian (firstName, lastName, email, phoneNumber, relationToStudent)
            VALUES (?, ?, ?, ?, ?)
        ''', parents)

        # Assign teachers to courses
        course_teachers = [
            (1, 1),  # Teacher 1 (Smith) teaches Mathematics 101
            (2, 2)   # Teacher 2 (Jones) teaches Physics 101
        ]
        
        cursor.execute('DELETE FROM course_teacher')  # Clear existing data
        cursor.executemany('''
            INSERT INTO course_teacher (courseId, teacherId)
            VALUES (?, ?)
        ''', course_teachers)

        # Create enrollments
        enrollments = [
            (1, 1, '2024-01-15'),  # Student 1 in Mathematics 101
            (1, 2, '2024-01-15'),  # Student 1 in Physics 101
            (2, 1, '2024-01-15'),  # Student 2 in Mathematics 101
            (2, 2, '2024-01-15')   # Student 2 in Physics 101
        ]
        
        cursor.execute('DELETE FROM enrollment')  # Clear existing data
        cursor.executemany('''
            INSERT INTO enrollment (studentId, courseId, enrollmentDate)
            VALUES (?, ?, ?)
        ''', enrollments)

        # Add some grades
        grades = [
            (1, 'A'),  # Student 1 in Mathematics 101
            (2, 'B+'),  # Student 1 in Physics 101
            (3, 'A-'),  # Student 2 in Mathematics 101
            (4, 'B')    # Student 2 in Physics 101
        ]
        
        cursor.execute('DELETE FROM grade')  # Clear existing data
        cursor.executemany('''
            INSERT INTO grade (enrollmentId, gradeValue)
            VALUES (?, ?)
        ''', grades)

        # Add attendance records
        attendance = [
            (1, '2024-01-15', 'Present'),
            (2, '2024-01-15', 'Present'),
            (3, '2024-01-15', 'Absent'),
            (4, '2024-01-15', 'Present')
        ]
        
        cursor.execute('DELETE FROM attendance')  # Clear existing data
        cursor.executemany('''
            INSERT INTO attendance (enrollmentId, date, status)
            VALUES (?, ?, ?)
        ''', attendance)

        conn.commit()
        print("Sample data created successfully!")

        # Print login credentials
        print("\nSample Login Credentials:")
        print("-------------------------")
        print("Admin:")
        print("Username: admin_user")
        print("Password: admin123")
        print("\nTeacher:")
        print("Username: teacher_smith")
        print("Password: teacher123")
        print("\nStudent:")
        print("Username: student_john")
        print("Password: student123")
        print("\nParent:")
        print("Username: parent_doe")
        print("Password: parent123")

    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_sample_data()