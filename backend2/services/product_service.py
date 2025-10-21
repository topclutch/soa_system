import pymysql
from decimal import Decimal
import json
from flask import current_app

def get_db_connection():
    """Get database connection using Flask app config"""
    try:
        connection = pymysql.connect(
            host=current_app.config['MYSQL_HOST'],
            user=current_app.config['MYSQL_USER'],
            password=current_app.config['MYSQL_PASSWORD'],
            database=current_app.config['MYSQL_DB'],
            port=current_app.config['MYSQL_PORT'],
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False  # Ensure manual transaction control
        )
        return connection
    except Exception as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return None

def convert_decimals(data):
    """Convert Decimal objects to float for JSON serialization"""
    if isinstance(data, list):
        return [convert_decimals(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_decimals(value) for key, value in data.items()}
    elif isinstance(data, Decimal):
        return float(data)
    return data

def get_or_create_subcategory(category_name, subcategory_name="General"):
    """Get or create category and subcategory, return subcategory_id"""
    connection = get_db_connection()
    if not connection:
        return None, "Error de conexión a la base de datos"
    
    try:
        with connection.cursor() as cursor:
            # Get or create category
            cursor.execute("SELECT id FROM categories WHERE name = %s", (category_name,))
            category = cursor.fetchone()
            
            if not category:
                # Create new category
                cursor.execute(
                    "INSERT INTO categories (name, description) VALUES (%s, %s)",
                    (category_name, f"Categoría {category_name}")
                )
                category_id = cursor.lastrowid
            else:
                category_id = category['id']
            
            # Get or create subcategory
            cursor.execute(
                "SELECT id FROM subcategories WHERE name = %s AND category_id = %s",
                (subcategory_name, category_id)
            )
            subcategory = cursor.fetchone()
            
            if not subcategory:
                # Create new subcategory
                cursor.execute(
                    "INSERT INTO subcategories (name, category_id) VALUES (%s, %s)",
                    (subcategory_name, category_id)
                )
                subcategory_id = cursor.lastrowid
            else:
                subcategory_id = subcategory['id']
            
            connection.commit()
            return subcategory_id, None
            
    except Exception as e:
        connection.rollback()
        print(f"Error creating category/subcategory: {e}")
        return None, f"Error creando categoría/subcategoría: {str(e)}"
    finally:
        connection.close()

def get_or_create_subcategory_atomic(cursor, category_name, subcategory_name="General"):
    """Get or create category and subcategory within existing transaction"""
    try:
        # Get or create category
        cursor.execute("SELECT id FROM categories WHERE name = %s", (category_name,))
        category = cursor.fetchone()
        
        if not category:
            # Create new category
            cursor.execute(
                "INSERT INTO categories (name, description) VALUES (%s, %s)",
                (category_name, f"Categoría {category_name}")
            )
            category_id = cursor.lastrowid
        else:
            category_id = category['id']
        
        # Get or create subcategory
        cursor.execute(
            "SELECT id FROM subcategories WHERE name = %s AND category_id = %s",
            (subcategory_name, category_id)
        )
        subcategory = cursor.fetchone()
        
        if not subcategory:
            # Create new subcategory
            cursor.execute(
                "INSERT INTO subcategories (name, category_id) VALUES (%s, %s)",
                (subcategory_name, category_id)
            )
            subcategory_id = cursor.lastrowid
        else:
            subcategory_id = subcategory['id']
        
        return subcategory_id, None
        
    except Exception as e:
        print(f"Error creating category/subcategory: {e}")
        return None, f"Error creando categoría/subcategoría: {str(e)}"

def get_all_products_service():
    """Get all products with categories and subcategories"""
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    p.id, p.name, p.description, p.purchase_price, p.sale_price, 
                    p.stock, p.image_url, p.serial_number, p.specifications,
                    s.name as subcategory_name,
                    c.name as category_name
                FROM products p
                LEFT JOIN subcategories s ON p.subcategory_id = s.id
                LEFT JOIN categories c ON s.category_id = c.id
                ORDER BY p.id DESC
            """)
            products = cursor.fetchall()
            
            # Convert specifications JSON string back to dict
            for product in products:
                if product.get('specifications'):
                    try:
                        product['specifications'] = json.loads(product['specifications'])
                    except (json.JSONDecodeError, TypeError):
                        product['specifications'] = {}
            
            return convert_decimals(products)
    except Exception as e:
        print(f"Error getting all products: {e}")
        return []
    finally:
        connection.close()

def get_product_by_id_service(product_id):
    """Get product by ID with category information"""
    connection = get_db_connection()
    if not connection:
        return None
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    p.id, p.name, p.description, p.purchase_price, p.sale_price, 
                    p.stock, p.image_url, p.serial_number, p.specifications,
                    s.name as subcategory_name, s.id as subcategory_id,
                    c.name as category_name, c.id as category_id
                FROM products p
                LEFT JOIN subcategories s ON p.subcategory_id = s.id
                LEFT JOIN categories c ON s.category_id = c.id
                WHERE p.id = %s
            """, (product_id,))
            product = cursor.fetchone()
            
            if product and product.get('specifications'):
                try:
                    product['specifications'] = json.loads(product['specifications'])
                except (json.JSONDecodeError, TypeError):
                    product['specifications'] = {}
            
            return convert_decimals(product) if product else None
    except Exception as e:
        print(f"Error getting product by ID: {e}")
        return None
    finally:
        connection.close()

def create_product_service(data):
    """Create new product with atomic category/subcategory handling"""
    connection = get_db_connection()
    if not connection:
        return None
    
    try:
        connection.begin()
        
        with connection.cursor() as cursor:
            # Handle category/subcategory creation within same transaction
            if 'category_name' in data and 'subcategory_name' in data:
                subcategory_id, error = get_or_create_subcategory_atomic(
                    cursor,
                    data['category_name'], 
                    data.get('subcategory_name', 'General')
                )
                if error:
                    raise Exception(error)
                data['subcategory_id'] = subcategory_id
            elif 'subcategory_id' not in data:
                raise Exception("Se requiere subcategory_id o category_name")
            
            specifications_json = json.dumps(data.get('specifications', {}))
            
            query = """
                INSERT INTO products 
                (name, description, subcategory_id, purchase_price, sale_price, 
                 stock, image_url, serial_number, specifications)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                data['name'],
                data.get('description', ''),
                data['subcategory_id'],
                data['purchase_price'],
                data['sale_price'],
                data.get('stock', 0),
                data.get('image_url', ''),
                data.get('serial_number', ''),
                specifications_json
            ))
            product_id = cursor.lastrowid
            
            connection.commit()
            
            # Return the created product
            return get_product_by_id_service(product_id)
            
    except Exception as e:
        connection.rollback()
        print(f"Error creating product: {e}")
        return None
    finally:
        connection.close()

def update_product_service(product_id, data):
    """Update existing product with enhanced validation and category handling"""
    connection = get_db_connection()
    if not connection:
        return None, "Error de conexión a la base de datos"
    
    try:
        connection.begin()
        
        with connection.cursor() as cursor:
            # Check if product exists
            cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
            if not cursor.fetchone():
                return None, "Producto no encontrado"
            
            validation_errors = []
            
            # Validate name
            if 'name' in data:
                if not data['name'] or len(data['name'].strip()) < 2:
                    validation_errors.append("El nombre debe tener al menos 2 caracteres")
                elif len(data['name']) > 255:
                    validation_errors.append("El nombre no puede exceder 255 caracteres")
            
            # Validate prices
            if 'purchase_price' in data:
                try:
                    price = float(data['purchase_price'])
                    if price < 0:
                        validation_errors.append("El precio de compra no puede ser negativo")
                except (ValueError, TypeError):
                    validation_errors.append("El precio de compra debe ser un número válido")
            
            if 'sale_price' in data:
                try:
                    price = float(data['sale_price'])
                    if price < 0:
                        validation_errors.append("El precio de venta no puede ser negativo")
                except (ValueError, TypeError):
                    validation_errors.append("El precio de venta debe ser un número válido")
            
            # Validate stock
            if 'stock' in data:
                try:
                    stock = int(data['stock'])
                    if stock < 0:
                        validation_errors.append("El stock no puede ser negativo")
                except (ValueError, TypeError):
                    validation_errors.append("El stock debe ser un número entero válido")
            
            # Handle category/subcategory update atomically
            if 'category_name' in data:
                subcategory_id, error = get_or_create_subcategory_atomic(
                    cursor,
                    data['category_name'], 
                    data.get('subcategory_name', 'General')
                )
                if error:
                    validation_errors.append(error)
                else:
                    data['subcategory_id'] = subcategory_id
            
            # Validate subcategory exists
            if 'subcategory_id' in data:
                cursor.execute("SELECT id FROM subcategories WHERE id = %s", (data['subcategory_id'],))
                if not cursor.fetchone():
                    validation_errors.append("La subcategoría especificada no existe")
            
            if validation_errors:
                return None, "; ".join(validation_errors)
            
            set_clauses = []
            values = []
            
            allowed_fields = [
                'name', 'description', 'subcategory_id', 'purchase_price', 
                'sale_price', 'stock', 'image_url', 'serial_number'
            ]
            
            for field in allowed_fields:
                if field in data:
                    set_clauses.append(f"{field} = %s")
                    values.append(data[field])
            
            # Handle specifications separately
            if 'specifications' in data:
                set_clauses.append("specifications = %s")
                values.append(json.dumps(data['specifications']))
            
            if not set_clauses:
                return get_product_by_id_service(product_id), None
            
            query = f"UPDATE products SET {', '.join(set_clauses)} WHERE id = %s"
            values.append(product_id)
            
            cursor.execute(query, tuple(values))
            connection.commit()
            
            return get_product_by_id_service(product_id), None
    except Exception as e:
        connection.rollback()
        print(f"Error updating product: {e}")
        return None, f"Error interno del servidor: {str(e)}"
    finally:
        connection.close()

def delete_product_service(product_id):
    """Delete product by ID"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
            deleted = cursor.rowcount > 0
            connection.commit()
            return deleted
    except Exception as e:
        connection.rollback()
        print(f"Error deleting product: {e}")
        return False
    finally:
        connection.close()

def decrease_stock_service(product_id, quantity):
    """
    Decrease product stock
    Returns: (updated_product, error_message) 
    """
    connection = get_db_connection()
    if not connection:
        return None, "Error de conexión a la base de datos"
    
    try:
        with connection.cursor() as cursor:
            # Get current product
            cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            product = cursor.fetchone()
            if not product:
                return None, "Producto no encontrado"
            
            # Check sufficient stock
            if product['stock'] < quantity:
                return None, f"Stock insuficiente. Disponible: {product['stock']}"
            
            # Update stock
            new_stock = product['stock'] - quantity
            cursor.execute("UPDATE products SET stock = %s WHERE id = %s", (new_stock, product_id))
            connection.commit()
            
            # Return updated product
            updated_product = get_product_by_id_service(product_id)
            return updated_product, None
            
    except Exception as e:
        connection.rollback()
        print(f"Error decreasing stock: {e}")
        return None, f"Error interno: {str(e)}"
    finally:
        connection.close()

def get_categories_service():
    """Get all categories with subcategories"""
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT c.id, c.name, c.description,
                       GROUP_CONCAT(
                           CONCAT('{"id":', COALESCE(s.id, 'null'), ',"name":"', COALESCE(s.name, ''), '"}')
                           SEPARATOR ','
                       ) as subcategories_json
                FROM categories c
                LEFT JOIN subcategories s ON c.id = s.category_id
                GROUP BY c.id, c.name, c.description
                ORDER BY c.name
            """)
            categories = cursor.fetchall()
            
            # Parse subcategories from GROUP_CONCAT result
            for category in categories:
                if category['subcategories_json']:
                    try:
                        # Build proper JSON array from GROUP_CONCAT result
                        subcats_str = f"[{category['subcategories_json']}]"
                        subcats = json.loads(subcats_str)
                        # Filter out null subcategories
                        category['subcategories'] = [s for s in subcats if s['id'] is not None]
                    except (json.JSONDecodeError, TypeError):
                        category['subcategories'] = []
                else:
                    category['subcategories'] = []
                
                # Remove the temporary field
                del category['subcategories_json']
            
            return categories
    except Exception as e:
        print(f"Error getting categories: {e}")
        return []
    finally:
        connection.close()

def get_subcategories_by_category_service(category_id):
    """Get subcategories for a specific category"""
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, category_id
                FROM subcategories
                WHERE category_id = %s
                ORDER BY name
            """, (category_id,))
            return cursor.fetchall()
    except Exception as e:
        print(f"Error getting subcategories: {e}")
        return []
    finally:
        connection.close()

def create_category_service(name, description=""):
    """Create new category"""
    connection = get_db_connection()
    if not connection:
        return None, "Error de conexión a la base de datos"
    
    try:
        with connection.cursor() as cursor:
            # Check if category already exists
            cursor.execute("SELECT id FROM categories WHERE name = %s", (name,))
            if cursor.fetchone():
                return None, "La categoría ya existe"
            
            # Create new category
            cursor.execute(
                "INSERT INTO categories (name, description, created_at) VALUES (%s, %s, NOW())",
                (name, description)
            )
            category_id = cursor.lastrowid
            connection.commit()
            
            # Return created category
            cursor.execute("SELECT * FROM categories WHERE id = %s", (category_id,))
            category = cursor.fetchone()
            
            return category, None
            
    except Exception as e:
        connection.rollback()
        print(f"Error creating category: {e}")
        return None, f"Error creando categoría: {str(e)}"
    finally:
        connection.close()

def create_subcategory_service(category_id, name):
    """Create new subcategory for a specific category"""
    connection = get_db_connection()
    if not connection:
        raise Exception("Error de conexión a la base de datos")
    
    try:
        with connection.cursor() as cursor:
            # Check if category exists
            cursor.execute("SELECT id FROM categories WHERE id = %s", (category_id,))
            if not cursor.fetchone():
                raise ValueError("La categoría especificada no existe")
            
            # Check if subcategory already exists in this category
            cursor.execute(
                "SELECT id FROM subcategories WHERE name = %s AND category_id = %s", 
                (name, category_id)
            )
            if cursor.fetchone():
                raise ValueError("La subcategoría ya existe en esta categoría")
            
            # Create new subcategory
            cursor.execute(
                "INSERT INTO subcategories (name, category_id) VALUES (%s, %s)",
                (name, category_id)
            )
            subcategory_id = cursor.lastrowid
            connection.commit()
            
            # Return created subcategory
            cursor.execute(
                "SELECT id, name, category_id FROM subcategories WHERE id = %s", 
                (subcategory_id,)
            )
            subcategory = cursor.fetchone()
            
            return subcategory
            
    except Exception as e:
        connection.rollback()
        print(f"Error creating subcategory: {e}")
        raise
    finally:
        connection.close()