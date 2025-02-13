const mongoose = require("mongoose")

const peopleSchema = new mongoose.Schema({
    FirstName:String,
    LastName:String,
    Email:String
});

const Person = mongoose.model("Person", peopleSchema, "people");

module.exports = Person;