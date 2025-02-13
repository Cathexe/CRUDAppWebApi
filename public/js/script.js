const userContainer = document.getElementById("users-container");

const fetchUsers = async ()=>{
    try{
        //fetch data from server
        const response = await fetch("/people");
        if(!response.ok){
            throw new Error("Failed to get users");
        }

        //Parse json
        const users = await response.json();
        console.log(users);
        //Format the data to html
        userContainer.innerHTML = "";

        users.forEach((user) => {
            const userDiv = document.createElement("div");
            userDiv.className = "user";
            userDiv.innerHTML = `${user.FirstName} ${user.LastName} Email: ${user.Email}`;
            userContainer.appendChild(userDiv);
        });
    }catch(error){
        console.error("Error: ", error);
        userContainer.innerHTML = "<p style='color:red'>Failed to get users</p>";
    }
    
    
}

fetchUsers();