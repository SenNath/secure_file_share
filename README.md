# Secure File Share Application

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
- Node.js 16+
- Redis Server
- SQLite (for development)

## Setup Instructions

### Clone the Repository
```bash
git clone <repository-url>
cd secure_file_share
```

### Set up the backend:
   ```bash
   # Create and activate virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Set up environment variables
   cp .env.example .env
   
### Generate SSL certificates
    ```bash
    cd scripts
    chmod +x generate_cert.sh
    ./generate_cert.sh
    cd ..
    ```

### Apply migrations
```bash
python manage.py migrate
```

### Create superuser
```bash
python manage.py createsuperuser
```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   ```

## Running the Application


## Running the Application

### 1. Start Backend Server
```bash
cd backend
python manage.py runsslserver --certificate certificates/server.crt --key certificates/server.key
```

### 2. Start Frontend Development Server
In a new terminal:
```bash
cd frontend
npm run dev
```
### 4. Start Redis Server
```bash
redis-server
```

The application will be available at:
- Frontend: https://localhost:3000
- Backend API: https://localhost:8000/api
- Admin Interface: https://localhost:8000/admin

##Security

### Security Features
- AES-256 encryption for files
- SSL/TLS encryption for data in transit
- Bcrypt password hashing
- CSRF protection
- XSS prevention
- Rate limiting
- Input sanitization

### Security Notes
1. The application uses self-signed certificates in development. Your browser will show a security warning - this is normal in development.
2. For production, use proper SSL certificates from a trusted certificate authority.
3. Change all secret keys and passwords before deploying to production.

## Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```
## API Documentation
API documentation is available at `/api/schema/swagger-ui/` when running the development server.

## Features
- End-to-end file encryption
- Multi-factor authentication
- Role-based access control
- Secure file sharing
- Real-time notifications
- Audit logging
- Password policies
- Session management

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