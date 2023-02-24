const express=require('express')
const app=express()
const bcrypt=require('bcrypt')
const mongoose=require('mongoose')
const usermodel=require('./user.js')
const passport=require('passport')
const flash=require('express-flash')
const session=require('express-session')
const methodoverride=require('method-override')
const { find, findOne } = require('./user.js')
const mongodbstore=require('connect-mongodb-session')(session)
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1/login').then((res)=>console.log('mongod connected'));
  const store=new mongodbstore({
    uri: 'mongodb://127.0.0.1/login',
  collection: 'mySessions'
  })
  app.use(flash())
app.use(session({
    secret:'helloworld',
    resave:false,
    saveUninitialized:false,
    store:store,
    cookie:{
        maxAge:100*1000*3600*24
    }

}))

const initializepassport=require('./passport-config.js')


initializepassport(
    passport,
    async(username)=>await usermodel.findOne({username:username}),
    async(id)=>await usermodel.findById(id)
    )
    app.use(passport.initialize())
    app.use(passport.session())

    const checkauthenticated=(req,res,next)=>{
        if(req.isAuthenticated()){
            return next()
        }
        res.redirect('/login')
    }
 const checknotauthenticated=(req,res,next)=>{
        if(req.isAuthenticated()){
            return res.redirect('/')
        }
        next()
    } 
app.use(methodoverride('_method'))   
app.set('view-engine','ejs')
app.use(express.urlencoded({extended:false}))
app.get('/',checkauthenticated,(req,res)=>{
  
    
    res.render('index.ejs',{name:req.user.username})
})
app.get('/login',checknotauthenticated,(req,res)=>{
   req.session.isAuth=true
    res.render('login.ejs')

})
app.post('/login',checknotauthenticated,passport.authenticate('local',{
  successRedirect: '/',
  failureRedirect:'/login',
  failureFlash:true


}))

app.get('/register',checknotauthenticated,(req,res)=>{
    res.render('register.ejs',{name:'Hello World!'})
})

app.post('/register',checknotauthenticated,async (req,res)=>{
    try{
        const {username,password}=req.body
        
        let user=await usermodel.findOne({username: username});
        console.log(user)
        if(user){
            console.log(user)
             res.render('register.ejs',{name:`${username} this username already exists`})
        }
        
       else{
        user=new usermodel({
            
            username:username,
            password:password,
            
        })
        
        await user.save()
        res.redirect('/login')
       }
    }
    catch(err){
        console.log(err)
     res.redirect('/register')
    }
    console.log(req.body)
    
})

app.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });
app.listen(80,()=>{
    console.log('app is started in port 80')
})
}