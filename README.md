# Secure File Share

A secure file sharing application built with React and Django, featuring end-to-end encryption, multi-factor authentication, and robust access control.

## Features

- 🔐 End-to-end encryption using AES-256
- 👥 User authentication with MFA support
- 🔑 Role-based access control
- 📤 Secure file upload and download
- 🔗 Shareable links with expiration
- 🛡️ Advanced security features

## Tech Stack

### Frontend
- React 18
- Redux Toolkit
- shadcn/ui
- Tailwind CSS
- TypeScript
- Web Crypto API

### Backend
- Django
- Django REST Framework
- SimpleJWT
- Celery
- Redis
- SQLite (Development)

## Prerequisites

- Python 3.9+
- Node.js 18+
- Redis Server
- Virtual Environment

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/secure_file_share.git
   cd secure_file_share
   ```

2. Set up the backend:
   ```bash
   # Create and activate virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Set up environment variables
   cp .env.example .env
   
   # Run migrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   ```

## Running the Application

1. Start the backend server:
   ```bash
   # Start Redis server
   redis-server
   
   # Start Celery worker
   celery -A backend worker -l info
   
   # Run Django server
   python manage.py runserver
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

## Security Features

- AES-256 encryption for files
- SSL/TLS encryption for data in transit
- Bcrypt password hashing
- CSRF protection
- XSS prevention
- Rate limiting
- Input sanitization

## Testing

### Backend Tests
```bash
pytest
coverage run -m pytest
coverage report
```

### Frontend Tests
```bash
cd frontend
npm test
```

## API Documentation

API documentation is available at `/api/schema/swagger-ui/` when running the development server.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

For security issues, please email [security@yourdomain.com](mailto:security@yourdomain.com)

## Acknowledgments

- [Django](https://www.djangoproject.com/)
- [React](https://reactjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/) 