from functools import cached_property
from userBasedRecommender import UserBasedRecommender
from itemBasedRecommender import ItemBasedRecommender
from sklearn.metrics import mean_absolute_error
import time

import numpy as np
import pandas as pd

class mae:
    def compute_mae(rec):
        start_time = time.time()
        total_predictions = 0
        total_under_predictions = 0
        total_over_predictions = 0
        no_valid_neighbors_count = 0
        total_neighbors_used = 0

        mae_scores = []

        for user in rec.data.index:
            for item in rec.data.columns:
                true_rating = rec.data.at[user, item]

                if true_rating != rec.na:
                    # Perform "leave one out" by setting the rating to NaN
                    rec.data.at[user, item] = rec.na

                    # Predict the rating
                    predicted_rating = rec.predict(user, item)

                    # Reset the original rating
                    rec.data.at[user, item] = true_rating

                    # Handle cases where prediction is NaN (use average user rating as a fallback)
                    if np.isnan(predicted_rating):
                        predicted_rating = rec.data.loc[user].mean()

                    # Calculate mean absolute error
                    mae = mean_absolute_error([true_rating], [predicted_rating])
                    mae_scores.append(mae)

                    # Count predictions and update statistics
                    total_predictions += 1
                    total_neighbors_used += rec.k

                    if true_rating < 1 and predicted_rating < 1:
                        total_under_predictions += 1
                    elif true_rating > 5 and predicted_rating > 5:
                        total_over_predictions += 1

                    # Check for cases with no valid neighbors
                    if np.isnan(predicted_rating):
                        no_valid_neighbors_count += 1

        # Compute the mean of MAE scores
        final_mae = np.mean(mae_scores)

        # Calculate average neighbors used
        average_neighbors_used = total_neighbors_used / total_predictions if total_predictions > 0 else 0

        # Print the desired output
        #print("Total predictions:", total_predictions)
        #print("Total under predictions (<1):", total_under_predictions)
        #print("Total over predictions (>5):", total_over_predictions)
        #print("MAE =", final_mae)
        end_time = time.time()
        elapsed_time = end_time - start_time
        return final_mae, elapsed_time


if __name__ == "__main__":
    #test different recommenders, top-K vs threshold, k=2,10,100, threshold=0,0,5,..., using abs similarity?
    #get MAE, time
    pd.set_option("display.precision", 2)
    userRecommender = UserBasedRecommender.read('./assignment2-data.txt')
    itemRecommender = ItemBasedRecommender.read('./assignment2-data.txt')
    s = userRecommender.similarities
    s = itemRecommender.similarities
    print(s)
    print("dome sim")

    #for recommender in [userRecommender, itemRecommender]:
    for recommender in [itemRecommender, userRecommender]:
        for abs in [True, False]:
            for t in [0,0.2,0.5,0.8]:
                recommender.abs = abs
                recommender.t = t
                recommender.useThreshold = True
                error, timeTaken = mae.compute_mae(recommender)
                print(f'{recommender.name} Threshold, abs={abs}, t={t}, mae={error}, time={int(timeTaken)}')
            for k in [2,10,100]:
                recommender.abs = abs
                recommender.k = k
                recommender.useThreshold = False
                error, timeTaken = mae.compute_mae(recommender)
                print(f'{recommender.name} TopK, abs={abs}, k={k}, mae={error}, time={timeTaken}')