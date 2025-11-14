# CRUD Spring Boot Application

Aplicación CRUD completa desarrollada con Spring Boot para la gestión de productos.

## Características

- **CREATE**: Crear nuevos productos
- **READ**: Obtener todos los productos, buscar por ID o por nombre
- **UPDATE**: Actualizar productos existentes
- **DELETE**: Eliminar productos por ID o eliminar todos

## Tecnologías Utilizadas

- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- H2 Database (base de datos en memoria)
- Maven

## Estructura del Proyecto

```
src/
├── main/
│   ├── java/com/example/crud/
│   │   ├── controller/
│   │   │   └── ProductController.java
│   │   ├── entity/
│   │   │   └── Product.java
│   │   ├── repository/
│   │   │   └── ProductRepository.java
│   │   ├── service/
│   │   │   └── ProductService.java
│   │   └── CrudApplication.java
│   └── resources/
│       └── application.properties
└── pom.xml
```

## Instalación y Ejecución

### Requisitos Previos

- Java 17 o superior
- Maven 3.6 o superior

### Pasos para Ejecutar

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd primerRepo
```

2. Compilar el proyecto:
```bash
mvn clean install
```

3. Ejecutar la aplicación:
```bash
mvn spring-boot:run
```

La aplicación se ejecutará en: `http://localhost:8080`

## API Endpoints

### Base URL
```
http://localhost:8080/api/products
```

### Endpoints Disponibles

#### 1. Crear Producto (CREATE)
**POST** `/api/products`

Request Body:
```json
{
  "name": "Laptop",
  "description": "Laptop de alta gama",
  "price": 1299.99,
  "stock": 10
}
```

Response: `201 Created`
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "Laptop de alta gama",
  "price": 1299.99,
  "stock": 10,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T10:30:00"
}
```

#### 2. Obtener Todos los Productos (READ)
**GET** `/api/products`

Response: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Laptop",
    "description": "Laptop de alta gama",
    "price": 1299.99,
    "stock": 10,
    "createdAt": "2025-11-14T10:30:00",
    "updatedAt": "2025-11-14T10:30:00"
  }
]
```

#### 3. Obtener Producto por ID (READ)
**GET** `/api/products/{id}`

Response: `200 OK`
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "Laptop de alta gama",
  "price": 1299.99,
  "stock": 10,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T10:30:00"
}
```

#### 4. Buscar Productos por Nombre (READ)
**GET** `/api/products/search?name=laptop`

Response: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Laptop",
    "description": "Laptop de alta gama",
    "price": 1299.99,
    "stock": 10,
    "createdAt": "2025-11-14T10:30:00",
    "updatedAt": "2025-11-14T10:30:00"
  }
]
```

#### 5. Actualizar Producto (UPDATE)
**PUT** `/api/products/{id}`

Request Body:
```json
{
  "name": "Laptop Actualizada",
  "description": "Laptop con mejoras",
  "price": 1499.99,
  "stock": 15
}
```

Response: `200 OK`
```json
{
  "id": 1,
  "name": "Laptop Actualizada",
  "description": "Laptop con mejoras",
  "price": 1499.99,
  "stock": 15,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T11:00:00"
}
```

#### 6. Eliminar Producto (DELETE)
**DELETE** `/api/products/{id}`

Response: `204 No Content`

#### 7. Eliminar Todos los Productos (DELETE)
**DELETE** `/api/products`

Response: `204 No Content`

## Consola H2 Database

La aplicación incluye una consola H2 para visualizar y gestionar la base de datos:

URL: `http://localhost:8080/h2-console`

Credenciales:
- **JDBC URL**: `jdbc:h2:mem:productdb`
- **Username**: `sa`
- **Password**: (dejar vacío)

## Modelo de Datos

### Product Entity

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Long | Identificador único (auto-generado) |
| name | String | Nombre del producto (máx. 100 caracteres) |
| description | String | Descripción del producto (máx. 500 caracteres) |
| price | BigDecimal | Precio del producto (10 dígitos, 2 decimales) |
| stock | Integer | Cantidad en stock |
| createdAt | LocalDateTime | Fecha de creación (auto-generado) |
| updatedAt | LocalDateTime | Fecha de última actualización (auto-actualizado) |

## Ejemplos de Uso con cURL

### Crear un producto:
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","description":"Laptop de alta gama","price":1299.99,"stock":10}'
```

### Obtener todos los productos:
```bash
curl -X GET http://localhost:8080/api/products
```

### Obtener un producto por ID:
```bash
curl -X GET http://localhost:8080/api/products/1
```

### Buscar productos:
```bash
curl -X GET "http://localhost:8080/api/products/search?name=laptop"
```

### Actualizar un producto:
```bash
curl -X PUT http://localhost:8080/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop Pro","description":"Laptop mejorada","price":1499.99,"stock":15}'
```

### Eliminar un producto:
```bash
curl -X DELETE http://localhost:8080/api/products/1
```

## Licencia

Este proyecto está bajo la licencia MIT.