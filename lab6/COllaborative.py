file_path = "C:\\Users\\cyiza\\Documents\\GitHub\\COMP4601\\lab6\\test3.txt"

#number of users and items
numUsers=0
numItems=0


try:
    with open(file_path, 'r') as file:
        lines = file.readlines()

        # reading number of users and items on first line and split by line
        if lines:
            numUSerAndItems=lines[0].split()

            numUsers=numUSerAndItems[0]
            numItems=numUSerAndItems[1]

            users=lines[1].split()
            items=lines[2].split()

            print(users[0])
            print(items[0])
        for line in lines:
            print(line.strip())  # strip() removes leading and trailing whitespaces
except FileNotFoundError:
    print(f"The file at '{file_path}' does not exist.")
except Exception as e:
    print(f"An error occurred: {e}")
