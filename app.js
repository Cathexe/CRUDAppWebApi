require("dotenv").config()
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const bcrpyt = require("bcryptjs");

const app = express();
const port = process.env.port || 3000;

const User = require("./models/User");
const Person = require("./models/Person")

app.use(express.static(path.join(__dirname,"public")))

//set up the middleware to parse JSON request 
app.use(bodyParser.json());

app.use(express.urlencoded({extended:true}))

app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{secure:false}// Set to true is using https
}));

const user = {
    admin:bcrpyt.hashSync("12345",10)
}

function isAuthenticated(req,res,next){
    if(req.session.user)
    {
        return next();
    }
    res.redirect("/login")
}

//MongoDB conection setup
//const mongoURI = "mongodb://localhost:27017/crudapp";
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error"));

db.once("open", ()=>{
    console.log("Connected to mongoDB database");
});

//Setup mongoose schema 

//app routes

app.get("/register",(req,res)=>
{
    res.sendFile(path.join(__dirname,"public","register.html"))
})

app.post("/register",async(req,res)=>{
    try{
        const{username,password,email} = req.body;

        const existingUser = await User.findOne({username});

        if(existingUser)
        {
            return res.send("Username already taken, try a differnet one")
        }

        const hashedPassword = bcrpyt.hashSync(password, 10);
        const newUser = new User({username,password:hashedPassword,email})

        await newUser.save();

        res.redirect("/login");
    }catch(err){
        res.status(500).send("Error registering new user");
    }
})

app.get("/", isAuthenticated,(req,res)=>{
    res.send("index.html");
});

app.get("/users",isAuthenticated,(req,res)=>{
    res.sendFile(path.join(__dirname,"public","users.html"))
})

app.get("/login",(req,res)=>{
    res.sendFile(path.join(__dirname + "/public/login.html"))
})

const protected = ["/index."]

app.get("/people", async (req,res) => {
    console.log("Getting people");
    try{
        const people = await Person.find();
        res.json(people);
        console.log(people);
    }catch(err){
        res.status(500).json({error:"failed to get people."});
    }

});

app.get("/people/:id", async (req,res)=>{
    try{
        const person = await Person.findById();
        if(!person)
        {
            res.status(404).json({error:"Person not found."});
        }
        res.json("person")
    }catch(err){
        res.status(500).json({error:"failed to get person."});
    }
});

//create routes 
app.post("/addperson", async (req,res)=>{
    try{
        const newPerson = new Person(req.body);
        const savePerson = await newPerson.save();
        res.redirect("/users");
        //res.status(201).json({savePerson});
        console.log(savePerson);
    }catch(err){
        res.status(501).json({error:"failed to add new person."});
    }
});

//update route 
app.put("/updateperson/:id",(req,res)=>{
    //example of promise statement for async function
    Person.findByIdAndUpdate(req.params.id, req.body, {
        new:true,
        runValidators:true,
    }).then((updatedPerson)=>{
        if(!updatedPerson){
            return res.status(404).json({error:"Failed to find person"});
        }
        res.json(updatedPerson);
    }).catch((err)=>{
        res.status(400).json({error:"Failed to update the person"});
    });
});

//delete route
app.delete("/deleteperson/FirstName", async (req,res)=>{
    try{
        const personName = req.query;
        const person = await Person.find(personName);

        if(person.length === 0)
        {
            return res.status(404).json({error:"Failed to find the person"});
        }

        const deletedPerson = await Person.findOneAndDelete(personName);
        res.json({message:"Person deleted Succesfully"});
    }catch(err){
        console.log(err);
        res.status(404).json({error:"Person not found"});
    }
});

app.post("/login", async (req,res)=>{
    const {username, password} = req.body;
    console.log(req.body);

    const user = await User.findOne({User})

    if(user && bcrpyt.compareSync(password, user.password)){
        req.session.user = username;
        return res.redirect("/users");
    }
    req.session.error = "Invalid User";
    return res.redirect("/login")
});

app.get("/logout",(req,res)=>{
    req.session.destroy(()=>{
        res.redirect("/login");
    });
})

//starts the server
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
})