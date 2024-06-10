import json
from flask import Blueprint, jsonify, request, current_app
from pathlib import Path
import os

api_url = '/selection'
api_name = 'selection'

selection = Blueprint(
    name=api_name,
    url_prefix=api_url,
    import_name=__name__
)

@selection.route('/get_rules')
def get_rules():
    folder = Path('apps/static/assets/data/rules/.')
    with os.scandir(folder) as files:
        files = [file.name for file in files if file.is_file() and not file.name.startswith('.')]
       
    # Ordena los archivos alfabéticamente en orden inverso 
    # Cómo el nombre de los archivos incluye la fecha, mostrará antes los más recientes
    files = sorted(files, reverse=True)

    return jsonify(files)

@selection.route('/get_rule/<string:data>', methods=['GET'])
def get_rule(data):
    file_path = Path(f'apps/static/assets/data/rules/{data}')

    if file_path.is_file():
        with open(file_path) as f:
            file_content = json.load(f)
        return jsonify(file_content)
    else:
        return jsonify({"error": "File not found"}), 404

@selection.route('/get_files')
def get_files():
    folder = Path('apps/static/assets/data/.')
    with os.scandir(folder) as files:
        files = [file.name for file in files if file.is_file() and not file.name.startswith('.')]

    return jsonify(files)

@selection.route('/upload', methods=['POST'])
def upload_file():
    if 'archivo' not in request.files:
        return 'No se ha seleccionado ningún archivo'
    
    archivo = request.files['archivo']
    
    if archivo.filename == '':
        return 'No se ha seleccionado ningún archivo'
    
    # Guardar el archivo en el servidor
    archivo.save(os.path.join(current_app.config['UPLOAD_FOLDER'], archivo.filename))
    
    return 'Archivo subido con éxito'