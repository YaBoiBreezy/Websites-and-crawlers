from functools import cached_property

import numpy as np
import pandas as pd


class UserBasedRecommender:
    def __init__(self, na=0, name="UserBasedRecommender"):
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
        similarities = pd.DataFrame(np.nan, index=self.data.index, columns=self.data.index, dtype=float)

        for user in self.data.index:
            for peer in self.data.index:
                if pd.isna(similarities.at[user, peer]):
                    similarities.at[user, peer] = similarities.at[peer, user] = self.compare(user, peer)

        return similarities

    @cached_property
    def predictions(self):
        predictions = pd.DataFrame(np.nan, index=self.data.index, columns=self.data.columns, dtype=float)

        for user in self.data.index:
            for item in self.data.columns:
                predictions.at[user, item] = self.predict(user, item)

        return predictions

    def compare(self, user: str, peer: str):
        user_ratings = self.data.loc[user]
        user_rated = user_ratings != self.na
        user_rated_ratings = user_ratings[user_rated]

        if user_rated_ratings.empty:
            return 0.0

        peer_ratings = self.data.loc[peer]
        peer_rated = peer_ratings != self.na
        peer_rated_ratings = peer_ratings[peer_rated]

        if peer_rated_ratings.empty:
            return 0.0

        both_rated = user_rated & peer_rated
        centered_user_ratings = user_rated_ratings[both_rated] - user_rated_ratings.mean()
        centered_peer_ratings = peer_rated_ratings[both_rated] - peer_rated_ratings.mean()
        entered_ratings_covariance = np.dot(centered_user_ratings, centered_peer_ratings)
        centered_ratings_norm = np.sqrt(np.sum(centered_user_ratings**2)) * np.sqrt(np.sum(centered_peer_ratings**2))

        if np.isclose(centered_ratings_norm, 0):
            return 0.0

        return entered_ratings_covariance / centered_ratings_norm

    def predict(self, user: str, item: str):
        if (user_rating := self.data.loc[user, item]) != self.na:
            return user_rating

        user_ratings = self.data.loc[user]
        user_rated_ratings = user_ratings[user_ratings != self.na]
        user_mean_rating = user_rated_ratings.mean()
        user_similarities = self.similarities.loc[user].drop(user)

        valid_similar_users = user_similarities.index.intersection(user_rated_ratings.index)
        if self.abs:
            user_similarities = user_similarities.abs()

        if self.useThreshold:
            chosen = user_similarities.loc[valid_similar_users][user_similarities.loc[valid_similar_users] > self.t]
            chosen_ratings = self.data.loc[chosen.index, item]
            rated_ratings = knn_ratings[chosen_ratings != self.na]
        else:
            chosen = user_similarities.loc[valid_similar_users].nlargest(self.k)
            chosen_ratings = self.data.loc[chosen.index, item]
            rated_ratings = chosen_ratings[chosen_ratings != self.na]

        if knn_rated_ratings.empty:
            return user_mean_rating

        rated_similarities = user_similarities[rated_ratings.index]
        rated_similarities_sum = rated_similarities.sum()
        rated_mean_ratings = self.data.loc[rated_ratings.index].replace(self.na, np.nan).mean(axis=1)
        centered_ratings = rated_ratings - rated_mean_ratings.loc[rated_ratings.index]
        centered_ratings_weighted_sum = (rated_similarities * centered_ratings).sum()

        if np.isclose(rated_similarities_sum, 0):
            return user_mean_rating

        return user_mean_rating + centered_ratings_weighted_sum / rated_similarities_sum


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <file_path>")
        sys.exit(1)

    pd.set_option("display.precision", 2)

    recommender = UserBasedRecommender.read(file_path=sys.argv[1])

    print("Data:", recommender.data, sep="\n")
    print("\nSimilarities:", recommender.similarities, sep="\n")
    print("\nPredictions:", recommender.predictions, sep="\n")
