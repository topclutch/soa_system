from flask import Blueprint, request, jsonify
from services.product_service import (
    get_all_products_service,
    get_product_by_id_service,
    create_product_service,
    update_product_service,
    delete_product_service,
    decrease_stock_service,
    get_categories_service,
    get_subcategories_by_category_service
)
from marshmallow import Schema, fields, ValidationError

class ProductSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=lambda x: len(x) >= 2)
    description = fields.Str(required=False)
    subcategory_id = fields.Int(required=True)
    purchase_price = fields.Float(required=True, validate=lambda x: x >= 0)
    sale_price = fields.Float(required=True, validate=lambda x: x >= 0)
    stock = fields.Int(required=True, validate=lambda x: x >= 0)
    image_url = fields.Url(required=False)
    serial_number = fields.Str(required=False)
    specifications = fields.Dict(required=False)

product_schema = ProductSchema()

product_bp = Blueprint('products', __name__, url_prefix='/api/products')

@product_bp.route('', methods=['GET'])
def get_all_products():
    """Get all products with category information"""
    try:
        products = get_all_products_service()
        return jsonify({'success': True, 'data': products, 'count': len(products)}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@product_bp.route('/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    """Get product by ID with category information"""
    try:
        product = get_product_by_id_service(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Producto no encontrado'}), 404
        return jsonify({'success': True, 'data': product}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@product_bp.route('', methods=['POST'])
def create_product():
    """Create new product"""
    try:
        data = product_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Datos inválidos', 'errors': err.messages}), 400
    
    try:
        new_product = create_product_service(data)
        if not new_product:
            return jsonify({'success': False, 'message': 'Error creando producto'}), 500
        return jsonify({'success': True, 'data': new_product}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@product_bp.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Update existing product"""
    try:
        data = product_schema.load(request.get_json() or {}, partial=True)
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Datos inválidos', 'errors': err.messages}), 400
    
    try:
        updated = update_product_service(product_id, data)
        if not updated:
            return jsonify({'success': False, 'message': 'Producto no encontrado'}), 404
        return jsonify({'success': True, 'data': updated}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@product_bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete product"""
    try:
        deleted = delete_product_service(product_id)
        if not deleted:
            return jsonify({'success': False, 'message': 'Producto no encontrado'}), 404
        return jsonify({'success': True, 'message': 'Producto eliminado'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@product_bp.route('/<int:product_id>/decrease-stock', methods=['PATCH'])
def decrease_stock(product_id):
    """Decrease product stock"""
    data = request.get_json() or {}
    quantity = data.get('quantity')
    
    if not quantity or not isinstance(quantity, int) or quantity <= 0:
        return jsonify({
            'success': False,
            'message': 'La cantidad debe ser un entero positivo'
        }), 400

    try:
        result, error = decrease_stock_service(product_id, quantity)
        
        if error:
            status_code = 400 if "insuficiente" in error.lower() else 404
            return jsonify({'success': False, 'message': error}), status_code
        
        return jsonify({
            'success': True,
            'data': result,
            'message': f'Stock disminuido en {quantity} unidades'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@product_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all categories with subcategories"""
    try:
        categories = get_categories_service()
        return jsonify({'success': True, 'data': categories, 'count': len(categories)}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@product_bp.route('/categories/<int:category_id>/subcategories', methods=['GET'])
def get_subcategories(category_id):
    """Get subcategories for a category"""
    try:
        subcategories = get_subcategories_by_category_service(category_id)
        return jsonify({'success': True, 'data': subcategories, 'count': len(subcategories)}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
