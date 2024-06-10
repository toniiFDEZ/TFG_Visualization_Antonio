from flask import jsonify
from sklearn.preprocessing import KBinsDiscretizer
import pandas as pd

class Data():
    def get_data(data) -> list:
        data_df = pd.read_csv(f"./apps/static/assets/data/{data}", sep=",", header=None)
        
        return data_df.values.tolist()
    
    
    def find_node(stringToFind, listOfDicts):
        for dict_i in listOfDicts:
            for string_i in dict_i.values():
                if isinstance(string_i, str) and stringToFind in string_i:
                    return True
        return False


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
        labels_age = ['Very_young', 'Teen', 'Adult', 'Old', 'Very_old']
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


    @classmethod
    def rules_to_graph(self, rulesCsv: pd.DataFrame):
        nodes = []
        rulesLinks = []
        i = 0; j = 0

        for index, row in rulesCsv.iterrows():
            antecedent = str(row["antecedents"])[12:-3].replace("'", "")
            consequent = str(row["consequents"])[12:-3].replace("'", "")
            
            if not self.find_node(antecedent, nodes):
                nodes.append({
                    'id': antecedent,
                    'label': antecedent
                })
                i = i + 1
            
            if not self.find_node(consequent, nodes):
                nodes.append({
                    'id': consequent,
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

    # def rules_to_graph(self, rulesCsv: pd.DataFrame):
    #     nodes = []
    #     nodes_set = set()  # Para asegurarnos de que no haya nodos repetidos
    #     rulesLinks = []
    #     j = 0

    #     for index, row in rulesCsv.iterrows():
    #         antecedent = str(row["antecedents"])[12:-3].replace("'", "")
    #         consequent = str(row["consequents"])[12:-3].replace("'", "")
            
    #         # Añadir el antecedente como nodo si no existe
    #         if antecedent not in nodes_set:
    #             nodes.append({
    #                 'id': antecedent,
    #                 'label': antecedent
    #             })
    #             nodes_set.add(antecedent)
            
    #         # Añadir el consecuente como nodo si no existe
    #         if consequent not in nodes_set:
    #             nodes.append({
    #                 'id': consequent,
    #                 'label': consequent
    #             })
    #             nodes_set.add(consequent)

    #         # Añadir el enlace de la regla
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
    #         j += 1

    #     graph = {
    #         'nodes': nodes,
    #         'links': rulesLinks
    #     }

    #     return graph