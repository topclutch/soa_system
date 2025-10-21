#!/usr/bin/env python3
"""
Backend 2 - Flask + MySQL (Productos)
Sistema SOA - Gestión de Productos - PRODUCTION READY
"""
from flask_restful import Resource, Api
from flask import request
import os
import pymysql
import jwt
from functools import wraps
from datetime import datetime
from dotenv import load_dotenv
import socket
from flask import Flask, request, jsonify, current_app
from flask_cors import CORS
from flask_restful import Api, Resource
from flasgger import Swagger, swag_from
from marshmallow import Schema, fields, ValidationError

import json
from decimal import Decimal

from services.product_service import (
    get_all_products_service,
    get_product_by_id_service,
    create_product_service,
    update_product_service,
    delete_product_service,
    decrease_stock_service,
    get_categories_service,
    get_subcategories_by_category_service,
    get_db_connection,
    create_category_service,
    create_subcategory_service  # Import new service
)

load_dotenv()

app = Flask(__name__)
# ----------------------
# Configuración de Flask
# ----------------------
# Secret
app.config['SECRET_KEY'] = os.environ.get(
    'JWT_SECRET', 
    'JlpGNqdI-mt4tPavhvUAerYNUcvlOj8lR0Oy-1OzsHU'
)


# Configuración MySQL
app.config['MYSQL_HOST'] = os.environ.get('MYSQL_HOST')
app.config['MYSQL_USER'] = os.environ.get('MYSQL_USER')
app.config['MYSQL_PASSWORD'] = os.environ.get('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.environ.get('MYSQL_DB')
app.config['MYSQL_PORT'] = int(os.environ.get('MYSQL_PORT'))

# Configuración CORS simplificada - Colocar después de la creación de app
frontend_urls = [
    'https://frontendreactvite.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
]

# Agregar URLs del .env
frontend_url_env = os.environ.get('FRONTEND_URL', '')
if frontend_url_env:
    for url in frontend_url_env.split(','):
        url_clean = url.strip().rstrip('/')
        if url_clean and url_clean not in frontend_urls:
            frontend_urls.append(url_clean)

print(f"🌐 CORS configurado para: {frontend_urls}")

# Solo esta configuración CORS - nada más
CORS(app,
     origins=frontend_urls,
     supports_credentials=True,
     methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
     max_age=600)

api = Api(app)

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

app.json.default = CustomJSONEncoder().default

swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api-docs/"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "SOA Backend 2 - Products API",
        "description": "API para gestión de productos, categorías y stock",
        "version": "1.0.0"
    },
    "host": "localhost:5000",
    "basePath": "/api",
    "schemes": ["http"],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'"
        }
    },
    "definitions": {
        "Product": {
            "type": "object",
            "properties": {
                "id": {"type": "integer", "example": 1},
                "name": {"type": "string", "example": "iPhone 15 Pro"},
                "description": {"type": "string", "example": "Smartphone Apple"},
                "subcategory_id": {"type": "integer", "example": 1},
                "purchase_price": {"type": "number", "format": "float", "example": 800.00},
                "sale_price": {"type": "number", "format": "float", "example": 1200.00},
                "stock": {"type": "integer", "example": 10},
                "image_url": {"type": "string", "format": "uri"},
                "serial_number": {"type": "string", "example": "IP15P001"},
                "specifications": {"type": "object"},
                "category_name": {"type": "string", "example": "Electrónicos"},
                "subcategory_name": {"type": "string", "example": "Smartphones"}
            }
        },
        "ErrorResponse": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": False},
                "message": {"type": "string", "example": "Error message"}
            }
        },
        "Category": {
            "type": "object",
            "properties": {
                "id": {"type": "integer", "example": 1},
                "name": {"type": "string", "example": "Electrónicos"},
                "description": {"type": "string", "example": "Productos electrónicos y tecnológicos"}
            }
        },
        "Subcategory": {
            "type": "object",
            "properties": {
                "id": {"type": "integer", "example": 1},
                "name": {"type": "string", "example": "Smartphones"},
                "category_id": {"type": "integer", "example": 1}
            }
        }
    }
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# --- Esquema Marshmallow para Producto ---
class ProductSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 2)
    description = fields.Str(required=False)
    subcategory_id = fields.Int(required=False)  # Made optional
    category_name = fields.Str(required=False)   # Added for frontend compatibility
    subcategory_name = fields.Str(required=False)  # Added for frontend compatibility
    purchase_price = fields.Float(required=True, validate=lambda x: x >= 0)
    sale_price = fields.Float(required=True, validate=lambda x: x >= 0)
    stock = fields.Int(required=True, validate=lambda x: x >= 0)
    image_url = fields.Url(required=False)
    serial_number = fields.Str(required=False)
    specifications = fields.Dict(required=False)


product_schema = ProductSchema()
products_schema = ProductSchema(many=True)

# --- Decoradores para autenticación y autorización ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return {'success': False, 'message': 'Token requerido'}, 401
        
        try:
            # Limpiar el token
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            
            # Decodificar con el mismo secret que Backend 1
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data
            
        except jwt.ExpiredSignatureError:
            return {'success': False, 'message': 'Token expirado', 'code': 'TOKEN_EXPIRED'}, 401
        except jwt.InvalidTokenError as e:
            print(f"Error de token: {e}")
            return {'success': False, 'message': 'Token inválido', 'code': 'INVALID_TOKEN'}, 401
        except Exception as e:
            print(f"Error general de autenticación: {e}")
            return {'success': False, 'message': 'Error de autenticación'}, 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        user_role = current_user.get('role', '')
        if user_role != 'Administrador':
            return {'success': False, 'message': 'Permisos de administrador requeridos'}, 403
        return f(current_user, *args, **kwargs)
    return decorated

def inventory_access_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        user_role = current_user.get('role', '')
        if user_role not in ['Administrador', 'Almacenista']:
            return {'success': False, 'message': 'Permisos de inventario requeridos'}, 403
        return f(current_user, *args, **kwargs)
    return decorated

# --- Recursos de la API ---
class ProductListResource(Resource):
    def get(self):
        """
        Obtener todos los productos
        ---
        tags:
          - Productos
        summary: Listar todos los productos
        description: Obtiene la lista completa de productos disponibles
        responses:
          200:
            description: Lista de productos obtenida exitosamente
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: array
                  items:
                    $ref: '#/definitions/Product'
                count:
                  type: integer
                  example: 50
          500:
            description: Error interno del servidor
            schema:
              $ref: '#/definitions/ErrorResponse'
        """
        try:
            products = get_all_products_service()
            return {'success': True, 'data': products, 'count': len(products)}
        except Exception as e:
            print(f"Error en GET /api/products: {e}")
            return {'success': False, 'message': str(e)}, 500

    @token_required
    @inventory_access_required
    def post(self, current_user):
        """
        Crear nuevo producto
        ---
        tags:
          - Productos
        summary: Crear un nuevo producto
        description: Crea un nuevo producto en el inventario (requiere permisos de inventario)
        security:
          - Bearer: []
        parameters:
          - in: body
            name: product
            description: Datos del producto a crear
            required: true
            schema:
              type: object
              required:
                - name
                - subcategory_id
                - purchase_price
                - sale_price
                - stock
              properties:
                name:
                  type: string
                  example: "iPhone 15 Pro"
                description:
                  type: string
                  example: "Smartphone Apple con 256GB"
                subcategory_id:
                  type: integer
                  example: 1
                purchase_price:
                  type: number
                  format: float
                  example: 800.00
                sale_price:
                  type: number
                  format: float
                  example: 1200.00
                stock:
                  type: integer
                  example: 10
                image_url:
                  type: string
                  format: uri
                  example: "https://example.com/iphone.jpg"
                serial_number:
                  type: string
                  example: "IP15P001"
                specifications:
                  type: object
                  example: {"color": "Negro", "storage": "256GB"}
        responses:
          201:
            description: Producto creado exitosamente
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Producto creado exitosamente"
                data:
                  $ref: '#/definitions/Product'
          400:
            description: Datos inválidos
            schema:
              $ref: '#/definitions/ErrorResponse'
          401:
            description: Token requerido o inválido
            schema:
              $ref: '#/definitions/ErrorResponse'
          403:
            description: Permisos insuficientes
            schema:
              $ref: '#/definitions/ErrorResponse'
          500:
            description: Error interno del servidor
            schema:
              $ref: '#/definitions/ErrorResponse'
        """
        try:
            product_data = product_schema.load(request.json)
        except ValidationError as err:
            return {'success': False, 'message': 'Datos inválidos', 'errors': err.messages}, 400
        except Exception as e:
            return {'success': False, 'message': f'Error procesando el JSON de entrada: {e}'}, 400
        
        try:
            new_product = create_product_service(product_data)
            if not new_product:
                return {'success': False, 'message': 'Error creando producto'}, 500
            
            return {'success': True, 'message': 'Producto creado exitosamente', 'data': new_product}, 201
        except Exception as e:
            print(f"Error en POST /api/products: {e}")
            return {'success': False, 'message': str(e)}, 500

class ProductResource(Resource):
    def get(self, id):
        """
        Obtener producto por ID
        ---
        tags:
          - Productos
        summary: Obtener un producto específico
        description: Obtiene los detalles de un producto por su ID
        parameters:
          - in: path
            name: id
            type: integer
            required: true
            description: ID del producto
            example: 1
        responses:
          200:
            description: Producto encontrado
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '#/definitions/Product'
          404:
            description: Producto no encontrado
            schema:
              $ref: '#/definitions/ErrorResponse'
          500:
            description: Error interno del servidor
            schema:
              $ref: '#/definitions/ErrorResponse'
        """
        try:
            product = get_product_by_id_service(id)
            if not product:
                return {'success': False, 'message': 'Producto no encontrado'}, 404
            
            return {'success': True, 'data': product}
        except Exception as e:
            print(f"Error en GET /api/products/<id>: {e}")
            return {'success': False, 'message': str(e)}, 500

    @token_required
    @inventory_access_required
    def put(self, current_user, id):
        """
        Actualizar producto existente
        ---
        tags:
          - Productos
        summary: Actualizar un producto
        description: Actualiza la información de un producto existente
        parameters:
          - name: id
            in: path
            type: integer
            required: true
            description: ID del producto a actualizar
          - name: body
            in: body
            required: true
            schema:
              $ref: '#/definitions/Product'
        responses:
          200:
            description: Producto actualizado exitosamente
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Producto actualizado exitosamente"
                data:
                  $ref: '#/definitions/Product'
          400:
            description: Datos de entrada inválidos
            schema:
              $ref: '#/definitions/ErrorResponse'
          404:
            description: Producto no encontrado
            schema:
              $ref: '#/definitions/ErrorResponse'
          500:
            description: Error interno del servidor
            schema:
              $ref: '#/definitions/ErrorResponse'
        """
        try:
            product_data = product_schema.load(request.json, partial=True)
        except ValidationError as err:
            error_details = []
            for field, messages in err.messages.items():
                if isinstance(messages, list):
                    error_details.extend([f"{field}: {msg}" for msg in messages])
                else:
                    error_details.append(f"{field}: {messages}")
            
            return {
                'success': False, 
                'message': 'Errores de validación encontrados',
                'errors': error_details,
                'details': err.messages
            }, 400
        
        try:
            updated_product, error_message = update_product_service(id, product_data)
            
            if error_message:
                return {
                    'success': False, 
                    'message': 'Error de validación',
                    'details': error_message
                }, 400
            
            if not updated_product:
                return {
                    'success': False, 
                    'message': 'Producto no encontrado o no se pudo actualizar'
                }, 404

            return {
                'success': True, 
                'message': 'Producto actualizado exitosamente', 
                'data': updated_product
            }
        except Exception as e:
            print(f"Error en PUT /api/products/<id>: {e}")
            return {
                'success': False, 
                'message': 'Error interno del servidor',
                'details': str(e) if current_app.debug else 'Contacte al administrador'
            }, 500

    @token_required
    @admin_required
    def delete(self, current_user, id):
        """
        Eliminar producto
        ---
        tags:
          - Productos
        summary: Eliminar un producto
        description: Elimina un producto del inventario (requiere permisos de administrador)
        security:
          - Bearer: []
        parameters:
          - in: path
            name: id
            type: integer
            required: true
            description: ID del producto a eliminar
            example: 1
        responses:
          200:
            description: Producto eliminado exitosamente
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Producto eliminado exitosamente"
          401:
            description: Token requerido o inválido
            schema:
              $ref: '#/definitions/ErrorResponse'
          403:
            description: Permisos insuficientes (requiere admin)
            schema:
              $ref: '#/definitions/ErrorResponse'
          404:
            description: Producto no encontrado
            schema:
              $ref: '#/definitions/ErrorResponse'
          500:
            description: Error interno del servidor
            schema:
              $ref: '#/definitions/ErrorResponse'
        """
        try:
            deleted = delete_product_service(id)
            if not deleted:
                return {'success': False, 'message': 'Producto no encontrado'}, 404
            return {'success': True, 'message': 'Producto eliminado exitosamente'}, 200
        except Exception as e:
            print(f"Error en DELETE /api/products/<id>: {e}")
            return {'success': False, 'message': str(e)}, 500

class ProductDecreaseStockResource(Resource):
    def patch(self, id):
        """
        Disminuir stock de producto
        ---
        tags:
          - Productos
        summary: Disminuir stock de un producto
        description: Reduce el stock de un producto específico (requiere autenticación)
        security:
          - Bearer: []
        parameters:
          - in: path
            name: id
            type: integer
            required: true
            description: ID del producto
            example: 1
          - in: body
            name: stock_data
            description: Cantidad a disminuir
            required: true
            schema:
              type: object
              required:
                - quantity
              properties:
                quantity:
                  type: integer
                  minimum: 1
                  example: 5
                  description: Cantidad a disminuir del stock
        responses:
          200:
            description: Stock disminuido exitosamente
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Stock disminuido en 5 unidades"
                data:
                  $ref: '#/definitions/Product'
          400:
            description: Cantidad inválida o stock insuficiente
            schema:
              $ref: '#/definitions/ErrorResponse'
          401:
            description: Token requerido o inválido
            schema:
              $ref: '#/definitions/ErrorResponse'
          404:
            description: Producto no encontrado
            schema:
              $ref: '#/definitions/ErrorResponse'
          500:
            description: Error interno del servidor
            schema:
              $ref: '#/definitions/ErrorResponse'
        """
        token = request.headers.get('Authorization')
        if not token:
            return {'success': False, 'message': 'Token requerido'}, 401
        
        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data
                
        except jwt.ExpiredSignatureError:
            return {'success': False, 'message': 'Token expirado'}, 401
        except jwt.InvalidTokenError:
            return {'success': False, 'message': 'Token inválido'}, 401
        
        data = request.get_json() or {}
        quantity = data.get('quantity')
        
        # Validación mejorada
        if not quantity or not isinstance(quantity, int) or quantity <= 0:
            return {
                'success': False,
                'message': 'La cantidad debe ser un entero positivo'
            }, 400

        try:
            updated_product, error = decrease_stock_service(id, quantity)
            
            if error:
                status_code = 400 if "insuficiente" in error.lower() else 404
                return {'success': False, 'message': error}, status_code
            
            return {
                'success': True,
                'data': updated_product,
                'message': f'Stock disminuido en {quantity} unidades'
            }, 200
                
        except Exception as e:
            print(f"Error en PATCH /api/products/<id>/decrease-stock: {e}")
            return {'success': False, 'message': f'Error interno: {str(e)}'}, 500

class CategoryListResource(Resource):
    def get(self):
        """
        Obtener todas las categorías
        ---
        tags:
          - Categorías
        summary: Listar todas las categorías
        description: Obtiene la lista completa de categorías con sus subcategorías
        responses:
          200:
            description: Lista de categorías obtenida exitosamente
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: array
                  items:
                    $ref: '#/definitions/Category'
                count:
                  type: integer
                  example: 10
          500:
            description: Error interno del servidor
            schema:
              $ref: '#/definitions/ErrorResponse'
        """
        try:
            categories = get_categories_service()
            return {'success': True, 'data': categories, 'count': len(categories)}
        except Exception as e:
            print(f"Error en GET /api/categories: {e}")
            return {'success': False, 'message': str(e)}, 500

    @token_required
    @admin_required
    def post(self, current_user):
        """
        Crear nueva categoría
        ---
        tags:
          - Categorías
        summary: Crear una nueva categoría
        description: Crea una nueva categoría (requiere permisos de administrador)
        security:
          - Bearer: []
        parameters:
          - in: body
            name: category
            description: Datos de la categoría a crear
            required: true
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  type: string
                  example: "Electrónicos"
                description:
                  type: string
                  example: "Productos electrónicos y tecnológicos"
        responses:
          201:
            description: Categoría creada exitosamente
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Categoría creada exitosamente"
                data:
                  $ref: '#/definitions/Category'
          400:
            description: Datos inválidos
            schema:
              $ref: '#/definitions/ErrorResponse'
          401:
            description: Token requerido o inválido
            schema:
              $ref: '#/definitions/ErrorResponse'
          403:
            description: Permisos insuficientes
            schema:
              $ref: '#/definitions/ErrorResponse'
          500:
            description: Error interno del servidor
            schema:
              $ref: '#/definitions/ErrorResponse'
        """
        try:
            data = request.get_json()
            if not data or not data.get('name'):
                return {'success': False, 'message': 'Nombre de categoría requerido'}, 400
            
            category, error = create_category_service(
                data['name'].strip(), 
                data.get('description', '').strip()
            )
            
            if error:
                return {'success': False, 'message': error}, 400
            
            return {
                'success': True,
                'message': 'Categoría creada exitosamente',
                'data': category
            }, 201
                
        except Exception as e:
            print(f"Error creating category: {e}")
            return {'success': False, 'message': f'Error interno: {str(e)}'}, 500

class SubcategoryListResource(Resource):
    def get(self, category_id):
        """
        Obtener subcategorías por categoría
        ---
        tags:
          - Categorías
        summary: Obtener subcategorías de una categoría
        description: Obtiene todas las subcategorías que pertenecen a una categoría específica
        parameters:
          - in: path
            name: category_id
            type: integer
            required: true
            description: ID de la categoría
            example: 1
        responses:
          200:
            description: Lista de subcategorías obtenida exitosamente
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: array
                  items:
                    $ref: '#/definitions/Subcategory'
                count:
                  type: integer
                  example: 5
          500:
            description: Error interno del servidor
            schema:
              $ref: '#/definitions/ErrorResponse'
        """
        try:
            subcategories = get_subcategories_by_category_service(category_id)
            return {'success': True, 'data': subcategories, 'count': len(subcategories)}
        except Exception as e:
            print(f"Error en GET /api/categories/<id>/subcategories: {e}")
            return {'success': False, 'message': str(e)}, 500

    @token_required
    def post(self, current_user, category_id):
        """
        Crear nueva subcategoría
        ---
        tags:
          - Categorías
        summary: Crear nueva subcategoría
        description: Crea una nueva subcategoría dentro de una categoría específica
        parameters:
          - in: path
            name: category_id
            type: integer
            required: true
            description: ID de la categoría padre
            example: 1
          - in: body
            name: subcategory
            description: Datos de la subcategoría
            required: true
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  type: string
                  example: "Smartphones"
                  description: Nombre de la subcategoría
        responses:
          201:
            description: Subcategoría creada exitosamente
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Subcategoría creada exitosamente"
                data:
                  $ref: '#/definitions/Subcategory'
          400:
            description: Datos inválidos
            schema:
              $ref: '#/definitions/ErrorResponse'
          500:
            description: Error interno del servidor
            schema:
              $ref: '#/definitions/ErrorResponse'
        """
        try:
            data = request.get_json()
            
            if not data or not data.get('name'):
                return {'success': False, 'message': 'El nombre de la subcategoría es requerido'}, 400
            
            name = data['name'].strip()
            if not name:
                return {'success': False, 'message': 'El nombre de la subcategoría no puede estar vacío'}, 400
            
            # Create subcategory using the service
            subcategory = create_subcategory_service(category_id, name)
            
            return {
                'success': True, 
                'message': 'Subcategoría creada exitosamente',
                'data': subcategory
            }, 201
            
        except ValueError as e:
            return {'success': False, 'message': str(e)}, 400
        except Exception as e:
            print(f"Error en POST /api/categories/<id>/subcategories: {e}")
            return {'success': False, 'message': 'Error interno del servidor'}, 500

class CategoryManagementResource(Resource):
    @token_required
    @admin_required
    def post(self, current_user):
        """
        Crear nueva categoría
        ---
        tags:
          - Categorías
        security:
          - Bearer: []
        parameters:
          - in: body
            name: category
            required: true
            schema:
              type: object
              properties:
                name:
                  type: string
                  example: "Electrónicos"
                description:
                  type: string
                  example: "Productos electrónicos y tecnológicos"
        responses:
          201:
            description: Categoría creada exitosamente
          400:
            description: Datos inválidos
          401:
            description: No autorizado
        """
        try:
            data = request.get_json()
            if not data or not data.get('name'):
                return {'success': False, 'message': 'Nombre de categoría requerido'}, 400
            
            category, error = create_category_service(
                data['name'].strip(), 
                data.get('description', '').strip()
            )
            
            if error:
                return {'success': False, 'message': error}, 400
            
            return {
                'success': True,
                'message': 'Categoría creada exitosamente',
                'data': category
            }, 201
                
        except Exception as e:
            print(f"Error creating category: {e}")
            return {'success': False, 'message': f'Error interno: {str(e)}'}, 500

class ProductStockResource(Resource):
    @token_required
    def get(self, current_user, id):
        """
        Verificar stock de producto en tiempo real
        ---
        tags:
          - Productos
        security:
          - Bearer: []
        parameters:
          - in: path
            name: id
            type: integer
            required: true
            description: ID del producto
        responses:
          200:
            description: Stock del producto
            schema:
              type: object
              properties:
                success:
                  type: boolean
                data:
                  type: object
                  properties:
                    product_id:
                      type: integer
                    name:
                      type: string
                    stock:
                      type: integer
                    available:
                      type: boolean
          404:
            description: Producto no encontrado
        """
        try:
            product = get_product_by_id_service(id)
            if not product:
                return {'error': 'Producto no encontrado'}, 404
            
            return {
                'success': True,
                'data': {
                    'product_id': product['id'],
                    'name': product['name'],
                    'stock': product['stock'],
                    'available': product['stock'] > 0
                }
            }, 200
            
        except Exception as e:
            return {'error': f'Error interno: {str(e)}'}, 500

    @token_required
    @admin_required
    def put(self, current_user, id):
        """
        Actualizar stock específico de producto
        ---
        tags:
          - Productos
        security:
          - Bearer: []
        parameters:
          - in: path
            name: id
            type: integer
            required: true
            description: ID del producto
          - in: body
            name: stock_data
            required: true
            schema:
              type: object
              properties:
                stock:
                  type: integer
                  example: 100
                  description: Nueva cantidad de stock
        responses:
          200:
            description: Stock actualizado exitosamente
          400:
            description: Datos inválidos
          404:
            description: Producto no encontrado
        """
        try:
            data = request.get_json()
            if not data or 'stock' not in data:
                return {'error': 'Cantidad de stock requerida'}, 400
            
            new_stock = data['stock']
            if not isinstance(new_stock, int) or new_stock < 0:
                return {'error': 'Stock debe ser un número entero no negativo'}, 400
            
            connection = get_db_connection()
            if not connection:
                return {'error': 'Error de conexión a la base de datos'}, 500
            
            with connection.cursor() as cursor:
                # Check if product exists
                cursor.execute("SELECT id, name FROM products WHERE id = %s", (id,))
                product = cursor.fetchone()
                if not product:
                    return {'error': 'Producto no encontrado'}, 404
                
                # Update stock
                cursor.execute("UPDATE products SET stock = %s WHERE id = %s", (new_stock, id))
                connection.commit()
                
                return {
                    'success': True,
                    'message': 'Stock actualizado exitosamente',
                    'data': {
                        'product_id': id,
                        'name': product['name'],
                        'new_stock': new_stock
                    }
                }, 200
                
        except Exception as e:
            return {'error': f'Error interno: {str(e)}'}, 500
        finally:
            if 'connection' in locals():
                connection.close()

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'success': False, 'message': 'Solicitud inválida'}), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'Backend 2 funcionando correctamente',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# Registrar recursos
api.add_resource(ProductListResource, '/api/products')
api.add_resource(ProductResource, '/api/products/<int:id>')
api.add_resource(ProductDecreaseStockResource, '/api/products/<int:id>/decrease-stock')
api.add_resource(CategoryListResource, '/api/categories')
api.add_resource(SubcategoryListResource, '/api/categories/<int:category_id>/subcategories')
api.add_resource(CategoryManagementResource, '/api/categories/manage')
api.add_resource(ProductStockResource, '/api/products/<int:id>/stock')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🚀 Backend 2 iniciando en:")
    print(f"   - http://localhost:{port}")
    print(f"   - http://127.0.0.1:{port}")
    print(f"   - http://0.0.0.0:{port}")
    
    # Get network IPs for PWA access
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    print(f"   - http://{local_ip}:{port}")
    
    print(f"📚 Swagger disponible en: http://localhost:{port}/api-docs/")
    
    app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
