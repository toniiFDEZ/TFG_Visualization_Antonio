from flask import Blueprint, jsonify
from flask_login import login_required
from sklearn.preprocessing import KBinsDiscretizer
from apps.models.data import Data
import pandas as pd
import json
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, fpmax, fpgrowth, association_rules

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


@data.route('/transform_into_nodes/<string:data>')
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
    ### alternatively:
    # frequent_itemsets = apriori(df, min_support=0.6, use_colnames=True)
    # frequent_itemsets = fpmax(df, min_support=0.6, use_colnames=True)

    try: 
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.6)
        print(rules)
    except NameError:
        print(NameError)

    json_data = Data.rules_to_graph(rules)
    with open('apps/static/assets/data/nodes_links_2.json', 'w') as outfile:
        json.dump(json_data, outfile)

    return json_data


