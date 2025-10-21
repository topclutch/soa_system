import os
import random
from datetime import datetime
import json
import pymysql
from dotenv import load_dotenv

load_dotenv()

def get_db_connection_for_seeder(app_config):
    try:
        connection = pymysql.connect(
            host=app_config['MYSQL_HOST'],
            user=app_config['MYSQL_USER'],
            password=app_config['MYSQL_PASSWORD'],
            database=app_config['MYSQL_DB'],
            port=app_config['MYSQL_PORT'],
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        print(f"✅ Conexión a MySQL en {app_config['MYSQL_DB']}")
        return connection
    except Exception as e:
        print(f"❌ Error conexión MySQL: {e}")
        return None

def create_tables(cursor):
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subcategories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category_id INT NOT NULL,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                subcategory_id INT NOT NULL,
                purchase_price DECIMAL(10, 2) NOT NULL,
                sale_price DECIMAL(10, 2) NOT NULL,
                stock INT NOT NULL DEFAULT 0,
                image_url VARCHAR(500),
                serial_number VARCHAR(100) UNIQUE,
                specifications JSON,
                FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS category_attributes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category_id INT NOT NULL,
                attribute_name VARCHAR(100) NOT NULL,
                attribute_type ENUM('text', 'number', 'boolean', 'date') NOT NULL DEFAULT 'text',
                required BOOLEAN NOT NULL DEFAULT false,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_attributes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                attribute_id INT NOT NULL,
                value TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (attribute_id) REFERENCES category_attributes(id) ON DELETE CASCADE
            )
        """)
        print("✅ Tablas listas.")
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")

def seed_categories(cursor):
    categories = [
        ("Electrónica", "Dispositivos electrónicos y gadgets"),
        ("Ropa", "Prendas de vestir"),
        ("Hogar", "Artículos para el hogar"),
        ("Deportes", "Equipamiento y accesorios deportivos")
    ]
    cursor.executemany("INSERT IGNORE INTO categories (name, description) VALUES (%s, %s)", categories)

def seed_subcategories(cursor):
    subcats = [
        ("Smartphones", 1), ("Laptops", 1),
        ("Camisetas", 2), ("Pantalones", 2),
        ("Muebles", 3), ("Electrodomésticos", 3),
        ("Fútbol", 4), ("Ciclismo", 4)
    ]
    cursor.executemany("INSERT IGNORE INTO subcategories (name, category_id) VALUES (%s, %s)", subcats)

def seed_category_attributes(cursor):
    attrs = {
        1: [("Marca", "text", True), ("Modelo", "text", True), ("Número de serie", "text", True), ("Garantía (meses)", "number", True)],
        2: [("Talla", "text", True), ("Color", "text", True), ("Material", "text", True)],
        3: [("Material", "text", True), ("Dimensiones", "text", False)],
        4: [("Tamaño", "text", True), ("Peso (kg)", "number", False)]
    }
    for cat_id, attr_list in attrs.items():
        for name, type_, req in attr_list:
            cursor.execute(
                "INSERT IGNORE INTO category_attributes (category_id, attribute_name, attribute_type, required) VALUES (%s, %s, %s, %s)",
                (cat_id, name, type_, req)
            )

def seed_products(cursor, min_products=200):
    cursor.execute("SELECT id FROM subcategories")
    subcat_ids = [r['id'] for r in cursor.fetchall()]
    products = []
    for i in range(min_products):
        sub_id = random.choice(subcat_ids)
        purchase = round(random.uniform(50, 2000), 2)
        sale = round(purchase * random.uniform(1.2, 2.5), 2)
        serial = f"SN-{random.randint(100000, 999999)}"
        products.append((
            f"Producto {i+1}",
            f"Descripción del producto {i+1}",
            sub_id,
            purchase, sale, random.randint(1, 100),
            "https://via.placeholder.com/150",
            serial,
            json.dumps({"peso": f"{random.uniform(0.1, 5):.2f} kg"})
        ))
    cursor.executemany("""
        INSERT INTO products (name, description, subcategory_id, purchase_price, sale_price, stock, image_url, serial_number, specifications)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, products)

def seed_database(app_config):
    conn = get_db_connection_for_seeder(app_config)
    if not conn: return
    try:
        with conn.cursor() as cursor:
            create_tables(cursor)
            cursor.execute("SET FOREIGN_KEY_CHECKS=0")
            for t in ["product_attributes","products","category_attributes","subcategories","categories"]:
                cursor.execute(f"TRUNCATE TABLE {t}")
            cursor.execute("SET FOREIGN_KEY_CHECKS=1")
            seed_categories(cursor)
            seed_subcategories(cursor)
            seed_category_attributes(cursor)
            seed_products(cursor)
        conn.commit()
        print("🎉 MySQL seeding completado.")
    except Exception as e:
        conn.rollback()
        print(f"❌ Error seeding MySQL: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    config = {
        'MYSQL_HOST': os.environ.get('MYSQL_HOST', 'localhost'),
        'MYSQL_USER': os.environ.get('MYSQL_USER', 'root'),
        'MYSQL_PASSWORD': os.environ.get('MYSQL_PASSWORD', ''),
        'MYSQL_DB': os.environ.get('MYSQL_DB', 'soa_products'),
        'MYSQL_PORT': int(os.environ.get('MYSQL_PORT', 3306))
    }
    seed_database(config)
