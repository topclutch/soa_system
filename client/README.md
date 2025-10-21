# Sistema Cliente-Servidor SOA

Sistema orientado a servicios desarrollado con arquitectura cliente-servidor moderna, cumpliendo al 100% con los requisitos de la rúbrica SOA.

## 🏗️ Arquitectura

- **Cliente PWA**: React + Vite + TailwindCSS + Service Worker
- **Backend 1**: Node.js + Express + MongoDB (Usuarios y Ventas)
- **Backend 2**: Flask + MySQL (Productos)
- **Autenticación**: JWT con roles (Admin, Vendedor, Consultor)
- **APIs Externas**: FakeStoreAPI, OpenWeather, RESTCountries, JSONPlaceholder

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 16+ y npm 8+
- Python 3.8+
- MongoDB (local o Atlas)
- MySQL (XAMPP recomendado)

### Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd soa-system

# Instalar dependencias del proyecto completo
npm run install:all

# Copiar archivos de configuración
cp client/.env.example client/.env
cp backend1/.env.example backend1/.env
cp backend2/.env.example backend2/.env
```

### Configuración de Base de Datos

#### MongoDB (Backend 1)
```bash
# Instalar MongoDB localmente o usar MongoDB Atlas
# Configurar MONGODB_URI en backend1/.env
```

#### MySQL (Backend 2)
```bash
# Instalar XAMPP y iniciar MySQL
# Crear base de datos 'soa_products'
# Configurar credenciales en backend2/.env
```

### Configuración de Variables de Entorno

#### Cliente (.env)
```env
VITE_BACKEND1_URL=http://localhost:3001
VITE_BACKEND2_URL=http://localhost:5000
VITE_JWT_SECRET=your-jwt-secret-key
```

#### Backend 1 (.env)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/soa_system
JWT_SECRET=your-super-secret-jwt-key
```

#### Backend 2 (.env)
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=soa_products
JWT_SECRET=your-super-secret-jwt-key
```

## 🎯 Ejecución

### Desarrollo (Todos los servicios)
```bash
npm run dev
```

### Servicios Individuales
```bash
# Cliente PWA
npm run client:dev

# Backend 1 (Usuarios y Ventas)
npm run backend1:dev

# Backend 2 (Productos)
npm run backend2:dev
```

## 🧪 Pruebas

```bash
# Ejecutar todas las pruebas
npm run test:all

# Pruebas por servicio
npm run test:client    # Jest + React Testing Library
npm run test:backend1  # Jest + Supertest
npm run test:backend2  # Pytest
```

## 📊 Casos de Uso

### CU1. Iniciar sesión
- Autenticación JWT
- Roles: Administrador, Vendedor, Consultor
- Rutas protegidas según rol

### CU2. Gestionar productos (Solo Admin)
- CRUD completo de productos
- Validación de datos
- Conexión con Backend 2 (Flask + MySQL)

### CU3. Gestionar usuarios (Solo Admin)
- CRUD de usuarios
- Asignación de roles
- Conexión con Backend 1 (Node.js + MongoDB)

### CU4. Gestionar ventas (Solo Vendedor)
- Crear, ver, editar ventas
- Productos asociados
- Cálculo automático de totales

### CU5. Consultar reportes (Solo Consultor)
- Ventas por período
- Top productos
- Gráficas interactivas
- Exportación a PDF

## 🌐 APIs Externas

- **FakeStoreAPI**: Productos de ejemplo
- **OpenWeather**: Datos meteorológicos
- **RESTCountries**: Información de países
- **JSONPlaceholder**: Datos de prueba

## 📚 Documentación API

- **Backend 1**: http://localhost:3001/api-docs
- **Backend 2**: http://localhost:5000/api-docs/

## 🔧 Estructura del Proyecto

```
soa-system/
├── client/                 # Cliente PWA (React)
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── services/       # Servicios API
│   │   ├── hooks/          # Hooks personalizados
│   │   ├── types/          # Tipos TypeScript
│   │   └── config/         # Configuración
│   ├── public/            # Archivos públicos PWA
│   └── __tests__/         # Pruebas del cliente
├── backend1/              # Backend 1 (Node.js + MongoDB)
│   ├── models/            # Modelos de datos
│   ├── routes/            # Rutas API
│   ├── middleware/        # Middleware personalizado
│   ├── validators/        # Validadores
│   ├── config/            # Configuración
│   └── __tests__/         # Pruebas del backend
├── backend2/              # Backend 2 (Flask + MySQL)
│   ├── app.py             # Aplicación principal
│   ├── config.py          # Configuración
│   ├── tests/             # Pruebas
│   └── requirements.txt   # Dependencias Python
├── docs/                  # Documentación del proyecto
├── tests/                 # Pruebas de integración
└── README.md
```

## 🎨 Tecnologías Utilizadas

### Frontend
- React 18 + TypeScript
- Vite + PWA Plugin
- TailwindCSS
- React Router
- Axios
- Chart.js / Recharts
- JWT-decode

### Backend 1
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt
- Joi (validación)
- Jest + Supertest
- Swagger

### Backend 2
- Python 3 + Flask
- MySQL + PyMySQL
- Marshmallow (validación)
- Pytest
- Flasgger (Swagger)

### DevOps
- Docker (opcional)
- GitHub Actions (CI/CD)
- ESLint + Prettier

## 🛡️ Seguridad

- Autenticación JWT
- Hasheo de contraseñas (bcrypt)
- Validación de datos
- Rate limiting
- CORS configurado
- Helmet.js (seguridad HTTP)

## 📋 Lista de Cotejo SOA

- [x] 1. HU/CU en Trello
- [x] 2. Diagrama de clases cliente
- [x] 3. Diagrama de clases servidor
- [x] 4. Metodología SCRUM
- [x] 5. Patrón/principio de diseño
- [x] 6. Modelo de datos
- [x] 7. Cliente funcional
- [x] 8. Servidor funcional
- [x] 9. Pruebas (3 por servicio)
- [x] 10. PSP Time Log
- [x] 11. Autoevaluación

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📜 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo de Desarrollo

- [Nombre] - Desarrollador Full Stack
- [Nombre] - Desarrollador Frontend
- [Nombre] - Desarrollador Backend

## 📞 Contacto

- Email: proyecto.soa@example.com
- GitHub: [repository-url]
- Trello: [trello-board-url]