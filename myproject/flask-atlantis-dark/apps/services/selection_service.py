import json
from flask import Blueprint, jsonify, request, current_app, Response
from pathlib import Path
from apps.models.data import Data
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
        return jsonify({"error": "Archivo no encontrado"}), 404
    
    
# @selection.route('/get_rule_tsv/<string:data>', methods=['GET'])
# def get_rule_tsv(data):
#     file_path = Path(f'apps/static/assets/data/rules_table_tsv/{data}')

#     if file_path.is_file():
#         with open(file_path) as f:
#             tsv_content = list(csv.DictReader(f, delimiter='\t'))
        
#         # Convert TSV content to the desired format for Chord Diagram
#         output = io.StringIO()
#         writer = csv.writer(output, delimiter='\t')
        
#         # Write header
#         writer.writerow(["source", "target", "value"])
        
#         # Write data
#         for row in tsv_content:
#             antecedent = row["antecedents"].replace("frozenset({'", "").replace("'})", "")
#             consequent = row["consequents"].replace("frozenset({'", "").replace("'})", "")
#             value = row["support"]
#             writer.writerow([antecedent, consequent, value])
        
#         response = Response(output.getvalue(), mimetype='text/tab-separated-values')
#         response.headers.set("Content-Disposition", "attachment", filename=f"{data}")
#         return response
#     else:
#         return jsonify({"error": "File not found"}), 404


@selection.route('/get_rule_tsv/<string:data>', methods=['GET'])
def get_rule_tsv(data):
    # Define la ruta base de los archivos TSV
    base_dir = Path('apps/static/assets/data/rules_table_tsv')
    file_path = base_dir / data

    if file_path.is_file():
        try:
            # Leer el contenido del archivo
            with open(file_path, 'r') as file:
                tsv_content = file.read()
                
            # Crear la respuesta con el contenido del archivo
            response = Response(tsv_content, mimetype='text/tab-separated-values')
            response.headers.set("Content-Disposition", "attachment", filename=data)
            return response
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Archivo no encontrado"}), 404
    

@selection.route('/get_files')
def get_files():
    folder = Path('apps/static/assets/data/.')
    with os.scandir(folder) as files:
        files = [file.name for file in files if file.is_file() and not file.name.startswith('.')]

    return jsonify(files)


@selection.route('/upload', methods=['POST'])
def upload_file():
    if 'archivo' not in request.files:
        return jsonify({'error': 'No se ha seleccionado ningún archivo'}), 400
    
    archivo = request.files['archivo']
    
    if archivo.filename == '':
        return jsonify({'error': 'No se ha seleccionado ningún archivo'}), 400
    
    # Verificar si el archivo tiene la extensión permitida
    if not Data.allowed_file(archivo.filename):
        return jsonify({'error': 'Solo se permiten archivos con extensión .csv'}), 500
    
    # Guardar el archivo en el servidor
    archivo.save(os.path.join(current_app.config['UPLOAD_FOLDER'], archivo.filename))
    
    return jsonify({'mensaje': 'Archivo subido con éxito'}), 200


@selection.route('/delete', methods=['POST'])
def delete_file():
    data = request.form.get('experiment')
    print(data)
    file_path_rules = Path(f'apps/static/assets/data/rules/{data}_rules.json')
    file_path_freq_itemset = Path(f'apps/static/assets/data/frequent_itemset/{data}_freqItemset.tsv')
    file_path_rules_tsv = Path(f'apps/static/assets/data/rules_table_tsv/{data}_rules.tsv')

    if file_path_rules.is_file() and file_path_freq_itemset.is_file() and file_path_rules_tsv.is_file():
        try:
            os.remove(file_path_rules)
            os.remove(file_path_freq_itemset)
            os.remove(file_path_rules_tsv)
            return 'Archivo eliminado con éxito'
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "File not found"}), 404