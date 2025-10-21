from flasgger import Swagger

def setup_swagger(app):
    """Configurar Swagger para Backend 2"""
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
            "title": "SOA Backend 2 API - Productos",
            "description": "API REST para gestión de productos, categorías y stock",
            "version": "1.0.0",
            "contact": {
                "name": "SOA System",
                "email": "admin@soasystem.com"
            }
        },
        "host": "localhost:5000",
        "basePath": "/",
        "schemes": ["http", "https"],
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
                    "id": {"type": "integer", "description": "ID único del producto"},
                    "name": {"type": "string", "description": "Nombre del producto"},
                    "description": {"type": "string", "description": "Descripción del producto"},
                    "subcategory_id": {"type": "integer", "description": "ID de la subcategoría"},
                    "category_name": {"type": "string", "description": "Nombre de la categoría"},
                    "subcategory_name": {"type": "string", "description": "Nombre de la subcategoría"},
                    "purchase_price": {"type": "number", "format": "float", "description": "Precio de compra"},
                    "sale_price": {"type": "number", "format": "float", "description": "Precio de venta"},
                    "stock": {"type": "integer", "description": "Cantidad en stock"},
                    "image_url": {"type": "string", "format": "uri", "description": "URL de la imagen"},
                    "serial_number": {"type": "string", "description": "Número de serie"},
                    "specifications": {"type": "object", "description": "Especificaciones técnicas"},
                    "created_at": {"type": "string", "format": "date-time"},
                    "updated_at": {"type": "string", "format": "date-time"}
                }
            },
            "Category": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "subcategories": {
                        "type": "array",
                        "items": {"$ref": "#/definitions/Subcategory"}
                    }
                }
            },
            "Subcategory": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "category_id": {"type": "integer"}
                }
            },
            "ApiResponse": {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "data": {"type": "object"},
                    "count": {"type": "integer"}
                }
            },
            "ErrorResponse": {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean", "example": False},
                    "message": {"type": "string"},
                    "errors": {"type": "object"}
                }
            }
        }
    }

    return Swagger(app, config=swagger_config, template=swagger_template)
