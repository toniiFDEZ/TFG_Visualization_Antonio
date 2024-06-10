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


@data.route('/transform_into_nodes/<string:data>', methods=['GET'])
@login_required
def transform_into_nodes(data):
    dataset = Data.get_data(data)
    df = pd.DataFrame(dataset[1:], columns=dataset[0])
    Data.discretize_columns(df)
    df = Data.dataframe_to_listoflists(df)

    te = TransactionEncoder()
    te_ary = te.fit(df).transform(df)
    df = pd.DataFrame(te_ary, columns=te.columns_mapping_)

    frequent_itemsets = apriori(df, min_support=0.1, use_colnames=True)
    ### Alternativamente:
    # frequent_itemsets = apriori(df, min_support=0.6, use_colnames=True)
    # frequent_itemsets = fpmax(df, min_support=0.6, use_colnames=True)

    try: 
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.6)
        print(rules)
    except NameError:
        print(NameError)

    json_data = Data.rules_to_graph(rules)
    # date_now = str(datetime.datetime.now())
    # date_file = f"{date_now}_nodes_links"
    # path = f"apps/static/assets/data/rules/{date_file}.json"
    # with open(path, 'w') as outfile:
    #     json.dump(json_data, outfile)

    return json_data


@data.route('/transform_into_nodes', methods=['POST'])
@login_required
def transform_into_nodes_post():
    data = request.form.get('data')
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

    json_data = Data.rules_to_graph(rules)
    date_now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    file_name, _ = os.path.splitext(data) # Nos quedamos con el nombre del archivo sin la extensión
    date_file = f"{date_now}_{file_name}_rules"
    path = f"apps/static/assets/data/rules/{date_file}.json"
    with open(path, 'w') as outfile:
        json.dump(json_data, outfile)

    return json_data


@data.route('/get_itemset/<string:data>', methods=['GET'])
@login_required
def get_itemset(data):
    minimum_support = 0.1 #float(request.form.get('min_support')) / 100

    dataset = Data.get_data(data)
    df = pd.DataFrame(dataset[1:], columns=dataset[0])

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
    
    print(frequent_itemsets)

    try: 
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.6)
        print(rules)
    except NameError:
        return jsonify({"error": "NameError in generating rules"}), 500

    rules['antecedents'] = rules['antecedents'].apply(lambda x: list(x))
    rules['consequents'] = rules['consequents'].apply(lambda x: list(x))

    # Convert DataFrame to list of dicts
    rules_list = rules.to_dict(orient='records')

    return jsonify(rules_list)


@data.route('/get_table/<string:data>', methods=['GET'])
@login_required
def get_table(data):
    dataset = Data.get_data(data)
    df = pd.DataFrame(dataset[1:], columns=dataset[0])
    Data.discretize_columns(df)
    df = Data.dataframe_to_listoflists(df)

    te = TransactionEncoder()
    te_ary = te.fit(df).transform(df)
    df = pd.DataFrame(te_ary, columns=te.columns_mapping_)

    frequent_itemsets = apriori(df, min_support=0.1, use_colnames=True)

    try:
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.6)
    except NameError:
        return jsonify({"error": "NameError in generating rules"}), 500

    rules['antecedents'] = rules['antecedents'].apply(lambda x: list(x))
    rules['consequents'] = rules['consequents'].apply(lambda x: list(x))

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
    rules_list = rules.to_dict(orient='records')

    response = {
        "draw": draw,
        "recordsTotal": total_records,
        "recordsFiltered": total_records,
        "columns_order": columns_order,
        "data": rules_list
    }

    return jsonify(response)