from functools import cached_property

import numpy as np
import pandas as pd


class ItemBasedRecommender:
    def __init__(self, data = None, na=0, name="ItemBasedRecommender"):
        self.name = name
        self.data = 0
        self.na = na
        self.k = "null"
        self.t = "null"
        self.useThreshold = "null"
        self.abs = "null"

    @classmethod
    def read(self, file_path: str):
        with open(file_path, "r") as file:
            file.readline()
            users = file.readline().split()
            items = file.readline().split()
            data = pd.read_csv(file, delim_whitespace=True, header=None, dtype=float)
            data.index = users
            data.columns = items
        self.data = data

    @cached_property
    def similarities(self):
        similarities = pd.DataFrame(np.nan, index=self.data.columns, columns=self.data.columns, dtype=float)

        for itemA in self.data.columns:
            for itemB in self.data.columns:
                if pd.isna(similarities.at[itemA, itemB]):
                    similarities.at[itemA, itemB] = similarities.at[itemB, itemA] = self.compare(itemA, itemB)

        return similarities

    @cached_property
    def predictions(self):
        predictions = pd.DataFrame(np.nan, index=self.data.index, columns=self.data.columns, dtype=float)

        for user in self.data.index:
            for item in self.data.columns:
                predictions.at[user, item] = self.predict(user, item)

        return predictions

    def compare(self, itemA: str, itemB: str):
        itemA_ratings = self.data[itemA]
        itemA_rated = itemA_ratings != self.na
        itemA_rated_ratings = itemA_ratings[itemA_rated]

        if itemA_rated_ratings.empty:
            return 0.0

        itemB_ratings = self.data[itemB]
        itemB_rated = itemB_ratings != self.na
        itemB_rated_ratings = itemB_ratings[itemB_rated]

        if itemB_rated_ratings.empty:
            return 0.0

        both_rated = itemA_rated & itemB_rated
        mean_rated_user_ratings = self.data.loc[both_rated.index].replace(self.na, np.nan).mean(axis=1)
        centered_itemA_ratings = (itemA_rated_ratings.loc[both_rated] - mean_rated_user_ratings).fillna(0)
        centered_itemB_ratings = (itemB_rated_ratings.loc[both_rated] - mean_rated_user_ratings).fillna(0)
        centered_ratings_covariance = np.dot(centered_itemA_ratings, centered_itemB_ratings)
        centered_ratings_norm = np.sqrt(np.sum(centered_itemA_ratings**2)) * np.sqrt(np.sum(centered_itemB_ratings**2))

        if np.isclose(centered_ratings_norm, 0):
            return 0.0

        return centered_ratings_covariance / centered_ratings_norm

    def predict(self, user: str, item: str):
        if (user_rating := self.data.loc[user, item]) != self.na:
            return user_rating

        user_ratings = self.data.loc[user]
        user_rated_ratings = user_ratings[user_ratings != self.na]

        item_ratings = self.data[item]
        item_rated_ratings = item_ratings[item_ratings != self.na]
        item_mean_rating = item_rated_ratings.mean()

        item_similarities = self.similarities.loc[user_rated_ratings.index, item]
        if self.abs:
            item_similarities = item_similarities.abs()
        item_similarities = item_similarities[item_similarities > 0]

        valid_similar_items = item_similarities.index.intersection(item_rated_ratings.index)

        if self.useThreshold:
            chosen = item_similarities.loc[valid_similar_items][item_similarities.loc[valid_similar_items] > self.t]
            chosen_ratings = self.data.loc[user, chosen.index]
            rated_ratings = chosen_ratings[chosen_ratings != self.na]
        else:
            chosen = valid_similar_items.nlargest(self.k)
            chosen_ratings = self.data.loc[user, chosen.index]
            rated_ratings = chosen_ratings[chosen_ratings != self.na]

        if rated_ratings.empty:
            return item_mean_rating

        rated_similarities = item_similarities[rated_ratings.index]
        rated_similarities_sum = rated_similarities.sum()
        centered_ratings_weighted_sum = (rated_similarities * rated_ratings).sum()

        if np.isclose(rated_similarities_sum, 0):
            return item_mean_rating

        return centered_ratings_weighted_sum / rated_similarities_sum


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <file_path>")
        sys.exit(1)

    pd.set_option("display.precision", 2)

    recommender = ItemBasedRecommender.read(file_path=sys.argv[1])

    print("Data:", recommender.data, sep="\n")
    print("\nSimilarities:", recommender.similarities, sep="\n")
    print("\nPredictions:", recommender.predictions, sep="\n")
