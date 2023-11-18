import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Assuming the provided data is stored in a multiline string
data_str = """
ItemBasedRecommender Threshold, abs=True, t=0, mae=0.8521707888801785, time=40 seconds
ItemBasedRecommender Threshold, abs=True, t=0.2, mae=0.8437237048415416, time=39 seconds
ItemBasedRecommender Threshold, abs=True, t=0.4, mae=0.8310137440087145, time=38 seconds
ItemBasedRecommender Threshold, abs=True, t=0.6, mae=0.806061895559706, time=37 seconds
ItemBasedRecommender Threshold, abs=True, t=0.8, mae=0.7873982697456098, time=46 seconds
ItemBasedRecommender TopK, abs=True, k=1, mae=0.7672497234513275, time=56 seconds
ItemBasedRecommender TopK, abs=True, k=2, mae=0.7502512809237605, time=53 seconds
ItemBasedRecommender TopK, abs=True, k=5, mae=0.732835873958148, time=54 seconds
ItemBasedRecommender TopK, abs=True, k=10, mae=0.7305795894656255, time=72 seconds
ItemBasedRecommender TopK, abs=True, k=50, mae=0.7286668402245374, time=59 seconds
ItemBasedRecommender TopK, abs=True, k=100, mae=0.7259727022569584, time=58 seconds
ItemBasedRecommender Threshold, abs=False, t=0, mae=0.7366666577451819, time=48 seconds
ItemBasedRecommender Threshold, abs=False, t=0.2, mae=0.7254486501866729, time=49 seconds
ItemBasedRecommender Threshold, abs=False, t=0.4, mae=0.7209040496179986, time=47 seconds
ItemBasedRecommender Threshold, abs=False, t=0.6, mae=0.7234456306570969, time=45 seconds
ItemBasedRecommender Threshold, abs=False, t=0.8, mae=0.732376083470403, time=43 seconds
ItemBasedRecommender TopK, abs=False, k=1, mae=0.3305892462073325, time=70 seconds
ItemBasedRecommender TopK, abs=False, k=2, mae=0.3253054155250461, time=72 seconds
ItemBasedRecommender TopK, abs=False, k=5, mae=0.31798026343499053, time=60 seconds
ItemBasedRecommender TopK, abs=False, k=10, mae=0.32021934309169015, time=66 seconds
ItemBasedRecommender TopK, abs=False, k=50, mae=0.34570294313943906, time=59 seconds
ItemBasedRecommender TopK, abs=False, k=100, mae=0.35539258482395525, time=63 seconds
UserBasedRecommender Threshold, abs=True, t=0, mae=0.7753471204297757, time=64 seconds
UserBasedRecommender Threshold, abs=True, t=0.2, mae=0.7465395830632154, time=64 seconds
UserBasedRecommender Threshold, abs=True, t=0.4, mae=0.7264854270780574, time=65 seconds
UserBasedRecommender Threshold, abs=True, t=0.6, mae=0.7183466204038214, time=46 seconds
UserBasedRecommender Threshold, abs=True, t=0.8, mae=0.7185260276585299, time=45 seconds
UserBasedRecommender TopK, abs=True, k=1, mae=0.7253810225489377, time=49 seconds
UserBasedRecommender TopK, abs=True, k=2, mae=0.7356725863458516, time=61 seconds
UserBasedRecommender TopK, abs=True, k=5, mae=0.7593156030427349, time=64 seconds
UserBasedRecommender TopK, abs=True, k=10, mae=0.7752709330797893, time=64 seconds
UserBasedRecommender TopK, abs=True, k=50, mae=0.7753471204297757, time=63 seconds
UserBasedRecommender TopK, abs=True, k=100, mae=0.7753471204297757, time=64 seconds
UserBasedRecommender Threshold, abs=False, t=0, mae=0.7606897481735406, time=60 seconds
UserBasedRecommender Threshold, abs=False, t=0.4, mae=0.7180905045463419, time=59 seconds
UserBasedRecommender Threshold, abs=False, t=0.6, mae=0.7156329645598881, time=66 seconds
UserBasedRecommender Threshold, abs=False, t=0.8, mae=0.7172213793110654, time=67 seconds
UserBasedRecommender TopK, abs=False, k=1, mae=0.7238914139441407, time=70 seconds
UserBasedRecommender TopK, abs=False, k=2, mae=0.7375523434673055, time=77 seconds
UserBasedRecommender TopK, abs=False, k=5, mae=0.7969043928756852, time=64 seconds
UserBasedRecommender TopK, abs=False, k=10, mae=0.895319184456189, time=63 seconds
UserBasedRecommender TopK, abs=False, k=50, mae=0.9665405718696858, time=62 seconds
UserBasedRecommender TopK, abs=False, k=100, mae=0.9665405718696858, time=63 seconds
"""

# Split the data into lines
lines = data_str.strip().split('\n')

# Initialize empty lists to store data
data = {'isItem': [], 'isAbs': [], 'isThreshold': [], 'x': [], 'MAE': [], 'time': []}

# Parse the data
for line in lines:
    parts = line.split()
    data['isItem'].append(parts[0]=='ItemBasedRecommender')
    data["isThreshold"].append(parts[1]=="Threshold,")
    data['isAbs'].append(parts[2]=="abs=True,")
    data['x'].append(float(parts[3].split('=')[1].replace(',', '')))
    data["MAE"].append(float(parts[4].split('=')[1].replace(',', '')))
    data["time"].append(int(parts[5].split('=')[1]))
print(data)

# Create a DataFrame from the parsed data
df = pd.DataFrame(data)

# Set the style for seaborn
sns.set(style="whitegrid")

# Create subplots
fig, axes = plt.subplots(nrows=2, ncols=1, figsize=(12, 10), sharex=True)

# Plot MAE vs Threshold/TopK
sns.lineplot(x='Threshold_TopK', y='MAE', hue='Abs', style='RecommenderType', data=df, ax=axes[0])
axes[0].set_title("MAE vs Threshold/TopK")
axes[0].set_xlabel("Threshold/TopK")
axes[0].set_ylabel("MAE")

# Plot Time vs Threshold/TopK
sns.lineplot(x='Threshold_TopK', y='Time', hue='Abs', style='RecommenderType', data=df, ax=axes[1])
axes[1].set_title("Time vs Threshold/TopK")
axes[1].set_xlabel("Threshold/TopK")
axes[1].set_ylabel("Time (seconds)")

# Adjust layout
plt.tight_layout()
plt.show()
