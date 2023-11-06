from math import sqrt

file_path = "C:\\Users\\cyiza\\Documents\\GitHub\\COMP4601\\lab6\\test.txt"

#calculating rate average for a user
def avg(user):
    print(user)
    #new array by excluding negative numbers
    userRating= [num for num in user if int(num) >= 0]
    average = sum(userRating) / len(userRating) if len(userRating) > 0 else 0
    return average

#calculating similarity
def sim(userA, userB):
    avgA=avg(userA)
    avgB=avg(userB)

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

#number of users and items
numUsers=0
numItems=0


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

            rating=[]
        for line in lines[3:]:
            # Split the line into individual numbers and convert them to integers
            row = [int(num) for num in line.split()]
            
            # Append the row to the two-dimensional array
            rating.append(row)
        print(sim(rating[0],rating[4]))

except FileNotFoundError:
    print(f"The file at '{file_path}' does not exist.")
except Exception as e:
    print(f"An error occurred: {e}")




