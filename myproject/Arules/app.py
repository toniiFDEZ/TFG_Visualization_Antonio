import pandas as pd
import json
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, fpmax, fpgrowth, association_rules


dataset = [['Bradycardia', 'Cardiac Arrest', 'Myocarditis', 'Heart Block'],
           ['Anemia', 'Cardiac Arrest', 'Myocarditis', 'Heart Block', 'Hypertension', 'Diabetes'],
           ['Bradycardia', 'Chest Pain', 'Heart Block', 'Hypertension', 'Diabetes'],
           ['Bradycardia', 'Hyperlipidemia', 'Nausea', 'Heart Block', 'Diabetes', 'Chest Pain'],
           ['Nausea', 'Cardiac Arrest', 'Myocarditis', 'Heart Block', 'Obesity','Hypertension'],
           ['Diabetes', 'Obesity', 'Heart Block', 'Myocarditis', 'Cardiac Arrest'],
           ['Nausea', 'Anemia', 'Hypertension', 'Chest pain'],
           ['Chest Pain', 'Diabetes', 'Hyperlipidemia', 'Cardiac Arrest', 'Obesity']]

te = TransactionEncoder()
te_ary = te.fit(dataset).transform(dataset)
df = pd.DataFrame(te_ary, columns=te.columns_)
print(df)

frequent_itemsets = apriori(df, min_support=0.35, use_colnames=True)
### alternatively:
#frequent_itemsets = apriori(df, min_support=0.6, use_colnames=True)
#frequent_itemsets = fpmax(df, min_support=0.6, use_colnames=True)

# print("\nFrequent item sets:\n", frequent_itemsets, "\n\n")

# print("Confidence > 0.8:\n", association_rules(frequent_itemsets, metric="confidence", min_threshold=0.6))

rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.6)
print(rules)

def findNode(stringToFind, listOfDicts):
    for dict_i in listOfDicts:
        for string_i in dict_i.values():
            if isinstance(string_i, str) and stringToFind in string_i:
                return True
    return False

def rulesToGraph(rulesCsv: pd.DataFrame):
    nodes = []
    rulesLinks = []
    i = 0; j = 0

    for index, row in rulesCsv.iterrows():
        antecedent = str(row["antecedents"])[12:-3].replace("'", "")
        consequent = str(row["consequents"])[12:-3].replace("'", "")
        
        if not findNode(antecedent, nodes):
            nodes.append({
                'id': i,
                'label': antecedent
            })
            i = i + 1
        
        if not findNode(consequent, nodes):
            nodes.append({
                'id': i,
                'label': consequent
            })
            i = i + 1

        rulesLinks.append({
            'id': j,
            'source': antecedent,
            'target': consequent,
            'confidence': row["confidence"],
            'support': row["support"],
            'antecedent supp': row["antecedent support"],
            'consequent supp': row["consequent support"],
            'lift': row["lift"]
        })
        j = j + 1

    graph = {
        'nodes': nodes,
        'links': rulesLinks
    }

    return graph


# # Crear una lista de nodos
# nodos = []
# for i, row in rules.iterrows():
#     nodos.append({
#         'id': i,
#         'label': str(row["antecedents"])[12:-3]
#     })       

# # Crear una lista de enlaces
# enlaces = []
# for row in rules.iterrows():
#     enlaces.append({
#         'source': f'node-{row["antecedents"]}',
#         'target': f'node-{row["consequents"]}',
#         'confidence value': row['confidence']
#     })

# # Crear un diccionario que representa el archivo JSON de nodos y enlaces
# json_data = {
#     'nodes': nodos,
#     'links': enlaces
# }

json_data = rulesToGraph(rules)

# Escribir el archivo JSON de nodos y enlaces
with open('nodes_links_2.json', 'w') as outfile:
    json.dump(json_data, outfile)