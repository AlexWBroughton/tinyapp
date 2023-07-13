const express = require("express");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080; // default port 8080

const users = {
  'abc': {
    id: "abc",
    email: "a@a.com",
    password: "1234",
  },
  'def': {
    id: "def",
    email: "b@b.com",
    password: "5678",
  }
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
const { get } = require("request");
app.use(cookieParser());

function generateRandomString() {
  const alphaString = (len, chars = "abcdefghijklmnopqrstuvwxyz0123456789") =>
    [...Array(len)]
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join("");

  return alphaString(6);
}

const getUserByEmail = function (email) {
  for (const userID in users) {
    if (email === users[userID].email) {
      return users[userID];
    }
  }
};
//returns the URLs where the userID is equal to the id of the currently logged-in userID from the cookie.
const urlsForUser = function(id){
  const urlOb = {};
  for (url in urlDatabase){
    if (urlDatabase[url].userID === id){
      const tempOb = {longURL:urlDatabase[url].longURL,userID:urlDatabase[url].userID};
      urlOb[url]=tempOb;
    }
  }
  console.log('urlsForUser', urlOb)
  return urlOb;
};

///////////////POSTS////////////////////////



//registration post
app.post("/register", (req, res) => {
  const newUser = req.body;
  const newUserId = generateRandomString();

  //hashing password
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);


  //error check...
  if (!newUser.email) {
    res.status(400);
    res.send("Please enter a valid email address");
    return;
  }
  if (!newUser.password) {
    res.status(400);
    res.send("Please enter a valid password");
    return;
  }
  if (getUserByEmail(newUser.email)) {
    res.status(400).send("Error 400: Please enter a valid email - email already registered.");;
    return;
  }
  
  //refactor for readability
  /*newUser["id"] = newUserId;
    console.log('newUser["id"]   ' + newUser["id"]);
  users[newUserId] = newUser;
    console.log('users[newUserId]   ' + users[newUserId]);
  users[newUserId]['hashedPassword'] = hashedPassword;
    console.log('users[newUserId][hashedPassword]   ' + users[newUserId][hashedPassword]);*/

    


  users[newUserId]= {
    id: newUserId,
    email: newUser.email,
    password: newUser.password,
    hashedPassword: hashedPassword
  }

  console.log(users[newUserId]);

  res.cookie("user", newUserId);
  res.redirect(`/urls`);
});


//generates random short URL if logged in.
app.post("/urls", (req, res) => {
  
  
  if (req.cookies.user){
    const rndAlpha = generateRandomString();
    urlDatabase[rndAlpha] = {'longURL':req.body.longURL,'userID':req.cookies.user};
    res.redirect(`/urls/${rndAlpha}`);
    return;
  }
  res.send("You need to be logged in to generate new URLS!");
});

//deletes a url entry
app.post("/urls/:id/delete", (req, res) => {
  const urlID = req.params.id;
  
  if (!req.cookies.user){
    res.send('Please login in order to delete a URLS');
  }
  console.log(urlDatabase);
  console.log(urlsForUser(req.cookies.user));
  for (url in urlDatabase){
    if (url === urlID){
      const userURLS = urlsForUser(req.cookies.user);
      for (userURL in userURLS){
        if (userURL === urlID){
          delete urlDatabase[urlID];
          console.log(urlDatabase);
          console.log(urlsForUser(req.cookies.user));
          res.redirect(`/urls/`);
          return;
        }
      }
      res.send("You do not own the URL and cannot delete it");
    }
  }
  res.send("That short URL is not in our database");
  
});

//posts a logout for a cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user");
  res.redirect("/login");
});

//posts a login to generate a cookie..
app.post("/login", (req, res) => {

  //email?
  if (!req.body.email){
    res.status(403).send("Error 403:  Please enter an email and password.");
    return;
  }

  const loginUser = req.body;

  //check our database to see if the email matches our records....
  if (!getUserByEmail(loginUser.email)){
    res.status(403).send("Error 403:  That email is not currently in our database.");
    return;
  }

  //check if passwords match...
  const userId = getUserByEmail(loginUser.email);
  console.log(userId.password, loginUser.password);
  if (!bcrypt.compareSync(loginUser.password, userId.hashedPassword)) {
    res.status(403).send("Error 403:  Incorrect password.");
    return;
  }
  //happy path
  res.cookie("user", userId.id);
  res.redirect("/urls");
});



//posts an update to the URL database from the urls_show page
app.post("/urls/:id/", (req, res) => {
 
  const shortURL = req.params.id;
  if (!req.cookies.user){
    res.send("You need to be logged in to access the shortURLS");
    return;
  }


  for (id in urlDatabase){
    if (shortURL===id){
      urlDatabase[id].longURL = req.body.longURL;
      res.redirect('/urls');
      return;
    }
  }
  
  for (const url in urlDatabase){
    if (url === shortURL)
    {
      res.send("You do not own this URL.");
      return;
    }
  }
  res.send("That short URL does not exist in our database");
  
});

///////////////////GETS///////////////////////////////

app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user"]] };


  if (req.cookies.user){
    res.redirect("/urls");
    return;
  }
  
  res.render("_login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user"]] };

  if (req.cookies.user){
    res.redirect("/urls");
    return;
  }
  res.render("_register", templateVars);
});



app.get("/urls", (req, res) => {
  for (userID in users){
    if(users[userID].id === req.cookies.user){
      const userURLS = urlsForUser(req.cookies.user);
      const templateVars = { urls: userURLS, user: users[req.cookies.user] };
      res.render("urls_index", templateVars);
      return;
    }
  }

  res.redirect("/login");
  
});


app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user"]] };

  if (req.cookies.user){
    res.render("urls_new", templateVars);
    return;
  }
  res.redirect("/login");
});


app.get("/urls/:id", (req, res) => {
  console.log("here in /urls/:id get");
  const userURLS = urlsForUser(req.cookies.user);

  if (!req.cookies.user){
    res.send("Please login to view URLS");
  }

  for (const url in userURLS){
    if (url === req.params.id ){
      const templateVars = {
        id: req.params.id,
        longURL: urlDatabase[req.params.id],
        user: users[req.cookies["user"]],
      };
      console.log('templateVars', templateVars);
      res.render("urls_show", templateVars);
      return;
    }
  }
  res.send("That short URL ID is not in our database.");
});

app.get("/u/:id", (req, res) => {
  console.log("here in /u/:id" , urlDatabase[req.params.id]);
  if (urlDatabase[req.params.id]){
    const longURL = urlDatabase[req.params.id].longURL;
    console.log(longURL);
    res.redirect(longURL);
    return;
  }
  res.send("That short URL ID is not in our database.");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
