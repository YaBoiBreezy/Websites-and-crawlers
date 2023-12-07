from collections import Counter

import pandas as pd


class GraphBasedRecommender:
    def __init__(self, data: pd.DataFrame):
        self.data = data

    @classmethod
    def read(cls, file_path: str):
        with open(file_path, "r") as file:
            file.readline()
            users = file.readline().split()
            items = file.readline().split()
            data = pd.read_csv(file, delim_whitespace=True, header=None, dtype=int)
            data.index = users
            data.columns = items

        return cls(data)

    def predict(self, user: str) -> list[tuple[str, int]]:
        path_counter = Counter()

        items_liked_by_user = self.data.columns[self.data.loc[user] == 1]

        for item in items_liked_by_user:
            peers = self.data.index[self.data[item] == 1].difference([user])

            for peer in peers:
                other_items_liked_by_peer = self.data.columns[self.data.loc[peer] == 1].difference(items_liked_by_user)

                for other_item in other_items_liked_by_peer:
                    path_counter[other_item] += 1

        return sorted(path_counter.items(), key=lambda x: x[1], reverse=True)


    def predictExtensible(self, user: str, maxPath=3) -> list[tuple[str, int]]:
        path_counter = Counter()
        current_heads = [user]

        for _ in range(int((maxPath-1)/2)):
            next_heads = []

            for current_user in current_heads:
                items_liked_by_user = self.data.columns[self.data.loc[current_user] == 1]

                for item in items_liked_by_user:
                    peers = self.data.index[self.data[item] == 1].difference([current_user])

                    for peer in peers:
                        other_items_liked_by_peer = self.data.columns[self.data.loc[peer] == 1].difference(items_liked_by_user)

                        for other_item in other_items_liked_by_peer:
                            path_counter[other_item] += 1
                            next_heads.append(peer)

            current_heads = next_heads

        return sorted(path_counter.items(), key=lambda x: x[1], reverse=True)


if __name__ == "__main__":
    import sys

    match sys.argv[1:]:
        case [file_path]:
            recommender = GraphBasedRecommender.read(file_path=file_path)
            user = "User1"

            print(recommender.predict(user))
            #print(recommender.predictExtensible(user))

        case _:
            print(f"Usage: {sys.argv[0]} <file_path>")
            sys.exit(1)
