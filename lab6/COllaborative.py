from math import sqrt
from pickle import NONE

#file path
file_path = "C:\\Users\\cyiza\\Documents\\GitHub\\COMP4601\\lab6\\test.txt"

#number of users and items
numUsers=0
numItems=0

#rating matrix
rating=[]

# current user and item's index to predict
curUserIndex=-1
itemToPred=-1
# similarities of i'th with other users
curUserSim=[]

#avarega rating of all users
avgRating=[]

# rate predictiion of a current user on give item
def pred(userIndex, itemIndex):
    numerator=0
    denominator=0
    for i in range(numUsers):
        if(i!=userIndex and curUserSim[i]>0):
            numerator+=curUserSim[i]*(rating[i][itemIndex] - avgRating[i])
            denominator+=curUserSim[i]
    prediction=avgRating[userIndex] + (numerator/denominator)
    rating[userIndex][itemIndex]=prediction

#similarity generator for current user
def simGenerator(userIndex):
    for i in range(numUsers):
        if i == userIndex:
            curUserSim.append(NONE)
            continue
        curUserSim.append(sim(userIndex, i))
    print(curUserSim)
    
#calculating rate average for a user
def avgGenerator():

    for r in rating:
        #new array by excluding negative numbers
        userRating= [num for num in r if int(num) >= 0]
        average = sum(userRating) / len(userRating) if len(userRating) > 0 else 0
        avgRating.append(average)

#calculating similarity
def sim(indexA, indexB):
    userA=rating[indexA]
    userB=rating[indexB]

    avgA=avgRating[indexA]
    avgB=avgRating[indexB]

    numerator=0
    denA=0
    denB=0
    for i in range(numItems):
        if userA[i]<0 or userB[i]<0:
            continue
        numerator+=(userA[i]-avgA)*(userB[i] - avgB)
        denA+=(userA[i]-avgA)**2
        denB+=(userB[i] - avgB)**2
    similarity=numerator/(sqrt(denA)*sqrt(denB))
    return similarity


try:
    with open(file_path, 'r') as file:
        lines = file.readlines()

        # reading number of users and items on first line and split by line
        if lines:
            numUSerAndItems=lines[0].split()

            numUsers=int( numUSerAndItems[0])
            numItems=int( numUSerAndItems[1])

            users=lines[1].split()
            items=lines[2].split()

            
        for line in lines[3:]:
            # Split the line into individual numbers and convert them to integers
            row = [int(num) for num in line.split()]
            
            # Append the row to the two-dimensional array
            rating.append(row)
        avgGenerator()

        for i in range(numUsers):
            for j in range(numItems):
                if rating[i][j]<0:
                    curUserIndex=i
                    itemToPred=j
                    simGenerator(curUserIndex)
                    pred(curUserIndex,itemToPred)
        print(rating)

except FileNotFoundError:
    print(f"The file at '{file_path}' does not exist.")
except Exception as e:
    print(f"An error occurred: {e}")




