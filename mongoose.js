var mongoose = require('mongoose');

mongoose.connect("mongodb+srv://Vasu:Vasu@cluster0.6vuhk.mongodb.net/PMS?retryWrites=true&w=majority");

collectionSchema = mongoose.Schema({
        name:String,
        email:String,
        password:String,
        allPass:Object
});

collectionModel = mongoose.model('infos',collectionSchema);

module.exports = collectionModel;