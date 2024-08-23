import re
from flask import jsonify
import numpy as np
from sklearn.preprocessing import KBinsDiscretizer
import pandas as pd

class Data():
    def get_data(data) -> list:
        data_df = pd.read_csv(f"./apps/static/assets/data/{data}", sep=",", header=None)
        
        return data_df.values.tolist()
    
    
    # def find_node(stringToFind, listOfDicts):
    #     for dict_i in listOfDicts:
    #         for string_i in dict_i.values():
    #             if isinstance(string_i, str) and stringToFind in string_i:
    #                 return True
    #     return False


    def dataframe_to_listoflists(dataframe :pd.DataFrame):
        return dataframe.dropna().values.tolist()
    
    def is_numeric(series):
        # Esta función verifica si una serie puede convertirse en un tipo numérico
        try:
            pd.to_numeric(series)
            return True
        except ValueError:
            return False
    
    def discretize_columns(dataframe :pd.DataFrame, bins=5):
        header = list(dataframe) # Save columns names
        ind = 0 # column iterator
        labels = ['Very_low', 'Low', 'Average', 'High', 'Very_high']
        labels_age = ['Young', 'Teen', 'Adult', 'Old', 'Very_old']
        # 7 bins
        # labels = ['Extreme_Low', 'Very_low', 'Low', 'Average', 'High', 'Very_high', 'Extreme_High']
        # labels_age = ['Baby-Child', 'Young', 'Teen', 'Adult', 'Adult-old', 'Old', 'Very_old']

        while (ind < len(header)):
            disc = dataframe.iloc[:,ind] 
            disc = disc.to_frame()
            
            if header[ind] != 'id':
                # Es numérico y tiene más de 3 valores en la columna
                if Data.is_numeric(dataframe[header[ind]]) and dataframe[header[ind]].nunique() > 3:
                # if header[ind] != 'diagnosis':
                    disc = KBinsDiscretizer(n_bins=bins, encode='ordinal',
                                            strategy = "quantile").fit_transform(disc)
                    
                    # if header[ind] != 'Outcome' and header[ind] != 'Sex' and header[ind] != 'FastingBS' and header[ind] != 'HeartDisease':
                    dataframe[header[ind]] = disc
                    if header[ind] == 'Age':
                        dataframe[header[ind]] = pd.cut(dataframe[header[ind]], bins=bins, labels=labels_age, right=False)
                    else:
                        dataframe[header[ind]] = pd.cut(dataframe[header[ind]], bins=bins, labels=labels, right=False)
                dataframe[header[ind]] = dataframe.apply(lambda x: header[ind]+'_'+x[header[ind]], axis=1)

            ind = ind + 1
            del(disc)   
        
        del(ind)
        del(header) 
        del(bins)


    # @classmethod
    # def rules_to_graph(self, rulesCsv: pd.DataFrame):
    #     nodes = []
    #     rulesLinks = []
    #     i = 0; j = 0

    #     for index, row in rulesCsv.iterrows():
    #         antecedent = str(row["antecedents"])[12:-3].replace("'", "")
    #         consequent = str(row["consequents"])[12:-3].replace("'", "")
            
    #         if not self.find_node(antecedent, nodes):
    #             nodes.append({
    #                 'id': antecedent,
    #                 'label': antecedent
    #             })
    #             i = i + 1
            
    #         if not self.find_node(consequent, nodes):
    #             nodes.append({
    #                 'id': consequent,
    #                 'label': consequent
    #             })
    #             i = i + 1

    #         rulesLinks.append({
    #             'id': j,
    #             'source': antecedent,
    #             'target': consequent,
    #             'confidence': row["confidence"],
    #             'support': row["support"],
    #             'antecedent supp': row["antecedent support"],
    #             'consequent supp': row["consequent support"],
    #             'lift': row["lift"]
    #         })
    #         j = j + 1

    #     graph = {
    #         'nodes': nodes,
    #         'links': rulesLinks
    #     }

    #     return graph
    
    def clean_infinity(df):
        # Reemplazar Infinity con el valor máximo de float64
        max_float = np.finfo(np.float64).max
        df.replace([np.inf], max_float, inplace=True)
        df.fillna(0, inplace=True)  # Reemplazar NaN con 0
        return df
    
    @classmethod
    def rules_to_graph(self, rulesCsv: pd.DataFrame):
        nodes = []
        links = []
        node_dict = {}
        i = 0
        rule_counter = 0

        for index, row in rulesCsv.iterrows():
            antecedent = str(row["antecedents"])[12:-3].replace("'", "").split(", ")
            consequent = str(row["consequents"])[12:-3].replace("'", "").split(", ")
            
            # Adding antecedent nodes
            for a in antecedent:
                if a not in node_dict:
                    node = {
                        'label': a,
                        'id': i,
                        'group': self.get_group(a),
                        'kind': self.get_kind(a)
                    }
                    nodes.append(node)
                    node_dict[a] = i
                    i += 1

            # Adding consequent nodes
            for c in consequent:
                if c not in node_dict:
                    node = {
                        'label': c,
                        'id': i,
                        'group': self.get_group(c),
                        'kind': self.get_kind(c)
                    }
                    nodes.append(node)
                    node_dict[c] = i
                    i += 1

            # Adding rule node
            rule_node = {
                'label': f"Rule{rule_counter}",
                'id': i,
                'confidence': row["confidence"],
                'support': row["support"],
                'lift': row["lift"],
                'group': 20,
                'kind': 'Rule'
            }
            nodes.append(rule_node)
            rule_id = i
            i += 1
            rule_counter += 1

            # Adding links from antecedents to rule node
            for a in antecedent:
                link = {
                    'source': node_dict[a],
                    'target': rule_id,
                    'antecedent supp': row["antecedent support"],
                    'kind': 1,
                    'value': 0,
                }
                links.append(link)

            # Adding links from rule node to consequents
            for c in consequent:
                link = {
                    'source': rule_id,
                    'target': node_dict[c],
                    'consequent supp': row["consequent support"],
                    'kind': 2,
                    'value': 1,
                }
                links.append(link)

        graph = {
            'nodes': nodes,
            'links': links
        }

        return graph
    

    @classmethod
    def find_node(self, name, nodes):
        for node in nodes:
            if node['label'] == name:
                return node
        return None

    @classmethod
    def get_group(self, item):
        # Aquí puedes definir la lógica para determinar el grupo
        labels = ['Very_low', 'Low', 'Average', 'High', 'Very_high']
        labels_age = ['Very_young', 'Teen', 'Adult', 'Old', 'Very_old']

        if any(label in item for label in labels):
            return 1
        elif any(label in item for label in labels_age):
            return 2
        elif re.search(r'_[0-9]+$', item) or re.search(r'_[a-zA-Z]+$', item):
            return 3
        else:
            return 4

    @classmethod
    def get_kind(self, item):
        labels = ['Very_low', 'Low', 'Average', 'High', 'Very_high']
        labels_age = ['Very_young', 'Teen', 'Adult', 'Old', 'Very_old']

        if any(label in item for label in labels):
            return "Numeric Discretized"
        elif any(label in item for label in labels_age):
            return "Age"
        elif re.search(r'_[0-9]+$', item) or re.search(r'_[a-zA-Z]+$', item):
            return "Type Item"
        else:
            return "Other"


    # @classmethod
    # def rules_to_graph(self, rulesCsv: pd.DataFrame):
    #     nodes = []
    #     rulesLinks = []
    #     i = 0
    #     j = 0

    #     for index, row in rulesCsv.iterrows():
    #         antecedent = str(row["antecedents"])[12:-3].replace("'", "").split(", ")
    #         consequent = str(row["consequents"])[12:-3].replace("'", "").split(", ")
            
    #         for a in antecedent:
    #             if not self.find_node(a, nodes):
    #                 nodes.append({
    #                     'name': a,
    #                     'id': i
    #                 })
    #                 i += 1

    #         for c in consequent:
    #             if not self.find_node(c, nodes):
    #                 nodes.append({
    #                     'name': c,
    #                     'id': i
    #                 })
    #                 i += 1

    #         rule_node = {
    #             'name': f"Rule{j}",
    #             'rule': 20,
    #             'Conf': row["confidence"],
    #             'Supp': row["support"],
    #             'antecedent supp': row["antecedent support"],
    #             'consequent supp': row["consequent support"],
    #             'lift': row["lift"],
    #             'id': i
    #         }
    #         nodes.append(rule_node)
            
    #         for a in antecedent:
    #             rulesLinks.append({
    #                 'source': self.find_node(a, nodes)['id'],
    #                 'target': i,
    #                 'value': 1,
    #             })

    #         for c in consequent:
    #             rulesLinks.append({
    #                 'source': i,
    #                 'target': self.find_node(c, nodes)['id'],
    #                 'value': 1,
    #             })

    #         j += 1
    #         i += 1

    #     graph = {
    #         'nodes': nodes,
    #         'links': rulesLinks
    #     }

    #     return graph

    # @classmethod
    # def find_node(self, name, nodes):
    #     for node in nodes:
    #         if node['name'] == name:
    #             return node
    #     return None