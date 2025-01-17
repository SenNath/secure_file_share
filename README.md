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

- Docker
- Docker Compose

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd secure-file-share
```

2. Start the application:
```bash
docker-compose up --build
```

3. Default Admin Credentials:
The application automatically creates a default admin user with the following credentials:
```
Email: admin@test.com
Password: admin123
```

Note: When you register as a new user from the frontend, the role will be set to "Regular" by default. Only the default admin user will have the "Admin" role and can change the role of other registered users to either "Admin" or "Regular" or "Guest".



The application will be available at:
- Frontend: https://localhost:3000
- Backend API: https://localhost:8000
- Admin Interface: https://localhost:8000/admin

## Environment Variables

The application uses the following environment variables, which are pre-configured in the docker-compose.yml:

### Backend
- DJANGO_SECRET_KEY: Secret key for Django
- DJANGO_DEBUG: Debug mode (True/False)
- DJANGO_ALLOWED_HOSTS: Allowed hosts for Django
- DATABASE_URL: PostgreSQL database URL
- REDIS_URL: Redis URL for Celery
- CELERY_BROKER_URL: Celery broker URL
- CORS_ALLOWED_ORIGINS: CORS allowed origins


### Frontend
- REACT_APP_API_URL: Backend API URL

## Development

To run the application in development mode:

1. Start the services:
```bash
docker-compose up
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
docker-compose exec backend python manage.py test
```

### Frontend Tests
```bash
docker-compose exec frontend npm test
```

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

## Acknowledgments
- [Django](https://www.djangoproject.com/)
- [React](https://reactjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/) 