from functools import cached_property
from recommenderAltered import UserBasedRecommender
from sklearn.metrics import mean_absolute_error

import numpy as np
import pandas as pd

class mae:
    def compute_mae(rec):
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
                    #print(user)
                    #print(item)
                    #print(rec.data.at[user, item])
                    # Perform "leave one out" by setting the rating to NaN
                    rec.data.at[user, item] = rec.na
                    #print(rec.data.at[user, item])

                    # Predict the rating
                    predicted_rating = rec.predict(user, item)
                    #print(predicted_rating)

                    # Reset the original rating
                    rec.data.at[user, item] = true_rating

                    # Handle cases where prediction is NaN (use average user rating as a fallback)
                    if np.isnan(predicted_rating):
                        predicted_rating = rec.data.loc[user].mean()

                    # Calculate mean absolute error
                    #print(true_rating)
                    #print(predicted_rating)
                    mae = mean_absolute_error([true_rating], [predicted_rating])
                    #print(mae)
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
                    #exit()

        # Compute the mean of MAE scores
        final_mae = np.mean(mae_scores)

        # Calculate average neighbors used
        average_neighbors_used = total_neighbors_used / total_predictions if total_predictions > 0 else 0

        # Print the desired output
        print("Total predictions:", total_predictions)
        print("Total under predictions (<1):", total_under_predictions)
        print("Total over predictions (>5):", total_over_predictions)
        # print("Number of cases with no valid neighbours:", no_valid_neighbors_count)
        # print("Average neighbours used:", average_neighbors_used)
        print("MAE =", final_mae)


if __name__ == "__main__":
    pd.set_option("display.precision", 2)
    recommender = UserBasedRecommender.read('./parsed-data-trimmed.txt', na=0, k=5)
    s = recommender.similarities
    print(recommender.na," ",recommender.k)
    mae.compute_mae(recommender)
    