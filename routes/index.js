var express = require('express');
var router = express.Router();


const bodyParser = require('body-parser');

const jwt = require('jsonwebtoken');  // jwt -> json web token


// using local storage to generate a token
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}


// this is the process to encrypt a password in such a way so that it can be decrypted back
var crypto = require("crypto");

let secrateKey = "secrateKey";

function encrypt(text) {
    encryptalgo = crypto.createCipher('aes192', secrateKey);
    let encrypted = encryptalgo.update(text, 'utf8', 'hex');
    encrypted += encryptalgo.final('hex');
    return encrypted;
}

function decrypt(encrypted) {
    decryptalgo = crypto.createDecipher('aes192', secrateKey);
    let decrypted = decryptalgo.update(encrypted, 'hex', 'utf8');
    decrypted += decryptalgo.final('utf8');
    return decrypted;
}



// bcrypt is the way of encrypting a password, so that it cannot be decrypted back
var bcrypt = require('bcryptjs');

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })


var collectionModel = require('../mongoose');
const { json } = require('body-parser');




// ----- middlewares started ----- // 

function checkToken(req,res,next){
  var myToken = localStorage.getItem('myToken');
  var userDetails = req.session.userRecord;
  if(userDetails)
    {
      next();
    }
  else{
      return res.redirect('/');
    }
  } ;


var checkIfLoggedIn = function(req,res,next){
  var check = localStorage.getItem('myToken');
  var userDetails = req.session.userRecord;
  if(userDetails)
  {
    {
      if(check)
        return  res.redirect('/dashboard');
      else
        next();
    }
  }
  else{
  next();
  }
}



var checkWhileAdding = function(req,res,next){
  var userDetails = req.session.userRecord;
  category = req.body.category;
  if(userDetails.allPass[category])
  {
    res.render('add',{user:userDetails,message:"This Domain Is Already Prese"})
  }
  else{
    if(req.body.password != req.body.cpass)
    {
        res.render('add',{user:userDetails,message:"Password Do Not Match"});
    }
    else{
      userDetails.allPass[category] = encrypt(req.body.category);
      req.session.userRecord = userDetails;
      // localStorage.setItem('userRecord',JSON.stringify(userDetails));
      next();
    }
  }
  };



var checkWhileUpdating = function(req,res,next){
  var userDetails = req.session.userRecord;
  var category = req.body.category;
  var oldPasswordEntered = req.body.oldPassword
  var newPasswordEntered = req.body.newPassword;
  var confirmNewPassword = req.body.confNewPassword;
  if(!userDetails.allPass[category])
  {
    res.render('update',{user:userDetails,allCat:Object.keys(userDetails.allPass),message:"No Such Category Or Domain Found In Your Record"});
  }
  else{
    if(decrypt(userDetails.allPass[category]) !== oldPasswordEntered)
    {
      res.render('update',{user:userDetails,allCat:Object.keys(userDetails.allPass),message:"Old Password Not Matched"});
    }
    else{
      if(newPasswordEntered !== confirmNewPassword)
      {
        res.render('update',{user:userDetails,allCat:Object.keys(userDetails.allPass),message:"Confirm Password Not Matched"});
      }
      else{
        
        userDetails.allPass[category] = encrypt(newPasswordEntered);
        req.session.userRecord = userDetails;
        // localStorage.setItem('userRecord',JSON.stringify(userDetails));
        next();
      }
    }
  }

};  


var checkWhileChangingAccPassword = function(req,res,next){
  var userDetails = JSON.parse(localStorage.getItem('userRecord'));
  var oldPasswordEntered = req.body.oldPassword;
  var newPasswordEntered = req.body.newPassword;
  var confirmNewPassword = req.body.confirmNewPassword;
  if(!bcrypt.compareSync(oldPasswordEntered,userDetails.password))
  {
    res.render('changePassword',{user:userDetails,message:"Old Password Not Matched"});
  }
  else{
    if(newPasswordEntered != confirmNewPassword)
    {
      res.render('changePassword',{user:userDetails,message:"Confirm Password Not Matched"});
    }
    else{
      next();
    }
  }
};  

var checkPassBeforeDeletion = function(req,res,next){
  var userDetails = req.session.userRecord;
  var passwordEntered = req.body.AccountPassword;
  if(bcrypt.compareSync(passwordEntered,userDetails.password))
  {
    next();
  }
  else{
    res.render('confirmDeleteAccount',{user:userDetails,message:"Incorrect Password"});
  }
};

// -----  middlewares end ------ //



/*  ALL GET REQUESTS */
router.get('/', checkIfLoggedIn,function(req, res, next) {
    res.render('signIn');
});



router.get('/signIn',checkIfLoggedIn,function(req, res, next) {
  res.render('signIn');
});

router.get('/signUp', checkIfLoggedIn,function(req, res, next) {
  res.render('signUp');
});

router.get('/add', checkToken,function(req, res, next) {
  var userDetails = req.session.userRecord;
   res.render('add',{user:userDetails});
});

router.get('/update', checkToken,function(req, res, next) {
  var userDetails = req.session.userRecord;
  res.render('update',{user:userDetails,allCat:Object.keys(userDetails.allPass)});
});

router.get('/view',checkToken, function(req, res, next) {
  var userDetails = req.session.userRecord; 
  res.render('view',{user:userDetails, allCat:Object.keys(userDetails.allPass)});
});

router.get('/dashboard',checkToken,function(req, res, next) {
  var userDetails = req.session.userRecord;
  res.render('dashboard',{title:"welcome", message:"",user:userDetails});
});


router.get('/account',checkToken,(req,res)=>{
  var userDetails = req.session.userRecord;
  res.render('yourAccount',{user:userDetails});
})

router.get('/logout',checkToken,(req,res)=>{
  localStorage.removeItem('myToken');
  req.session.destroy();
  res.redirect('/');
});


router.get('/changePassword',checkToken,(req,res)=>{
    var userDetails = req.session.userRecord;
    res.render('changePassword',{user:userDetails})
});



router.get('/deleteAccount',checkToken,(req,res)=>{
  var userDetails = req.session.userRecord;
  res.render('confirmDeleteAccount',{user:userDetails});

  
  
});


/*  ALL POST REQUESTS */
router.post('/signUp', urlencodedParser,function(req, res, next) {

  var findRecord = collectionModel.find({email:req.body.email});
  findRecord.exec(function(err,data){
    if(err) throw err;
    if(data.length > 0 ){
      res.render('signIn',{message:"email id already registered"});
    }
    else{
  
    var record = new collectionModel({
      name:req.body.name,
      email:req.body.email,
      password:bcrypt.hashSync(req.body.password,10),
      allPass:{"":""}
    });
    record.save(function(err,ress){
      if(err) throw err;
      res.render('signUp',{message:"Registered Successfully. Login to Continue"});
    });
    }
    
  });
});


// sign In
router.post('/signIn',urlencodedParser,(req,res)=>{
var emailEntered = req.body.email;
var passwordEntered = req.body.pass;
var findRecord = collectionModel.find({email:req.body.email});

findRecord.exec(function(err,data){
  if(err) throw err;
  if(data.length == 0 ){
    res.render('signIn',{message:"Email id not registered"})
  }
  else{
      if(bcrypt.compareSync(passwordEntered,data[0].password))
      {
        var token = jwt.sign({},'loginToken');
        localStorage.setItem('myToken',token);
        // localStorage.setItem('userRecord',JSON.stringify(data[0]));  // converting the object into string bcoz setItem function can onlu store string
        // var userDetails = JSON.parse(localStorage.getItem('userRecord'));  // retrieving the object from the string by using JSON.parse function
        req.session.userRecord=data[0];
        // res.send(req.session.Record);
        res.redirect('/dashboard')
      }
      else{
        res.render('signIn',{title:'invalid details',message:"Invalid Email Id and Password"})
      }
  }
});
});


router.post("/view",urlencodedParser,(req,res)=>{
var userDetails = req.session.userRecord;
category = req.body.category;
if(category == "Chose Your Option")
{
  res.render('view',{user:userDetails,password:"",allCat:Object.keys(userDetails.allPass)});
}
else{
res.render('view',{user:userDetails,password:decrypt(userDetails.allPass[category]),allCat:Object.keys(userDetails.allPass)});
}   
})



router.post("/addNewPass",urlencodedParser,checkWhileAdding,(req,res)=>{
  var userDetails = req.session.userRecord;
  category = req.body.category;

  var addPass = collectionModel.updateOne({email:userDetails.email},{allPass:userDetails.allPass})

  addPass.exec(function(err,data){
    if(err) throw err;
    res.render('add',{user:userDetails,message:"Added Successfully"});
  });
});


router.post("/update",urlencodedParser,checkWhileUpdating,checkToken,(req,res)=>{
  var userDetails = req.session.userRecord;   
  category = req.body.category;
  var updateCatPass = collectionModel.updateOne({email:userDetails.email},{allPass:userDetails.allPass})

  updateCatPass.exec(function(err,data){
    if(err) throw err;
    res.render('update',{user:userDetails,allCat:Object.keys(userDetails.allPass),message:"Updated Successfully"});
  });
});



router.post('/changePmsPassword',urlencodedParser,checkWhileChangingAccPassword,checkToken,(req,res)=>{
  var userDetails = req.session.userRecord;

  var changePass = collectionModel.updateOne({email:userDetails.email},{password:bcrypt.hashSync(req.body.newPassword,10),})
  changePass.exec(function(err,data){
    if(err) throw err;
    localStorage.removeItem('myToken');
    req.session.destroy();
    // localStorage.removeItem('userRecord');
    res.render('signIn',{message:"Password Changed Successfully"});
  });

});


router.post('/confirmDeleteAccount',urlencodedParser,checkPassBeforeDeletion ,checkToken,(req,res)=>{

  var userDetails = JSON.parse(localStorage.getItem('userRecord'));
  var deleteAcc  = collectionModel.deleteOne({email:userDetails.email});
  deleteAcc.exec(function(err){
    if(err) throw err;
    localStorage.removeItem('myToken');
    req.session.destroy();
    // localStorage.removeItem('userRecord');
    res.render('signUp',{message:"Account Deleted"})

  })
});

  


module.exports = router;