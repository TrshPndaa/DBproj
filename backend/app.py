from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3
from sqlite3 import Error
from functools import wraps
import jwt
import bcrypt
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# Helper function to convert row to dict
def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def get_db_connection():
    try:
        conn = sqlite3.connect('database.db')
        conn.row_factory = dict_factory
        return conn
    except Error as e:
        print(f"Error connecting to the database: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if conn is not None:
        try:
            c = conn.cursor()
            # Create users table with role-based access control
            c.execute('''CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                reference_id INTEGER,
                email TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )''')
            
            # Create roles table
            c.execute('''CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_name TEXT UNIQUE NOT NULL,
                permissions TEXT NOT NULL
            )''')
            
            # Insert default roles if they don't exist
            roles = [
                ('admin', 'all'),
                ('teacher', 'courses,students,grades,attendance'),
                ('student', 'courses,grades'),
                ('parent', 'grades,attendance'),
                ('staff', 'courses,attendance'),
                ('investor', 'none')
            ]
            
            c.executemany('''INSERT OR IGNORE INTO roles (role_name, permissions)
                            VALUES (?, ?)''', roles)

            # Create course table
            c.execute('''CREATE TABLE IF NOT EXISTS course (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                courseName TEXT NOT NULL,
                courseDescription TEXT NOT NULL,
                credits INTEGER NOT NULL
            )''')

            # Create teachers table
            c.execute('''CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phoneNumber INTEGER UNIQUE NOT NULL,
                department TEXT NOT NULL
            )''')

            # Create student table
            c.execute('''CREATE TABLE IF NOT EXISTS student (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                dateOfBirth TEXT NOT NULL,
                address TEXT NOT NULL,
                phoneNumber INTEGER UNIQUE NOT NULL
            )''')

            # Create parent_guardian table
            c.execute('''CREATE TABLE IF NOT EXISTS parent_guardian (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phoneNumber INTEGER UNIQUE NOT NULL,
                relationToStudent TEXT NOT NULL
            )''')

            # Create enrollment table
            c.execute('''CREATE TABLE IF NOT EXISTS enrollment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                studentId INTEGER NOT NULL,
                courseId INTEGER NOT NULL,
                enrollmentDate DATE NOT NULL,
                FOREIGN KEY (studentId) REFERENCES student(id),
                FOREIGN KEY (courseId) REFERENCES course(id)
            )''')

            # Create grade table
            c.execute('''CREATE TABLE IF NOT EXISTS grade (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                enrollmentId INTEGER NOT NULL,
                gradeValue TEXT NOT NULL,
                FOREIGN KEY (enrollmentId) REFERENCES enrollment(id)
            )''')

            # Create attendance table
            c.execute('''CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                enrollmentId INTEGER NOT NULL,
                date DATE NOT NULL,
                status TEXT NOT NULL,
                FOREIGN KEY (enrollmentId) REFERENCES enrollment(id)
            )''')

            # Create supporting_staff table
            c.execute('''CREATE TABLE IF NOT EXISTS supporting_staff (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                role TEXT NOT NULL,
                department TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL
            )''')

            # Create investor table
            c.execute('''CREATE TABLE IF NOT EXISTS investor (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phoneNumber INTEGER UNIQUE NOT NULL,
                investmentDetails TEXT NOT NULL
            )''')

            # Create exam_board table
            c.execute('''CREATE TABLE IF NOT EXISTS exam_board (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                boardName TEXT NOT NULL,
                contactDetails TEXT NOT NULL
            )''')

            # Create course_teacher table
            c.execute('''CREATE TABLE IF NOT EXISTS course_teacher (
                courseId INTEGER NOT NULL,
                teacherId INTEGER NOT NULL,
                PRIMARY KEY (courseId, teacherId),
                FOREIGN KEY (courseId) REFERENCES course(id),
                FOREIGN KEY (teacherId) REFERENCES teachers(id)
            )''')

            # Create course_exam_board table
            c.execute('''CREATE TABLE IF NOT EXISTS course_exam_board (
                courseId INTEGER NOT NULL,
                examBoardId INTEGER NOT NULL,
                PRIMARY KEY (courseId, examBoardId),
                FOREIGN KEY (courseId) REFERENCES course(id),
                FOREIGN KEY (examBoardId) REFERENCES exam_board(id)
            )''')
            
            conn.commit()
        except Error as e:
            print(f"Error creating tables: {e}")
        finally:
            conn.close()

# Initialize the database
init_db()

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE id = ?', (data['user_id'],))
            current_user = cursor.fetchone()
            conn.close()
            
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
                
            g.current_user = current_user
        except:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

# Role-based access control decorator
def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not g.current_user:
                return jsonify({'message': 'Unauthorized'}), 401
            
            if g.current_user['role'] not in allowed_roles:
                return jsonify({'message': 'Permission denied'}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    conn = get_db_connection()
    try:
        data = request.json
        cursor = conn.cursor()
        
        # Check if username or email already exists
        cursor.execute('SELECT id FROM users WHERE username = ? OR email = ?',
                      (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({'message': 'Username or email already exists'}), 400
        
        # Hash the password
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        cursor.execute('''
            INSERT INTO users (username, password, role, reference_id, email)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['username'], hashed_password, data['role'], 
              data.get('reference_id'), data['email']))
        
        conn.commit()
        return jsonify({'message': 'User created successfully'}), 201
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    conn = get_db_connection()
    try:
        data = request.json
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE username = ?', (data['username'],))
        user = cursor.fetchone()
        
        if user and bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
            # Generate token
            token = jwt.encode({
                'user_id': user['id'],
                'role': user['role'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, app.config['SECRET_KEY'])
            
            return jsonify({
                'token': token,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'role': user['role'],
                    'email': user['email']
                }
            })
        
        return jsonify({'message': 'Invalid credentials'}), 401
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Course Routes
@app.route('/api/courses', methods=['GET'])
@token_required
@role_required(['admin', 'teacher', 'student'])
def get_courses():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        current_user = g.current_user
        
        if current_user['role'] == 'admin':
            cursor.execute('SELECT * FROM course')
        elif current_user['role'] == 'teacher':
            cursor.execute('''
                SELECT c.* FROM course c
                JOIN course_teacher ct ON c.id = ct.courseId
                WHERE ct.teacherId = ?
            ''', (current_user['reference_id'],))
        else:  # student
            cursor.execute('''
                SELECT c.* FROM course c
                JOIN enrollment e ON c.id = e.courseId
                WHERE e.studentId = ?
            ''', (current_user['reference_id'],))
            
        courses = cursor.fetchall()
        return jsonify(courses)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/courses', methods=['POST'])
@token_required
@role_required(['admin'])
def create_course():
    conn = get_db_connection()
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO course (courseName, courseDescription, credits)
            VALUES (?, ?, ?)
        ''', (data['courseName'], data['courseDescription'], data['credits']))
        conn.commit()
        return jsonify({"id": cursor.lastrowid, **data}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Student Routes
@app.route('/api/students', methods=['GET'])
@token_required
@role_required(['admin', 'teacher'])
def get_students():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        current_user = g.current_user
        
        if current_user['role'] == 'admin':
            cursor.execute('SELECT * FROM student')
        else:  # teacher
            cursor.execute('''
                SELECT DISTINCT s.* FROM student s
                JOIN enrollment e ON s.id = e.studentId
                JOIN course_teacher ct ON e.courseId = ct.courseId
                WHERE ct.teacherId = ?
            ''', (current_user['reference_id'],))
            
        students = cursor.fetchall()
        return jsonify(students)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/students', methods=['POST'])
@token_required
@role_required(['admin'])
def create_student():
    conn = get_db_connection()        
    print(request.json)
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO student (firstName, lastName, email, dateOfBirth, address, phoneNumber)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['firstName'], data['lastName'], data['email'], 
              data['dateOfBirth'], data['address'], data['phoneNumber']))
        conn.commit()

        return jsonify({"id": cursor.lastrowid, **data}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Grade Routes
@app.route('/api/grades', methods=['GET'])
@token_required
@role_required(['admin', 'teacher', 'student', 'parent'])
def get_grades():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        current_user = g.current_user
        
        if current_user['role'] == 'admin':
            cursor.execute('''
                SELECT g.*, s.firstName as studentFirstName, s.lastName as studentLastName,
                       c.courseName
                FROM grade g
                JOIN enrollment e ON g.enrollmentId = e.id
                JOIN student s ON e.studentId = s.id
                JOIN course c ON e.courseId = c.id
            ''')
        elif current_user['role'] == 'teacher':
            cursor.execute('''
                SELECT g.*, s.firstName as studentFirstName, s.lastName as studentLastName,
                       c.courseName
                FROM grade g
                JOIN enrollment e ON g.enrollmentId = e.id
                JOIN student s ON e.studentId = s.id
                JOIN course c ON e.courseId = c.id
                JOIN course_teacher ct ON e.courseId = ct.courseId
                WHERE ct.teacherId = ?
            ''', (current_user['reference_id'],))
        elif current_user['role'] == 'student':
            cursor.execute('''
                SELECT g.*, c.courseName
                FROM grade g
                JOIN enrollment e ON g.enrollmentId = e.id
                JOIN course c ON e.courseId = c.id
                WHERE e.studentId = ?
            ''', (current_user['reference_id'],))
        else:  # parent
            cursor.execute('''
                SELECT g.*, s.firstName as studentFirstName, s.lastName as studentLastName,
                       c.courseName
                FROM grade g
                JOIN enrollment e ON g.enrollmentId = e.id
                JOIN student s ON e.studentId = s.id
                JOIN course c ON e.courseId = c.id
                JOIN parent_guardian pg ON s.id = ?
                WHERE pg.id = ?
            ''', (current_user['reference_id'], current_user['reference_id']))
            
        grades = cursor.fetchall()
        return jsonify(grades)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/grades', methods=['POST'])
@token_required
@role_required(['admin', 'teacher'])
def create_grade():
    conn = get_db_connection()
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO grade (enrollmentId, gradeValue)
            VALUES (?, ?)
        ''', (data['enrollmentId'], data['gradeValue']))
        conn.commit()
        return jsonify({"id": cursor.lastrowid, **data}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Attendance Routes
@app.route('/api/attendance', methods=['GET'])
@token_required
@role_required(['admin', 'teacher', 'parent'])
def get_attendance():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        current_user = g.current_user
        
        if current_user['role'] == 'admin':
            cursor.execute('''
                SELECT a.*, s.firstName as studentFirstName, s.lastName as studentLastName,
                       c.courseName
                FROM attendance a
                JOIN enrollment e ON a.enrollmentId = e.id
                JOIN student s ON e.studentId = s.id
                JOIN course c ON e.courseId = c.id
            ''')
        elif current_user['role'] == 'teacher':
            cursor.execute('''
                SELECT a.*, s.firstName as studentFirstName, s.lastName as studentLastName,
                       c.courseName
                FROM attendance a
                JOIN enrollment e ON a.enrollmentId = e.id
                JOIN student s ON e.studentId = s.id
                JOIN course c ON e.courseId = c.id
                JOIN course_teacher ct ON e.courseId = ct.courseId
                WHERE ct.teacherId = ?
            ''', (current_user['reference_id'],))
        else:  # parent
            cursor.execute('''
                SELECT a.*, s.firstName as studentFirstName, s.lastName as studentLastName,
                       c.courseName
                FROM attendance a
                JOIN enrollment e ON a.enrollmentId = e.id
                JOIN student s ON e.studentId = s.id
                JOIN course c ON e.courseId = c.id
                JOIN parent_guardian pg ON s.id = ?
                WHERE pg.id = ?
            ''', (current_user['reference_id'], current_user['reference_id']))
            
        attendance = cursor.fetchall()
        return jsonify(attendance)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/attendance', methods=['POST'])
@token_required
@role_required(['admin', 'teacher'])
def create_attendance():
    conn = get_db_connection()
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO attendance (enrollmentId, date, status)
            VALUES (?, ?, ?)
        ''', (data['enrollmentId'], data['date'], data['status']))
        conn.commit()
        return jsonify({"id": cursor.lastrowid, **data}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Enrollment Routes
@app.route('/api/enrollments', methods=['GET'])
@token_required
@role_required(['admin', 'teacher'])
def get_enrollments():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        current_user = g.current_user
        
        if current_user['role'] == 'admin':
            cursor.execute('''
                SELECT e.*, s.firstName as studentFirstName, s.lastName as studentLastName,
                       c.courseName
                FROM enrollment e
                JOIN student s ON e.studentId = s.id
                JOIN course c ON e.courseId = c.id
            ''')
        else:  # teacher
            cursor.execute('''
                SELECT e.*, s.firstName as studentFirstName, s.lastName as studentLastName,
                       c.courseName
                FROM enrollment e
                JOIN student s ON e.studentId = s.id
                JOIN course c ON e.courseId = c.id
                JOIN course_teacher ct ON e.courseId = ct.courseId
                WHERE ct.teacherId = ?
            ''', (current_user['reference_id'],))
            
        enrollments = cursor.fetchall()
        return jsonify(enrollments)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/enrollments', methods=['POST'])
@token_required
@role_required(['admin'])
def create_enrollment():
    conn = get_db_connection()
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO enrollment (studentId, courseId, enrollmentDate)
            VALUES (?, ?, ?)
        ''', (data['studentId'], data['courseId'], datetime.now().strftime('%Y-%m-%d')))
        conn.commit()
        return jsonify({"id": cursor.lastrowid, **data}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Teacher Routes
@app.route('/api/teachers', methods=['GET'])
@token_required
@role_required(['admin'])
def get_teachers():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM teachers')
        teachers = cursor.fetchall()
        return jsonify(teachers)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/teachers', methods=['POST'])
@token_required
@role_required(['admin'])
def create_teacher():
    conn = get_db_connection()
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO teachers (firstName, lastName, email, phoneNumber, department)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['firstName'], data['lastName'], data['email'], 
              data['phoneNumber'], data['department']))
        conn.commit()
        return jsonify({"id": cursor.lastrowid, **data}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Course-Teacher Assignment Routes
@app.route('/api/course-teachers', methods=['POST'])
@token_required
@role_required(['admin'])
def assign_teacher_to_course():
    conn = get_db_connection()
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO course_teacher (courseId, teacherId)
            VALUES (?, ?)
        ''', (data['courseId'], data['teacherId']))
        conn.commit()
        return jsonify({"message": "Teacher assigned to course successfully"}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/course-teachers/<int:course_id>', methods=['GET'])
@token_required
@role_required(['admin'])
def get_course_teachers(course_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT t.* FROM teachers t
            JOIN course_teacher ct ON t.id = ct.teacherId
            WHERE ct.courseId = ?
        ''', (course_id,))
        teachers = cursor.fetchall()
        return jsonify(teachers)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Parent Routes
@app.route('/api/parents', methods=['GET'])
@token_required
@role_required(['admin'])
def get_parents():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM parent_guardian')
        parents = cursor.fetchall()
        return jsonify(parents)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/parents', methods=['POST'])
@token_required
@role_required(['admin'])
def create_parent():
    conn = get_db_connection()
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO parent_guardian (firstName, lastName, email, phoneNumber, relationToStudent)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['firstName'], data['lastName'], data['email'], 
              data['phoneNumber'], data['relationToStudent']))
        conn.commit()
        return jsonify({"id": cursor.lastrowid, **data}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/students/<int:id>', methods=['PUT'])
@token_required
@role_required(['admin'])
def update_student(id):
    conn = get_db_connection()
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE student
            SET firstName = ?, lastName = ?, email = ?, dateOfBirth = ?, address = ?, phoneNumber = ?
            WHERE id = ?
        ''', (data['firstName'], data['lastName'], data['email'], 
              data['dateOfBirth'], data['address'], data['phoneNumber'], id))
        conn.commit()
        
        # Fetch updated student
        cursor.execute('SELECT * FROM student WHERE id = ?', (id,))
        student = cursor.fetchone()
        return jsonify(student)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Delete student
@app.route('/api/students/<int:id>', methods=['DELETE'])
@token_required
@role_required(['admin'])
def delete_student(id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM student WHERE id = ?', (id,))
        conn.commit()
        return jsonify({"message": "Student deleted successfully"})
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)