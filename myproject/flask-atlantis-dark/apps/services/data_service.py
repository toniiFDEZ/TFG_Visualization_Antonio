import os
from flask import Blueprint, jsonify, request
from flask_login import login_required
from sklearn.preprocessing import KBinsDiscretizer
from apps.models.data import Data
import pandas as pd
import json
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, fpmax, fpgrowth, association_rules
import datetime
from pathlib import Path

api_url = '/data_nodes'
api_name = 'data_nodes'

data = Blueprint(
    name=api_name,
    url_prefix=api_url,
    import_name=__name__
)

@data.route('/read_data/<string:data>')
@login_required
def read_data(data):
    dataList = Data.get_data(data)

    return jsonify(dataList)


@data.route('/discretize/<string:data>')
@login_required
def discretize(data):
    dataset = Data.get_data(data)
    df = pd.DataFrame(dataset[1:], columns=dataset[0])
    Data.discretize_columns(df)
    df = Data.dataframe_to_listoflists(df)
    print(df)

    return df.to_dict(orient='dict')


@data.route('/transform_into_nodes', methods=['POST'])
@login_required
def transform_into_nodes_post():
    data = request.form.get('data')
    file_name, _ = os.path.splitext(data) # Nos quedamos con el nombre del archivo sin la extensión
    date_now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    minimum_support = float(request.form.get('min_support')) / 100
    confidence_metric = float(request.form.get('confidence')) / 100

    dataset = Data.get_data(data)
    df = pd.DataFrame(dataset[1:], columns=dataset[0])
    Data.discretize_columns(df)
    # Eliminar la columna 'id' si existe
    if 'id' in df.columns:
        df = df.drop(columns=['id'])
    df = Data.dataframe_to_listoflists(df)

    te = TransactionEncoder()
    te_ary = te.fit(df).transform(df)
    df = pd.DataFrame(te_ary, columns=te.columns_mapping_)

    frequent_itemsets = apriori(df, min_support=minimum_support, use_colnames=True)
    ### Alternativamente:
    # frequent_itemsets = apriori(df, min_support=minimum_support, use_colnames=True)
    # frequent_itemsets = fpmax(df, min_support=minimum_support, use_colnames=True)
    if frequent_itemsets.empty:
            print("No frequent itemsets found. The DataFrame is empty.")
            return jsonify({"error": "No frequent itemsets found."}), 400

    try: 
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=confidence_metric)
        print(rules)
    except Exception as e:
            print(f"Error calculating association rules: {e}")
            return jsonify({"error": str(e)}), 500

    # Guardar frequent_itemsets en un archivo TSV
    frequent_itemsets_dir = 'apps/static/assets/data/frequent_itemset'
    os.makedirs(frequent_itemsets_dir, exist_ok=True)
    frequent_itemset_file_name = f"{date_now}_{file_name}_freqItemset"
    frequent_itemsets_file = os.path.join(frequent_itemsets_dir, f"{frequent_itemset_file_name}.tsv")
    frequent_itemsets.to_csv(frequent_itemsets_file, sep='\t', index=False)

    # Guardar rules en un archivo TSV
    rules_table_dir = 'apps/static/assets/data/rules_table_tsv'
    os.makedirs(rules_table_dir, exist_ok=True)
    rules_file_name = f"{date_now}_{file_name}_rules"
    rules_file = os.path.join(rules_table_dir, f"{rules_file_name}.tsv")
    rules.to_csv(rules_file, sep='\t', index=False)

    # Guardar grafo reglas en un archivo JSON
    json_data = Data.rules_to_graph(rules)
    path = f"apps/static/assets/data/rules/{rules_file_name}.json"
    with open(path, 'w') as outfile:
        json.dump(json_data, outfile)

    return json_data


@data.route('/get_table/<string:data>', methods=['GET'])
@login_required
def get_table(data):
    rules_path = Path(f'apps/static/assets/data/rules_table_tsv/{data}_rules.tsv')
    
    # Leer el archivo TSV como un DataFrame
    try:
        rules = pd.read_csv(rules_path, sep='\t')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Convertir las columnas de frozenset a listas
    rules['antecedents'] = rules['antecedents'].apply(lambda x: list(eval(x)) if isinstance(x, str) else list(x))
    rules['consequents'] = rules['consequents'].apply(lambda x: list(eval(x)) if isinstance(x, str) else list(x))
    # Si algún valor es intratable para serializar en JSON (como por ejemplo infinito o -infinito)
    rules = Data.clean_infinity(rules)
    
    columns_order = rules.columns.tolist()
    
    # Manejo del procesamiento del lado del servidor
    draw = int(request.args.get('draw', 1))
    start = int(request.args.get('start', 0))
    length = int(request.args.get('length', 10))
    search_value = request.args.get('search[value]', '')
    order_column_index = int(request.args.get('order[0][column]', 0))
    order_column_name = columns_order[order_column_index]
    order_dir = request.args.get('order[0][dir]', 'asc')

    # Filtrado por búsqueda
    if search_value:
        rules = rules[rules.apply(lambda row: row.astype(str).str.contains(search_value, case=False).any(), axis=1)]

    total_records = len(rules)
    
    # Ordenar datos solo si se ha solicitado
    if order_dir == 'asc':
        rules = rules.sort_values(by=order_column_name, ascending=True)
    else:
        rules = rules.sort_values(by=order_column_name, ascending=False)

    rules = rules[start:start+length]
    
    # Convertir los frozenset a listas para serializar a JSON
    rules_list = rules.to_dict(orient='records')
    for rule in rules_list:
        rule['antecedents'] = list(rule['antecedents'])
        rule['consequents'] = list(rule['consequents'])

    response = {
        "draw": draw,
        "recordsTotal": total_records,
        "recordsFiltered": total_records,
        "columns_order": columns_order,
        "data": rules_list
    }

    return jsonify(response)


@data.route('/get_table_freqItemset/<string:data>', methods=['GET'])
@login_required
def get_table_freqItemset(data):
    freqItemset_path = Path(f'apps/static/assets/data/frequent_itemset/{data}_freqItemset.tsv')
    
    # Leer el archivo TSV como un DataFrame
    try:
        freqItemset = pd.read_csv(freqItemset_path, sep='\t')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Convertir las columnas de frozenset a listas
    freqItemset['itemsets'] = freqItemset['itemsets'].apply(lambda x: list(eval(x)) if isinstance(x, str) else list(x))

    columns_order = freqItemset.columns.tolist()
    
    # Manejo del procesamiento del lado del servidor
    draw = int(request.args.get('draw', 1))
    start = int(request.args.get('start', 0))
    length = int(request.args.get('length', 10))
    search_value = request.args.get('search[value]', '')
    order_column_index = int(request.args.get('order[0][column]', 0))
    order_column_name = columns_order[order_column_index]
    order_dir = request.args.get('order[0][dir]', 'asc')

    # Filtrado por búsqueda
    if search_value:
        freqItemset = freqItemset[freqItemset.apply(lambda row: row.astype(str).str.contains(search_value, case=False).any(), axis=1)]

    total_records = len(freqItemset)
    
    # Ordenar datos solo si se ha solicitado
    if order_dir == 'asc':
        freqItemset = freqItemset.sort_values(by=order_column_name, ascending=True)
    else:
        freqItemset = freqItemset.sort_values(by=order_column_name, ascending=False)

    freqItemset = freqItemset[start:start+length]
    
    # Convertir los frozenset a listas para serializar a JSON
    freqItemset_list = freqItemset.to_dict(orient='records')
    for rule in freqItemset_list:
        rule['itemsets'] = list(rule['itemsets'])

    response = {
        "draw": draw,
        "recordsTotal": total_records,
        "recordsFiltered": total_records,
        "columns_order": columns_order,
        "data": freqItemset_list
    }

    return jsonify(response)