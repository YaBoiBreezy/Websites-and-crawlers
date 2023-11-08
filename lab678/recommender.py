from functools import cached_property

import numpy as np
import pandas as pd


class UserBasedRecommender:
    def __init__(self, data: pd.DataFrame, na=-1, k=2):
        self.data = data
        self.na = na
        self.k = k

    @classmethod
    def read(cls, file_path: str, na=-1, k=2):
        with open(file_path, "r") as file:
            file.readline()
            users = file.readline().split()
            items = file.readline().split()
            data = pd.read_csv(file, delim_whitespace=True, header=None, dtype=float)
            data.index = users
            data.columns = items

        return cls(data, na, k)

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

        knn = user_similarities.nlargest(self.k)
        knn_ratings = self.data.loc[knn.index, item]
        knn_rated_ratings = knn_ratings[knn_ratings != self.na]

        if knn_rated_ratings.empty:
            return user_mean_rating

        knn_rated_similarities = user_similarities[knn_rated_ratings.index]
        knn_rated_similarities_sum = knn_rated_similarities.sum()
        knn_rated_mean_ratings = self.data.loc[knn_rated_ratings.index].replace(self.na, np.nan).mean(axis=1)
        knn_centered_ratings = knn_rated_ratings - knn_rated_mean_ratings.loc[knn_rated_ratings.index]
        knn_centered_ratings_weighted_sum = (knn_rated_similarities * knn_centered_ratings).sum()

        if np.isclose(knn_rated_similarities_sum, 0):
            return user_mean_rating

        return user_mean_rating + knn_centered_ratings_weighted_sum / knn_rated_similarities_sum


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
