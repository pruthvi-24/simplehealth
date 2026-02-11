const mongoose = require("mongoose");
// your schema here

const profileSchema = new mongoose.Schema({
    name:{
        type:String ,
        required : true
    },
    relation:{
        type:String,
        required : true,
        enum: ["Self", "Father", "Mother", "Grandfather", "Grandmother", "Son", "Daughter", "Brother", "Sister", "Spouse"]
    }

})

const Profile = mongoose.model("Profile", profileSchema);

module.exports  = Profile;
