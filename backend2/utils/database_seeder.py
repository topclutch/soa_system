import os
import random
from datetime import datetime, timedelta
import json
import pymysql
from dotenv import load_dotenv

# Carga las variables de entorno
load_dotenv()

# BANCO DE DATOS EXPANDIDO CON 200+ PRODUCTOS REALISTAS
PRODUCT_DATA_BANK = {
    "Smartphones": [
        {"name": "iPhone 15 Pro Max", "brand": "Apple", "search_term": "iphone-15-pro"},
        {"name": "Galaxy S24 Ultra", "brand": "Samsung", "search_term": "samsung-galaxy-s24"},
        {"name": "Pixel 8 Pro", "brand": "Google", "search_term": "google-pixel-8"},
        {"name": "OnePlus 12", "brand": "OnePlus", "search_term": "oneplus-12-phone"},
        {"name": "Xiaomi 14 Ultra", "brand": "Xiaomi", "search_term": "xiaomi-14-ultra"},
        {"name": "iPhone 14", "brand": "Apple", "search_term": "iphone-14-black"},
        {"name": "Galaxy A54", "brand": "Samsung", "search_term": "samsung-galaxy-a54"},
        {"name": "Redmi Note 13", "brand": "Xiaomi", "search_term": "redmi-note-13"},
        {"name": "Huawei P60 Pro", "brand": "Huawei", "search_term": "huawei-p60-pro"},
        {"name": "Nothing Phone 2", "brand": "Nothing", "search_term": "nothing-phone-2"},
        {"name": "Oppo Find X6", "brand": "Oppo", "search_term": "oppo-find-x6"},
        {"name": "Vivo X90 Pro", "brand": "Vivo", "search_term": "vivo-x90-pro"},
        {"name": "Sony Xperia 1 V", "brand": "Sony", "search_term": "sony-xperia-1-v"},
        {"name": "Motorola Edge 40", "brand": "Motorola", "search_term": "motorola-edge-40"},
        {"name": "Realme GT 3", "brand": "Realme", "search_term": "realme-gt-3"},
        {"name": "Honor Magic 5", "brand": "Honor", "search_term": "honor-magic-5"},
        {"name": "Asus ROG Phone 7", "brand": "Asus", "search_term": "asus-rog-phone-7"},
        {"name": "iPhone 13 Mini", "brand": "Apple", "search_term": "iphone-13-mini"},
        {"name": "Galaxy Z Fold 5", "brand": "Samsung", "search_term": "galaxy-z-fold-5"},
        {"name": "Galaxy Z Flip 5", "brand": "Samsung", "search_term": "galaxy-z-flip-5"},
        {"name": "Pixel 7a", "brand": "Google", "search_term": "google-pixel-7a"},
        {"name": "OnePlus Nord 3", "brand": "OnePlus", "search_term": "oneplus-nord-3"},
        {"name": "Xiaomi 13T Pro", "brand": "Xiaomi", "search_term": "xiaomi-13t-pro"},
        {"name": "iPhone SE 2024", "brand": "Apple", "search_term": "iphone-se-2024"},
        {"name": "Galaxy S23 FE", "brand": "Samsung", "search_term": "galaxy-s23-fe"}
    ],
    "Laptops": [
        {"name": "MacBook Pro 16 M3", "brand": "Apple", "search_term": "macbook-pro-16-m3"},
        {"name": "MacBook Air 15 M2", "brand": "Apple", "search_term": "macbook-air-15-m2"},
        {"name": "Dell XPS 13 Plus", "brand": "Dell", "search_term": "dell-xps-13-plus"},
        {"name": "ThinkPad X1 Carbon", "brand": "Lenovo", "search_term": "thinkpad-x1-carbon"},
        {"name": "Surface Laptop 5", "brand": "Microsoft", "search_term": "surface-laptop-5"},
        {"name": "ZenBook Pro 16X", "brand": "Asus", "search_term": "asus-zenbook-pro-16x"},
        {"name": "HP Spectre x360", "brand": "HP", "search_term": "hp-spectre-x360"},
        {"name": "Razer Blade 15", "brand": "Razer", "search_term": "razer-blade-15"},
        {"name": "Legion 7i Gen 8", "brand": "Lenovo", "search_term": "lenovo-legion-7i"},
        {"name": "ROG Zephyrus G16", "brand": "Asus", "search_term": "asus-rog-zephyrus-g16"},
        {"name": "Alienware m18", "brand": "Dell", "search_term": "alienware-m18"},
        {"name": "MSI Creator Z17", "brand": "MSI", "search_term": "msi-creator-z17"},
        {"name": "Framework Laptop 16", "brand": "Framework", "search_term": "framework-laptop-16"},
        {"name": "Acer Swift 5", "brand": "Acer", "search_term": "acer-swift-5"},
        {"name": "LG Gram 17", "brand": "LG", "search_term": "lg-gram-17"},
        {"name": "Huawei MateBook X Pro", "brand": "Huawei", "search_term": "huawei-matebook-x-pro"},
        {"name": "Samsung Galaxy Book 3", "brand": "Samsung", "search_term": "samsung-galaxy-book-3"},
        {"name": "Gigabyte Aero 16", "brand": "Gigabyte", "search_term": "gigabyte-aero-16"},
        {"name": "Origin Chronos", "brand": "Origin PC", "search_term": "origin-chronos-laptop"},
        {"name": "System76 Oryx Pro", "brand": "System76", "search_term": "system76-oryx-pro"},
        {"name": "MacBook Pro 14 M3", "brand": "Apple", "search_term": "macbook-pro-14-m3"},
        {"name": "ThinkPad P1 Gen 6", "brand": "Lenovo", "search_term": "thinkpad-p1-gen-6"},
        {"name": "Surface Pro 9", "brand": "Microsoft", "search_term": "surface-pro-9"},
        {"name": "iPad Pro 12.9 M2", "brand": "Apple", "search_term": "ipad-pro-12-9-m2"},
        {"name": "Galaxy Tab S9 Ultra", "brand": "Samsung", "search_term": "galaxy-tab-s9-ultra"}
    ],
    "Camisetas": [
        {"name": "Camiseta Básica Premium", "brand": "Uniqlo", "search_term": "basic-white-t-shirt"},
        {"name": "Polo Classic Fit", "brand": "Ralph Lauren", "search_term": "polo-ralph-lauren-shirt"},
        {"name": "Camiseta Vintage Rock", "brand": "Urban Outfitters", "search_term": "vintage-rock-t-shirt"},
        {"name": "Henley de Algodón", "brand": "J.Crew", "search_term": "cotton-henley-shirt"},
        {"name": "Camiseta Oversized", "brand": "H&M", "search_term": "oversized-t-shirt"},
        {"name": "Tank Top Deportivo", "brand": "Nike", "search_term": "nike-tank-top"},
        {"name": "Camiseta Rayas Bretón", "brand": "Saint James", "search_term": "breton-stripe-shirt"},
        {"name": "Graphic Tee Anime", "brand": "Hot Topic", "search_term": "anime-graphic-tee"},
        {"name": "Camiseta Tie-Dye", "brand": "Stussy", "search_term": "tie-dye-t-shirt"},
        {"name": "Longsleeve Básico", "brand": "Everlane", "search_term": "long-sleeve-basic-tee"},
        {"name": "Camiseta Crop Top", "brand": "Brandy Melville", "search_term": "crop-top-shirt"},
        {"name": "V-Neck Premium", "brand": "Calvin Klein", "search_term": "v-neck-t-shirt"},
        {"name": "Camiseta Banda Vintage", "brand": "Thrift Store", "search_term": "vintage-band-t-shirt"},
        {"name": "Muscle Tee Gym", "brand": "Gymshark", "search_term": "muscle-tee-gym"},
        {"name": "Camiseta Eco Bambú", "brand": "Patagonia", "search_term": "bamboo-eco-t-shirt"},
        {"name": "Ringer Tee Retro", "brand": "Champion", "search_term": "ringer-t-shirt-retro"},
        {"name": "Camiseta Pocket Tee", "brand": "Carhartt", "search_term": "pocket-t-shirt"},
        {"name": "Thermal Henley", "brand": "L.L.Bean", "search_term": "thermal-henley-shirt"},
        {"name": "Camiseta Mesh Deportiva", "brand": "Under Armour", "search_term": "mesh-sports-shirt"},
        {"name": "Raglan Baseball Tee", "brand": "American Apparel", "search_term": "raglan-baseball-tee"},
        {"name": "Camiseta Lino Verano", "brand": "Massimo Dutti", "search_term": "linen-summer-shirt"},
        {"name": "Hoodie Ligero", "brand": "Supreme", "search_term": "lightweight-hoodie"},
        {"name": "Camiseta Técnica Running", "brand": "Adidas", "search_term": "technical-running-shirt"},
        {"name": "Polo Piqué Clásico", "brand": "Lacoste", "search_term": "classic-pique-polo"},
        {"name": "Camiseta Manga 3/4", "brand": "Zara", "search_term": "three-quarter-sleeve-shirt"}
    ],
    "Pantalones": [
        {"name": "Jeans Skinny Fit", "brand": "Levi's", "search_term": "skinny-fit-jeans"},
        {"name": "Chinos Slim Fit", "brand": "Dockers", "search_term": "slim-fit-chinos"},
        {"name": "Joggers Tech Fleece", "brand": "Nike", "search_term": "tech-fleece-joggers"},
        {"name": "Pantalón Cargo", "brand": "Dickies", "search_term": "cargo-pants"},
        {"name": "Jeans Mom Fit", "brand": "American Eagle", "search_term": "mom-fit-jeans"},
        {"name": "Leggings Yoga", "brand": "Lululemon", "search_term": "yoga-leggings"},
        {"name": "Pantalón Vestir Slim", "brand": "Hugo Boss", "search_term": "slim-dress-pants"},
        {"name": "Shorts Bermuda", "brand": "Tommy Hilfiger", "search_term": "bermuda-shorts"},
        {"name": "Jeans Wide Leg", "brand": "Zara", "search_term": "wide-leg-jeans"},
        {"name": "Pantalón Lino Verano", "brand": "Mango", "search_term": "linen-summer-pants"},
        {"name": "Track Pants Deportivo", "brand": "Adidas", "search_term": "track-pants-sports"},
        {"name": "Jeans High Waist", "brand": "Urban Outfitters", "search_term": "high-waist-jeans"},
        {"name": "Pantalón Cuero", "brand": "AllSaints", "search_term": "leather-pants"},
        {"name": "Shorts Denim", "brand": "H&M", "search_term": "denim-shorts"},
        {"name": "Pantalón Palazzo", "brand": "Free People", "search_term": "palazzo-pants"},
        {"name": "Jeans Boyfriend", "brand": "Gap", "search_term": "boyfriend-jeans"},
        {"name": "Pantalón Pana", "brand": "Cortefiel", "search_term": "corduroy-pants"},
        {"name": "Leggings Compresión", "brand": "Under Armour", "search_term": "compression-leggings"},
        {"name": "Pantalón Plisado", "brand": "COS", "search_term": "pleated-pants"},
        {"name": "Jeans Flare", "brand": "Free People", "search_term": "flare-jeans"},
        {"name": "Pantalón Jogger Lana", "brand": "Everlane", "search_term": "wool-jogger-pants"},
        {"name": "Shorts Ciclista", "brand": "Alo Yoga", "search_term": "bike-shorts"},
        {"name": "Pantalón Pinzas", "brand": "Massimo Dutti", "search_term": "pleated-trousers"},
        {"name": "Jeans Straight Leg", "brand": "Wrangler", "search_term": "straight-leg-jeans"},
        {"name": "Pantalón Cuadros", "brand": "Burberry", "search_term": "checkered-pants"}
    ],
    "Muebles": [
        {"name": "Sofá Seccional Moderno", "brand": "West Elm", "search_term": "modern-sectional-sofa"},
        {"name": "Mesa Centro Mármol", "brand": "CB2", "search_term": "marble-coffee-table"},
        {"name": "Silla Oficina Ergonómica", "brand": "Herman Miller", "search_term": "ergonomic-office-chair"},
        {"name": "Cama King Size", "brand": "IKEA", "search_term": "king-size-bed"},
        {"name": "Estantería Industrial", "brand": "Urban Outfitters", "search_term": "industrial-bookshelf"},
        {"name": "Mesa Comedor Extensible", "brand": "Pottery Barn", "search_term": "extendable-dining-table"},
        {"name": "Sillón Reclinable", "brand": "La-Z-Boy", "search_term": "reclining-armchair"},
        {"name": "Escritorio Standing", "brand": "UPLIFT Desk", "search_term": "standing-desk"},
        {"name": "Cómoda Vintage", "brand": "Restoration Hardware", "search_term": "vintage-dresser"},
        {"name": "Mesa Lateral Nogal", "brand": "Article", "search_term": "walnut-side-table"},
        {"name": "Banco Tapizado", "brand": "Target", "search_term": "upholstered-bench"},
        {"name": "Armario Empotrado", "brand": "California Closets", "search_term": "built-in-wardrobe"},
        {"name": "Mesa TV Flotante", "brand": "IKEA", "search_term": "floating-tv-stand"},
        {"name": "Silla Comedor Tapizada", "brand": "Wayfair", "search_term": "upholstered-dining-chair"},
        {"name": "Otomana Almacenaje", "brand": "HomeGoods", "search_term": "storage-ottoman"},
        {"name": "Mesa Consola Entrada", "brand": "Crate & Barrel", "search_term": "console-table-entryway"},
        {"name": "Silla Gaming RGB", "brand": "Secretlab", "search_term": "rgb-gaming-chair"},
        {"name": "Cama Nido Infantil", "brand": "Pottery Barn Kids", "search_term": "kids-trundle-bed"},
        {"name": "Mesa Plegable", "brand": "IKEA", "search_term": "folding-table"},
        {"name": "Silla Acapulco", "brand": "Design Within Reach", "search_term": "acapulco-chair"},
        {"name": "Estante Esquinero", "brand": "Target", "search_term": "corner-shelf"},
        {"name": "Mesa Picnic Interior", "brand": "Urban Outfitters", "search_term": "indoor-picnic-table"},
        {"name": "Silla Mecedora", "brand": "Nursery Works", "search_term": "rocking-chair"},
        {"name": "Escritorio Esquinero", "brand": "IKEA", "search_term": "corner-desk"},
        {"name": "Banco Bar Industrial", "brand": "World Market", "search_term": "industrial-bar-stool"}
    ],
    "Electrodomésticos": [
        {"name": "Refrigerador French Door", "brand": "Samsung", "search_term": "french-door-refrigerator"},
        {"name": "Lavadora Carga Frontal", "brand": "LG", "search_term": "front-load-washing-machine"},
        {"name": "Horno Convección", "brand": "KitchenAid", "search_term": "convection-oven"},
        {"name": "Lavavajillas Silencioso", "brand": "Bosch", "search_term": "quiet-dishwasher"},
        {"name": "Microondas Inverter", "brand": "Panasonic", "search_term": "inverter-microwave"},
        {"name": "Aspiradora Robot", "brand": "Roomba", "search_term": "robot-vacuum"},
        {"name": "Freidora Aire XL", "brand": "Ninja", "search_term": "xl-air-fryer"},
        {"name": "Batidora Amasadora", "brand": "KitchenAid", "search_term": "stand-mixer"},
        {"name": "Cafetera Espresso", "brand": "Breville", "search_term": "espresso-machine"},
        {"name": "Licuadora Alta Potencia", "brand": "Vitamix", "search_term": "high-power-blender"},
        {"name": "Tostadora 4 Rebanadas", "brand": "Cuisinart", "search_term": "4-slice-toaster"},
        {"name": "Olla Presión Eléctrica", "brand": "Instant Pot", "search_term": "electric-pressure-cooker"},
        {"name": "Purificador Aire", "brand": "Dyson", "search_term": "air-purifier"},
        {"name": "Humidificador Ultrasónico", "brand": "Levoit", "search_term": "ultrasonic-humidifier"},
        {"name": "Ventilador Torre", "brand": "Lasko", "search_term": "tower-fan"},
        {"name": "Calentador Agua", "brand": "Rheem", "search_term": "water-heater"},
        {"name": "Secadora Ropa", "brand": "Whirlpool", "search_term": "clothes-dryer"},
        {"name": "Plancha Vapor", "brand": "Rowenta", "search_term": "steam-iron"},
        {"name": "Procesador Alimentos", "brand": "Cuisinart", "search_term": "food-processor"},
        {"name": "Yogurtera Automática", "brand": "Euro Cuisine", "search_term": "automatic-yogurt-maker"},
        {"name": "Deshidratador Frutas", "brand": "Excalibur", "search_term": "fruit-dehydrator"},
        {"name": "Máquina Pan", "brand": "Zojirushi", "search_term": "bread-machine"},
        {"name": "Extractor Jugos", "brand": "Omega", "search_term": "juice-extractor"},
        {"name": "Vaporera Eléctrica", "brand": "Hamilton Beach", "search_term": "electric-steamer"},
        {"name": "Parrilla Eléctrica", "brand": "George Foreman", "search_term": "electric-grill"}
    ],
    "Fútbol": [
        {"name": "Balón FIFA Pro", "brand": "Adidas", "search_term": "fifa-pro-soccer-ball"},
        {"name": "Tacos Mercurial", "brand": "Nike", "search_term": "mercurial-soccer-cleats"},
        {"name": "Guantes Portero Pro", "brand": "Adidas", "search_term": "goalkeeper-gloves-pro"},
        {"name": "Camiseta Selección", "brand": "Nike", "search_term": "national-team-jersey"},
        {"name": "Shorts Entrenamiento", "brand": "Puma", "search_term": "training-shorts-soccer"},
        {"name": "Medias Compresión", "brand": "Nike", "search_term": "compression-soccer-socks"},
        {"name": "Espinilleras Pro", "brand": "Adidas", "search_term": "professional-shin-guards"},
        {"name": "Bolsa Deportiva", "brand": "Under Armour", "search_term": "soccer-sports-bag"},
        {"name": "Conos Entrenamiento", "brand": "SKLZ", "search_term": "training-cones-soccer"},
        {"name": "Red Portería", "brand": "Franklin Sports", "search_term": "soccer-goal-net"},
        {"name": "Balón Entrenamiento", "brand": "Wilson", "search_term": "training-soccer-ball"},
        {"name": "Tacos Césped Artificial", "brand": "Adidas", "search_term": "artificial-turf-cleats"},
        {"name": "Camiseta Árbitro", "brand": "Official Sports", "search_term": "referee-jersey-soccer"},
        {"name": "Silbato Profesional", "brand": "Fox 40", "search_term": "professional-whistle"},
        {"name": "Marcador Portátil", "brand": "Champion Sports", "search_term": "portable-scoreboard"},
        {"name": "Chaleco Entrenamiento", "brand": "Nike", "search_term": "training-vest-soccer"},
        {"name": "Bomba Balón", "brand": "Spalding", "search_term": "ball-pump-soccer"},
        {"name": "Banderines Córner", "brand": "Kwik Goal", "search_term": "corner-flags-soccer"},
        {"name": "Malla Rebote", "brand": "SKLZ", "search_term": "rebound-net-soccer"},
        {"name": "Escalera Agilidad", "brand": "Yes4All", "search_term": "agility-ladder-soccer"},
        {"name": "Portería Plegable", "brand": "Franklin Sports", "search_term": "portable-soccer-goal"},
        {"name": "Balón Futsal", "brand": "Select", "search_term": "futsal-ball"},
        {"name": "Tacos Indoor", "brand": "Nike", "search_term": "indoor-soccer-shoes"},
        {"name": "Kit Primeros Auxilios", "brand": "Johnson & Johnson", "search_term": "first-aid-kit-sports"},
        {"name": "Cronómetro Digital", "brand": "Casio", "search_term": "digital-stopwatch-sports"}
    ],
    "Ciclismo": [
        {"name": "Bicicleta Ruta Carbono", "brand": "Trek", "search_term": "carbon-road-bike"},
        {"name": "Mountain Bike Full", "brand": "Specialized", "search_term": "full-suspension-mountain-bike"},
        {"name": "Casco Aero", "brand": "Giro", "search_term": "aero-cycling-helmet"},
        {"name": "Pedales Automáticos", "brand": "Shimano", "search_term": "clipless-pedals"},
        {"name": "Ciclocomputadora GPS", "brand": "Garmin", "search_term": "gps-bike-computer"},
        {"name": "Ruedas Carbono", "brand": "Zipp", "search_term": "carbon-bike-wheels"},
        {"name": "Sillín Ergonómico", "brand": "Brooks", "search_term": "ergonomic-bike-saddle"},
        {"name": "Cadena 12 Velocidades", "brand": "SRAM", "search_term": "12-speed-bike-chain"},
        {"name": "Frenos Disco", "brand": "Shimano", "search_term": "disc-brake-bike"},
        {"name": "Manillar Carbono", "brand": "Easton", "search_term": "carbon-handlebars"},
        {"name": "Zapatillas Ruta", "brand": "Specialized", "search_term": "road-cycling-shoes"},
        {"name": "Maillot Ciclismo", "brand": "Castelli", "search_term": "cycling-jersey"},
        {"name": "Culotte Acolchado", "brand": "Pearl Izumi", "search_term": "padded-cycling-shorts"},
        {"name": "Guantes Ciclismo", "brand": "Giro", "search_term": "cycling-gloves"},
        {"name": "Gafas Deportivas", "brand": "Oakley", "search_term": "sports-cycling-glasses"},
        {"name": "Bomba CO2", "brand": "Lezyne", "search_term": "co2-bike-pump"},
        {"name": "Kit Reparación", "brand": "Park Tool", "search_term": "bike-repair-kit"},
        {"name": "Luz Delantera LED", "brand": "Cateye", "search_term": "led-bike-light"},
        {"name": "Luz Trasera", "brand": "Bontrager", "search_term": "rear-bike-light"},
        {"name": "Portabidón Carbono", "brand": "Elite", "search_term": "carbon-bottle-cage"},
        {"name": "Bidón Térmico", "brand": "Camelbak", "search_term": "thermal-water-bottle"},
        {"name": "Rodillo Entrenamiento", "brand": "Wahoo", "search_term": "bike-trainer-roller"},
        {"name": "Soporte Techo", "brand": "Thule", "search_term": "roof-bike-rack"},
        {"name": "Candado U-Lock", "brand": "Kryptonite", "search_term": "u-lock-bike"},
        {"name": "Alforjas Traseras", "brand": "Ortlieb", "search_term": "rear-bike-panniers"}
    ]
}

def get_db_connection_for_seeder(app_config):
    """Establece la conexión con la base de datos MySQL."""
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
        print(f"✅ Conexión a MySQL establecida: {app_config['MYSQL_DB']}")
        return connection
    except Exception as e:
        print(f"❌ Error de conexión a MySQL: {e}")
        return None

def get_pexels_image_url(search_term):
    """Genera URLs de imágenes reales de Pexels sin API key."""
    # URLs reales de Pexels que funcionan sin API key
    pexels_images = {
        # Smartphones
        "iphone-15-pro": "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg",
        "samsung-galaxy-s24": "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg",
        "google-pixel-8": "https://images.pexels.com/photos/1440727/pexels-photo-1440727.jpeg",
        "oneplus-12-phone": "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg",
        "xiaomi-14-ultra": "https://images.pexels.com/photos/1440722/pexels-photo-1440722.jpeg",
        "iphone-14-black": "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg",
        "samsung-galaxy-a54": "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg",
        "redmi-note-13": "https://images.pexels.com/photos/1440727/pexels-photo-1440727.jpeg",
        "huawei-p60-pro": "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg",
        "nothing-phone-2": "https://images.pexels.com/photos/1440722/pexels-photo-1440722.jpeg",
        
        # Laptops
        "macbook-pro-16-m3": "https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg",
        "macbook-air-15-m2": "https://images.pexels.com/photos/18105/pexels-photo.jpg",
        "dell-xps-13-plus": "https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg",
        "thinkpad-x1-carbon": "https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg",
        "surface-laptop-5": "https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg",
        
        # Ropa
        "basic-white-t-shirt": "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg",
        "polo-ralph-lauren-shirt": "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg",
        "vintage-rock-t-shirt": "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg",
        "skinny-fit-jeans": "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg",
        "slim-fit-chinos": "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg",
        
        # Muebles
        "modern-sectional-sofa": "https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg",
        "marble-coffee-table": "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg",
        "ergonomic-office-chair": "https://images.pexels.com/photos/1957477/pexels-photo-1957477.jpeg",
        "king-size-bed": "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg",
        
        # Electrodomésticos
        "french-door-refrigerator": "https://images.pexels.com/photos/2343468/pexels-photo-2343468.jpeg",
        "front-load-washing-machine": "https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg",
        "convection-oven": "https://images.pexels.com/photos/4259140/pexels-photo-4259140.jpeg",
        "robot-vacuum": "https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg",
        
        # Deportes
        "fifa-pro-soccer-ball": "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg",
        "mercurial-soccer-cleats": "https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg",
        "carbon-road-bike": "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg",
        "full-suspension-mountain-bike": "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg"
    }
    
    # Si tenemos una imagen específica, la usamos
    if search_term in pexels_images:
        return pexels_images[search_term]
    
    # URLs genéricas por categoría
    generic_urls = [
        "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg",
        "https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg",
        "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg",
        "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg",
        "https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg",
        "https://images.pexels.com/photos/2343468/pexels-photo-2343468.jpeg",
        "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg",
        "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg"
    ]
    
    # Seleccionar una URL basada en el hash del término de búsqueda
    return generic_urls[hash(search_term) % len(generic_urls)]

def create_tables(cursor):
    """Crea todas las tablas necesarias."""
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subcategories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                UNIQUE KEY unique_subcat_per_category (name, category_id)
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
            )
        """)
        
        print("✅ Tablas creadas correctamente")
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")

def seed_categories(cursor):
    """Puebla las categorías principales."""
    categories = [
        ("Electrónica", "Dispositivos electrónicos, smartphones, laptops y gadgets tecnológicos"),
        ("Ropa", "Prendas de vestir, camisetas, pantalones y accesorios de moda"),
        ("Hogar", "Muebles, electrodomésticos y artículos para el hogar"),
        ("Deportes", "Equipamiento deportivo, ropa deportiva y accesorios para actividades físicas")
    ]
    
    for name, description in categories:
        cursor.execute(
            "INSERT IGNORE INTO categories (name, description) VALUES (%s, %s)",
            (name, description)
        )
    
    print("✅ Categorías creadas")

def seed_subcategories(cursor):
    """Puebla las subcategorías."""
    subcategories = [
        ("Smartphones", 1), ("Laptops", 1),
        ("Camisetas", 2), ("Pantalones", 2),
        ("Muebles", 3), ("Electrodomésticos", 3),
        ("Fútbol", 4), ("Ciclismo", 4)
    ]
    
    for name, category_id in subcategories:
        cursor.execute(
            "INSERT IGNORE INTO subcategories (name, category_id) VALUES (%s, %s)",
            (name, category_id)
        )
    
    print("✅ Subcategorías creadas")

def seed_products(cursor):
    """Puebla la base de datos con 200+ productos realistas."""
    print("🌱 Creando productos realistas...")
    
    # Obtener mapeo de subcategorías
    cursor.execute("SELECT id, name FROM subcategories")
    subcat_map = {row['name']: row['id'] for row in cursor.fetchall()}
    
    products_to_insert = []
    serial_counter = 1000
    
    for subcategory_name, products in PRODUCT_DATA_BANK.items():
        if subcategory_name not in subcat_map:
            continue
            
        subcategory_id = subcat_map[subcategory_name]
        
        for product_info in products:
            # Generar precios realistas
            if subcategory_name == "Smartphones":
                purchase_price = round(random.uniform(300, 800), 2)
            elif subcategory_name == "Laptops":
                purchase_price = round(random.uniform(500, 2000), 2)
            elif subcategory_name in ["Camisetas", "Pantalones"]:
                purchase_price = round(random.uniform(15, 80), 2)
            elif subcategory_name == "Muebles":
                purchase_price = round(random.uniform(100, 1500), 2)
            elif subcategory_name == "Electrodomésticos":
                purchase_price = round(random.uniform(80, 800), 2)
            else:  # Deportes
                purchase_price = round(random.uniform(20, 300), 2)
            
            sale_price = round(purchase_price * random.uniform(1.3, 1.8), 2)
            stock = random.randint(5, 100)
            
            # Generar descripción realista
            description = f"{product_info['name']} de {product_info['brand']} - Producto de alta calidad con excelente relación precio-valor. Ideal para uso diario con garantía de satisfacción. Disponible en stock limitado."
            
            # Especificaciones
            specifications = {
                "marca": product_info["brand"],
                "modelo": product_info["name"],
                "garantia_meses": random.choice([12, 24, 36]),
                "origen": random.choice(["Nacional", "Importado"]),
                "peso_kg": round(random.uniform(0.1, 5.0), 2)
            }
            
            # Número de serie único
            serial_number = f"PRD-{serial_counter:06d}-{random.randint(100, 999)}"
            serial_counter += 1
            
            # URL de imagen
            image_url = get_pexels_image_url(product_info["search_term"])
            
            products_to_insert.append((
                product_info["name"],
                description,
                subcategory_id,
                purchase_price,
                sale_price,
                stock,
                image_url,
                serial_number,
                json.dumps(specifications)
            ))
    
    # Insertar productos en lotes
    cursor.executemany("""
        INSERT INTO products 
        (name, description, subcategory_id, purchase_price, sale_price, stock, image_url, serial_number, specifications)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, products_to_insert)
    
    print(f"✅ {len(products_to_insert)} productos insertados correctamente")

def seed_database(app_config):
    """Función principal que ejecuta todo el proceso de seeding."""
    conn = get_db_connection_for_seeder(app_config)
    if not conn:
        return
    
    try:
        with conn.cursor() as cursor:
            # Deshabilitar verificación de claves foráneas temporalmente
            cursor.execute("SET FOREIGN_KEY_CHECKS=0;")
            
            # Limpiar tablas existentes
            print("🗑️ Limpiando tablas existentes...")
            tables_to_drop = ["products", "subcategories", "categories"]
            for table in tables_to_drop:
                cursor.execute(f"DROP TABLE IF EXISTS {table};")
            
            # Rehabilitar verificación de claves foráneas
            cursor.execute("SET FOREIGN_KEY_CHECKS=1;")
            
            # Crear estructura de tablas
            print("🏗️ Creando estructura de base de datos...")
            create_tables(cursor)
            
            # Poblar datos
            print("🌱 Poblando base de datos...")
            seed_categories(cursor)
            seed_subcategories(cursor)
            seed_products(cursor)
            
        # Confirmar cambios
        conn.commit()
        print("\n🎉 ¡Seeding completado exitosamente!")
        print(f"📊 Base de datos poblada con 200+ productos realistas")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error durante el seeding: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    # Configuración desde variables de entorno
    config = {
        'MYSQL_HOST': os.environ.get('MYSQL_HOST', 'localhost'),
        'MYSQL_USER': os.environ.get('MYSQL_USER', 'root'),
        'MYSQL_PASSWORD': os.environ.get('MYSQL_PASSWORD', ''),
        'MYSQL_DB': os.environ.get('MYSQL_DB', 'soa_products'),
        'MYSQL_PORT': int(os.environ.get('MYSQL_PORT', 3306))
    }
    
    print("🚀 Iniciando seeder de producción...")
    seed_database(config)
