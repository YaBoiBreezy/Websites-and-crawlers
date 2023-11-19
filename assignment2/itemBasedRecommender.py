from functools import cached_property

import numpy as np
import pandas as pd
import time


class ItemBasedRecommender:
    def __init__(self, data: pd.DataFrame, na=0, name="ItemBasedRecommender"):
        self.name = name
        self.data = data
        self.na = na
        self.k = 0
        self.t = 0
        self.useThreshold = False
        self.abs = False

    @classmethod
    def read(cls, file_path: str, na=0, name="ItemBasedRecommender"): #used to initialize the recommender
        with open(file_path, "r") as file:
            file.readline()
            users = file.readline().split()
            items = file.readline().split()
            data = pd.read_csv(file, delim_whitespace=True, header=None, dtype=float)
            data.index = users
            data.columns = items

        return cls(data, na, name)

    @cached_property
    def similarities(self):  #will be saved in the recommender object
        try:
            similarities = pd.read_csv('itemSimilarities.csv', index_col=0)  #try to read from a file since regenerating takes over an hour
            similarities.index=self.data.columns
            similarities.columns=self.data.columns
        except:
            similarities = pd.DataFrame(np.nan, index=self.data.columns, columns=self.data.columns, dtype=float)
            for itemA in self.data.columns:
                for itemB in self.data.columns:
                    if pd.isna(similarities.at[itemA, itemB]):
                        similarities.at[itemA, itemB] = similarities.at[itemB, itemA] = self.compare(itemA, itemB)  #similarities are symmetric
            
            similarities.to_csv('itemSimilarities.csv')
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
        itemA_rated_ratings = itemA_ratings[itemA_rated] #all users who actually rated itemA
        if itemA_rated_ratings.empty:
            return 0.0
        
        itemB_ratings = self.data[itemB]
        itemB_rated = itemB_ratings != self.na
        itemB_rated_ratings = itemB_ratings[itemB_rated] #all users who actually rated itemB
        if itemB_rated_ratings.empty:
            return 0.0
        
        both_rated = itemA_rated & itemB_rated  #union of ratings for getting similarity
        mean_rated_user_ratings = self.data.loc[both_rated.index].replace(self.na, np.nan).mean(axis=1)
        centered_itemA_ratings = (itemA_rated_ratings.loc[both_rated] - mean_rated_user_ratings).fillna(0)
        centered_itemB_ratings = (itemB_rated_ratings.loc[both_rated] - mean_rated_user_ratings).fillna(0)
        centered_ratings_covariance = np.dot(centered_itemA_ratings, centered_itemB_ratings)
        centered_ratings_norm = np.sqrt(np.sum(centered_itemA_ratings**2)) * np.sqrt(np.sum(centered_itemB_ratings**2))

        if np.isclose(centered_ratings_norm, 0):  #handle /0 error
            return 0.0

        return centered_ratings_covariance / centered_ratings_norm

    def predict(self, user: str, item: str):
        if (user_rating := self.data.loc[user, item]) != self.na:  #if already predicted, return prediction
            return user_rating

        user_ratings = self.data.loc[user]
        user_rated_ratings = user_ratings[user_ratings != self.na]  #all items the user actually rated

        item_ratings = self.data[item]
        item_rated_ratings = item_ratings[item_ratings != self.na]
        item_mean_rating = item_rated_ratings.mean()

        item_similarities = self.similarities.loc[user_rated_ratings.index, item]
        pure_item_similarities = item_similarities #not abs, use for prediction calculation
        if self.abs:
            item_similarities = item_similarities.abs()  #convert similarities to abs() values
        item_similarities = item_similarities[item_similarities > 0]  #if not abs, prune all <0 similarities

        valid_similar_items = item_similarities.index.intersection(item_rated_ratings.index)  #similarites of valid items

        if self.useThreshold:
            chosen = item_similarities.loc[valid_similar_items][item_similarities.loc[valid_similar_items] > self.t]  #all sufficiently similar valid items
            chosen_ratings = self.data.loc[user, chosen.index]
            rated_ratings = chosen_ratings[chosen_ratings != self.na]
        else:
            chosen = item_similarities.loc[valid_similar_items].nlargest(self.k)  #topk similar valid items
            chosen_ratings = self.data.loc[user, chosen.index]
            rated_ratings = chosen_ratings[chosen_ratings != self.na]

        if rated_ratings.empty:
            return item_mean_rating  #issue handler

        rated_similarities = pure_item_similarities[rated_ratings.index]
        rated_similarities_sum = rated_similarities.sum()
        centered_ratings_weighted_sum = (rated_similarities * rated_ratings).sum()

        if np.isclose(rated_similarities_sum, 0):  #handles /0 error
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
